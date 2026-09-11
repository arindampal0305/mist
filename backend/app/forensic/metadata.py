from PIL import Image, ExifTags
import io
import json
import subprocess

SUSPICIOUS_SOFTWARE = [
    "photoshop", "gimp", "affinity", "paint.net",
    "lightroom", "corel", "inkscape", "canva", "pixlr"
]

class MetadataForensics:
    """
    Analyzes EXIF and container metadata to detect software editing signatures,
    timestamp discrepancies, and missing device metadata.
    """

    @staticmethod
    def analyze_metadata(image_bytes: bytes) -> dict:
        """
        Parses EXIF tags from raw image bytes.
        Returns:
            - flags: List of warning strings
            - score: Float risk score [0.0, 1.0]
            - raw_exif: Dictionary of key-value EXIF pairs
        """
        flags = []
        raw_exif = {}

        try:
            img = Image.open(io.BytesIO(image_bytes))
            exif = img._getexif()

            if exif:
                for tag_id, value in exif.items():
                    tag = ExifTags.TAGS.get(tag_id, str(tag_id))
                    # Handle bytes/binary metadata for JSON serialization
                    if isinstance(value, bytes):
                        value = value.decode("latin-1", errors="ignore")
                    raw_exif[tag] = str(value)

                # Check 1: Suspicious editing software signature
                software = raw_exif.get("Software", "").lower()
                for sw in SUSPICIOUS_SOFTWARE:
                    if sw in software:
                        flags.append(f"SUSPICIOUS_SOFTWARE_DETECTED: {raw_exif.get('Software')}")
                        break

                # Check 2: Camera Make/Model missing on photo scan
                make = raw_exif.get("Make")
                model = raw_exif.get("Model")
                if not make and not model:
                    flags.append("MISSING_CAMERA_HARDWARE_METADATA")

                # Check 3: DateTime Original vs DateTime Digitized vs DateTime
                dt_orig = raw_exif.get("DateTimeOriginal")
                dt_mod = raw_exif.get("DateTime")
                if dt_orig and dt_mod and dt_orig != dt_mod:
                    flags.append(f"METADATA_TIMESTAMP_MISMATCH: Created {dt_orig}, Modified {dt_mod}")
            else:
                flags.append("NO_EXIF_DATA_FOUND")

        except Exception as e:
            flags.append(f"EXIF_PARSE_WARNING: {str(e)}")

        # Score calculation: Each flag adds 0.25 risk
        score = min(float(len(flags) * 0.25), 1.0)

        return {
            "flags": flags,
            "score": round(score, 3),
            "raw_exif": raw_exif
        }
