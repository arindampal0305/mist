import cv2
import numpy as np


class LivenessDetector:
    """
    Passive, multi-signal liveness heuristic.

    IMPORTANT -- read before relying on this for anything beyond a
    demo/prototype:

    This is NOT a trained anti-spoofing network (e.g. MiniFASNet /
    Silent-Face-Anti-Spoofing). It combines several classic
    image-forensics signals that are reasonably effective against
    *casual* spoofing -- a printed photo or a phone/tablet screen
    held up to the camera -- but it will NOT reliably catch a
    high-quality replay attack or a 3D mask. Treat "passed" as a
    first-pass filter, not a security guarantee.

    Signals used (each scored 0-100, 100 = looks live):
      - sharpness  : Laplacian variance. Too blurry (flat print/low-res
                     screen) or too aliased (screen recapture) both
                     score low.
      - moire      : 2D FFT peak analysis. Screens and halftone prints
                     create a periodic pixel/dot grid that shows up as
                     strong off-center frequency peaks; a face
                     photographed directly does not.
      - color      : Saturation level/spread + blue-cast check. Screen
                     recaptures often skew blue/cyan; flat prints often
                     have compressed, low-saturation color.
      - reflection : Ratio of clipped-white pixels. Glossy prints and
                     screens produce small hard-edged specular
                     highlights that skin under normal lighting rarely
                     produces at the same scale.
      - motion     : Frame-to-frame difference across 2+ frames. A real
                     person has small natural micro-movement; a photo
                     held still has near-zero difference. (Neutral if
                     only 1 frame is supplied.)

    Upgrade path: replace `check()`'s internals with a real MiniFASNet
    ONNX model (see e.g. huggingface.co/garciafido/minifasnet-v2-anti-
    spoofing-onnx) when you're ready -- keep the same
    `check(frames) -> dict` interface so main.py doesn't need to change.
    """

    W_SHARPNESS = 0.25
    W_MOIRE = 0.30
    W_COLOR = 0.15
    W_REFLECTION = 0.15
    W_MOTION = 0.15

    PASS_THRESHOLD = 55.0  # out of 100, tune against real test captures

    _face_cascade = None

    # ---------------------------------------------------------
    # Face cascade -- lightweight, just to crop to the face region so
    # background clutter doesn't dilute the signals. Falls back to the
    # full frame if no face is found.
    # ---------------------------------------------------------

    @classmethod
    def _get_cascade(cls):
        if cls._face_cascade is None:
            cascade_path = (
                cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            )
            cls._face_cascade = cv2.CascadeClassifier(cascade_path)
        return cls._face_cascade

    @classmethod
    def _crop_to_face(cls, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        cascade = cls._get_cascade()

        faces = cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80)
        )

        if len(faces) == 0:
            return frame

        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])

        pad_x, pad_y = int(w * 0.15), int(h * 0.15)
        x0 = max(0, x - pad_x)
        y0 = max(0, y - pad_y)
        x1 = min(frame.shape[1], x + w + pad_x)
        y1 = min(frame.shape[0], y + h + pad_y)

        return frame[y0:y1, x0:x1]

    # ---------------------------------------------------------
    # Individual signals
    # ---------------------------------------------------------

    @staticmethod
    def _sharpness_score(gray):
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()

        if variance < 20:
            return max(0.0, variance / 20 * 40)
        if variance > 1500:
            return max(0.0, 100 - (variance - 1500) / 30)
        return 100.0

    @staticmethod
    def _moire_score(gray):
        gray = cv2.resize(gray, (256, 256))
        f = np.fft.fft2(gray.astype(np.float32))
        fshift = np.fft.fftshift(f)
        magnitude = np.log(np.abs(fshift) + 1)

        h, w = magnitude.shape
        cy, cx = h // 2, w // 2

        mask = np.ones_like(magnitude, dtype=bool)
        r = 12
        mask[cy - r:cy + r, cx - r:cx + r] = False

        mid_band = magnitude[mask]
        if mid_band.size == 0:
            return 100.0

        peak_ratio = mid_band.max() / (mid_band.mean() + 1e-6)

        if peak_ratio < 3.0:
            return 100.0
        if peak_ratio > 8.0:
            return 0.0

        return float(100.0 - ((peak_ratio - 3.0) / 5.0) * 100.0)

    @staticmethod
    def _color_score(face_bgr):
        hsv = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2HSV)
        _, s, _ = cv2.split(hsv)

        sat_mean = float(np.mean(s))
        sat_std = float(np.std(s))

        score = 100.0

        if sat_mean < 20:
            score -= 40
        if sat_std < 10:
            score -= 20

        b, g, r = cv2.split(face_bgr.astype(np.float32))
        blue_bias = float(np.mean(b) - np.mean(r))
        if blue_bias > 25:
            score -= 30

        return max(0.0, min(100.0, score))

    @staticmethod
    def _reflection_score(face_bgr):
        hsv = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2HSV)
        v = hsv[:, :, 2]

        bright_ratio = np.sum(v > 245) / v.size

        if bright_ratio < 0.005:
            return 100.0
        if bright_ratio > 0.05:
            return 0.0

        return float(100.0 - (bright_ratio / 0.05) * 100.0)

    @staticmethod
    def _motion_score(faces_gray):
        if len(faces_gray) < 2:
            return 60.0  # neutral -- can't judge motion from 1 frame

        diffs = []
        ref_shape = faces_gray[0].shape

        for i in range(1, len(faces_gray)):
            a = cv2.resize(faces_gray[i - 1], (ref_shape[1], ref_shape[0]))
            b = cv2.resize(faces_gray[i], (ref_shape[1], ref_shape[0]))
            diffs.append(float(np.mean(cv2.absdiff(a, b))))

        avg_diff = float(np.mean(diffs))

        if avg_diff < 0.3:
            return 10.0   # suspiciously static -- likely a still photo
        if avg_diff > 40:
            return 30.0   # excessive motion -- shaky capture

        return 100.0

    # ---------------------------------------------------------
    # Public API -- same signature/return shape as before
    # ---------------------------------------------------------

    @classmethod
    def check(cls, frames):
        if frames is None or len(frames) == 0:
            return {
                "passed": False,
                "score": 0.0,
                "status": "NO_CAPTURE",
                "signals": {},
            }

        valid_frames = [
            f for f in frames
            if isinstance(f, np.ndarray) and f.size > 0
        ]

        if len(valid_frames) == 0:
            return {
                "passed": False,
                "score": 0.0,
                "status": "INVALID_CAPTURE",
                "signals": {},
            }

        faces_bgr = [cls._crop_to_face(f) for f in valid_frames]
        faces_gray = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in faces_bgr]

        sharpness = float(np.mean([cls._sharpness_score(g) for g in faces_gray]))
        moire = float(np.mean([cls._moire_score(g) for g in faces_gray]))
        color = float(np.mean([cls._color_score(f) for f in faces_bgr]))
        reflection = float(np.mean([cls._reflection_score(f) for f in faces_bgr]))
        motion = cls._motion_score(faces_gray)

        overall = (
            sharpness * cls.W_SHARPNESS
            + moire * cls.W_MOIRE
            + color * cls.W_COLOR
            + reflection * cls.W_REFLECTION
            + motion * cls.W_MOTION
        )

        passed = overall >= cls.PASS_THRESHOLD

        return {
            "passed": passed,
            "score": round(overall, 2),
            "status": "LIVE" if passed else "SPOOF_SUSPECTED",
            "signals": {
                "sharpness": round(sharpness, 2),
                "moire": round(moire, 2),
                "color": round(color, 2),
                "reflection": round(reflection, 2),
                "motion": round(motion, 2),
                "frames_used": len(valid_frames),
            },
        }