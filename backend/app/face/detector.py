import cv2
import numpy as np

from .engine import FaceEngine


class FaceDetector:
    """
    Face detection and alignment using InsightFace.

    Responsibilities:
    - Decode uploaded/camera image
    - Detect faces
    - Select the primary face
    - Use InsightFace's 5-point landmarks
    - Return a properly aligned 112x112 face crop

    Model loading is delegated to FaceEngine, which is shared with
    FaceMatcher so buffalo_l is only loaded once per process.
    """

    @staticmethod
    def _decode(image_bytes: bytes):
        if not image_bytes:
            raise ValueError("Empty image")

        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            raise ValueError("Unable to decode image")

        return image

    @staticmethod
    def _select_best_face(faces):
        if not faces:
            return None

        # Prefer the largest usable face.
        best_face = None
        best_area = 0

        for face in faces:
            x1, y1, x2, y2 = face.bbox
            width = max(0.0, x2 - x1)
            height = max(0.0, y2 - y1)
            area = width * height

            if area > best_area:
                best_area = area
                best_face = face

        return best_face

    @staticmethod
    def _align_face(image, face):
        """
        Align face using InsightFace's five facial landmarks.
        ArcFace expects a normalized 112x112 face.
        """
        if face is None:
            raise ValueError("No face supplied")

        landmarks = getattr(face, "kps", None)
        if landmarks is None:
            raise ValueError("Facial landmarks were not detected")

        landmarks = np.asarray(landmarks, dtype=np.float32)
        if landmarks.shape != (5, 2):
            raise ValueError("Invalid facial landmark format")

        try:
            from insightface.utils import face_align

            aligned = face_align.norm_crop(
                image,
                landmark=landmarks,
                image_size=112,
            )
        except Exception as exc:
            raise ValueError(f"Unable to align face: {exc}") from exc

        if aligned is None or aligned.size == 0:
            raise ValueError("Aligned face is empty")

        return aligned

    @classmethod
    def detect(cls, image_bytes: bytes):
        """
        Detect faces in an image.

        Returns:
            image: Original BGR image.
            faces: InsightFace face objects.
        """
        image = cls._decode(image_bytes)
        app = FaceEngine.get_app()
        faces = app.get(image)
        return image, faces

    @classmethod
    def detect_and_align(cls, image_bytes: bytes):
        """
        Full pipeline: bytes -> decode -> detect -> primary face ->
        5-point landmark alignment -> 112x112 face.

        Returns:
            image, faces, primary_face, aligned_face
        """
        image = cls._decode(image_bytes)
        app = FaceEngine.get_app()
        faces = app.get(image)

        if faces is None or len(faces) == 0:
            raise ValueError("No face detected")

        primary_face = cls._select_best_face(faces)
        if primary_face is None:
            raise ValueError("Unable to select a face")

        aligned_face = cls._align_face(image, primary_face)

        return image, faces, primary_face, aligned_face