import re
import io
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter
from .mrz import ICAO9303Validator

# ── EasyOCR (primary) ──────────────────────────────────────────────
_EASY_READER = None

def _get_reader():
    global _EASY_READER
    if _EASY_READER is not None:
        return _EASY_READER
    try:
        import easyocr
        _EASY_READER = easyocr.Reader(['en'], gpu=False, verbose=False)
        return _EASY_READER
    except Exception:
        return None

# ── Tesseract (fallback) ──────────────────────────────────────────
HAS_TESSERACT = False
try:
    import pytesseract, shutil, os
    tess_cmd = shutil.which('tesseract')
    if not tess_cmd:
        for p in [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        ]:
            if os.path.exists(p):
                tess_cmd = p
                break
    if tess_cmd:
        pytesseract.pytesseract.tesseract_cmd = tess_cmd
        HAS_TESSERACT = True
except ImportError:
    pass


# ── Helpers ───────────────────────────────────────────────────────

def _clean_mrz_line(raw: str) -> str:
    """Sanitise an OCR string into valid MRZ chars [A-Z0-9<].
    Handles common OCR misreads: C/E/S runs as '<' fillers, digit/letter swaps."""
    s = raw.upper().strip()
    # Replace known bracket/punctuation variants with '<'
    for ch in ' «‹(){}[]—–-.,;~`\'"\\/_':
        s = s.replace(ch, '<')
    # Strip anything not alphanumeric or '<'
    s = re.sub(r'[^A-Z0-9<]', '', s)

    # In MRZ, filler regions are runs of '<<<...'. OCR often reads these
    # as repeated C, E, S, or 4/8 characters. Detect runs of 3+ identical
    # non-meaningful chars and convert to '<' runs.
    def _fix_filler_runs(line: str) -> str:
        result = list(line)
        i = 0
        while i < len(result):
            j = i
            while j < len(result) and result[j] == result[i]:
                j += 1
            run_len = j - i
            ch = result[i]
            if run_len >= 3 and ch in ('C', 'E', 'S', '4', '8', 'K', 'X'):
                for k in range(i, j):
                    result[k] = '<'
            i = j
        return ''.join(result)

    s = _fix_filler_runs(s)

    # Replace trailing filler runs if ending with repeated non-MRZ symbols
    if len(s) >= 3:
        tail = s[-3:]
        if tail[0] == tail[1] == tail[2] and tail[0] in ('C', 'E', 'S', '4', '8', 'K', 'X'):
            ch = tail[0]
            idx = len(s) - 1
            while idx >= 0 and s[idx] == ch:
                idx -= 1
            s = s[:idx + 1] + '<' * (len(s) - idx - 1)

    return s


def _find_mrz_pair(lines: list[str]) -> tuple[str, str]:
    """Find two consecutive 44-char MRZ lines from a list of cleaned strings."""
    candidates = [l for l in lines if len(l) >= 30]

    # Look for consecutive pair where line1 starts with P
    for i in range(len(candidates) - 1):
        l1, l2 = candidates[i], candidates[i + 1]
        if l1.startswith('P') and len(l1) >= 40 and len(l2) >= 40:
            return l1[:44].ljust(44, '<'), l2[:44].ljust(44, '<')

    # Fallback: any P-line + any other long line
    p_line = next((c for c in candidates if c.startswith('P') and len(c) >= 40), None)
    other  = next((c for c in candidates if not c.startswith('P') and len(c) >= 40), None)
    if p_line and other:
        return p_line[:44].ljust(44, '<'), other[:44].ljust(44, '<')

    return "", ""


def _preprocess_for_ocr(img: Image.Image) -> np.ndarray:
    """Convert PIL image to a high-contrast binary numpy array for OCR."""
    gray = img.convert("L")
    gray = ImageEnhance.Contrast(gray).enhance(2.5)
    gray = gray.filter(ImageFilter.SHARPEN)
    w, h = gray.size
    gray = gray.resize((w * 3, h * 3), Image.Resampling.LANCZOS)
    arr = np.array(gray)
    _, binary = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return binary


# ── Main class ────────────────────────────────────────────────────

class DocumentOCR:
    """
    Real OCR-based MRZ extraction engine.
    Primary: EasyOCR (torch-based, no system binary needed).
    Fallback: Tesseract (if installed).
    """

    @classmethod
    def process_document(cls, image_bytes: bytes) -> dict:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        w, h = img.size

        # Crop bottom 35 % — MRZ lives there
        mrz_crop = img.crop((0, int(h * 0.60), w, h))

        line1, line2 = "", ""

        # ── Try EasyOCR first ─────────────────────────────────────
        reader = _get_reader()
        if reader is not None:
            line1, line2 = cls._ocr_with_easyocr(reader, mrz_crop)
            if not line1 or not line2:
                # Retry on full image
                line1, line2 = cls._ocr_with_easyocr(reader, img)

        # ── Fallback: Tesseract ───────────────────────────────────
        if (not line1 or not line2) and HAS_TESSERACT:
            line1, line2 = cls._ocr_with_tesseract(mrz_crop)
            if not line1 or not line2:
                line1, line2 = cls._ocr_with_tesseract(img)

        # ── If OCR produced nothing ───────────────────────────────
        if not line1 or not line2:
            return {
                "doc_no": "OCR_FAILED",
                "doc_passed": False,
                "dob": "Could not read MRZ",
                "dob_passed": False,
                "comp_passed": False,
                "raw_line1": "MRZ not detected — ensure the full passport bio-data page is visible",
                "raw_line2": "",
            }

        return cls._parse_mrz_lines(line1, line2)

    # ── EasyOCR path ──────────────────────────────────────────────
    @staticmethod
    def _ocr_with_easyocr(reader, pil_img: Image.Image) -> tuple[str, str]:
        try:
            # 1. Try on raw image array (EasyOCR's CRAFT detector excels at RGB crops)
            raw_arr = np.array(pil_img)
            results = reader.readtext(raw_arr, detail=0)
            cleaned = [_clean_mrz_line(r) for r in results]
            l1, l2 = _find_mrz_pair(cleaned)
            if l1 and l2:
                return l1, l2

            # 2. Try on preprocessed binary array if raw crop yielded no pair
            prep_arr = _preprocess_for_ocr(pil_img)
            results2 = reader.readtext(prep_arr, detail=0)
            cleaned2 = [_clean_mrz_line(r) for r in results2]
            return _find_mrz_pair(cleaned2)
        except Exception:
            return "", ""

    # ── Tesseract path ────────────────────────────────────────────
    @staticmethod
    def _ocr_with_tesseract(pil_img: Image.Image) -> tuple[str, str]:
        try:
            arr = _preprocess_for_ocr(pil_img)
            cfg = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<'
            raw = pytesseract.image_to_string(Image.fromarray(arr), config=cfg)
            cleaned = [_clean_mrz_line(l) for l in raw.split('\n')]
            return _find_mrz_pair(cleaned)
        except Exception:
            return "", ""

    # ── Parse & validate ──────────────────────────────────────────
    @staticmethod
    def _parse_mrz_lines(line1: str, line2: str) -> dict:
        try:
            parsed = ICAO9303Validator.parse_passport_td3(line1, line2)
            doc_no     = parsed["document_number"]["val"]
            dob        = parsed["dob"]["val"]
            doc_passed = parsed["document_number"]["passed"]
            dob_passed = parsed["dob"]["passed"]
            comp_passed = parsed["composite"]["passed"]
        except Exception:
            doc_no = line2[0:9].replace("<", "") if len(line2) >= 9 else "UNKNOWN"
            dob_raw = line2[13:19] if len(line2) >= 19 else ""
            if len(dob_raw) == 6 and dob_raw.isdigit():
                yy = int(dob_raw[:2])
                pfx = "19" if yy > 25 else "20"
                dob = f"{pfx}{dob_raw[:2]}-{dob_raw[2:4]}-{dob_raw[4:6]}"
            else:
                dob = "Unknown"
            doc_passed = dob_passed = comp_passed = False

        return {
            "doc_no": doc_no,
            "doc_passed": doc_passed,
            "dob": dob,
            "dob_passed": dob_passed,
            "comp_passed": comp_passed,
            "raw_line1": line1,
            "raw_line2": line2,
        }
