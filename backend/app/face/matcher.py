import cv2
import numpy as np

from .engine import FaceEngine


class FaceMatcher:
    """
    MIST face matching engine.

    Uses the ArcFace recognition model from the shared FaceEngine
    (same buffalo_l pipeline the detector uses) instead of creating
    a second, independent FaceAnalysis instance.
    """

    COSINE_THRESHOLD = 0.45

    @staticmethod
    def _normalize(vector: np.ndarray) -> np.ndarray:
        vector = np.asarray(vector, dtype=np.float32).reshape(-1)
        norm = np.linalg.norm(vector)

        if norm < 1e-12:
            raise ValueError("Face embedding has zero magnitude")

        return vector / norm

    @classmethod
    def create_encoding(cls, aligned_face: np.ndarray):
        """
        Generate an ArcFace embedding from an already aligned
        112x112 face image.
        """
        if aligned_face is None:
            raise ValueError("Aligned face is None")

        if not isinstance(aligned_face, np.ndarray):
            raise ValueError("Aligned face must be a NumPy array")

        if aligned_face.size == 0:
            raise ValueError("Aligned face is empty")

        if len(aligned_face.shape) != 3:
            raise ValueError(f"Invalid aligned face shape: {aligned_face.shape}")

        if aligned_face.shape[0] != 112 or aligned_face.shape[1] != 112:
            aligned_face = cv2.resize(
                aligned_face, (112, 112), interpolation=cv2.INTER_LINEAR
            )

        recognition_model = FaceEngine.get_recognition_model()
        embedding = recognition_model.get_feat(aligned_face)

        if embedding is None:
            raise ValueError("ArcFace recognition model returned no embedding")

        return cls._normalize(embedding)

    @classmethod
    def compare(cls, document_encoding: np.ndarray, live_encoding: np.ndarray):
        """
        Compare two normalized ArcFace embeddings using cosine similarity.
        """
        if document_encoding is None:
            raise ValueError("Document face encoding is missing")

        if live_encoding is None:
            raise ValueError("Live face encoding is missing")

        document_encoding = cls._normalize(document_encoding)
        live_encoding = cls._normalize(live_encoding)

        similarity = float(np.dot(document_encoding, live_encoding))
        similarity = max(-1.0, min(1.0, similarity))
        distance = 1.0 - similarity

        passed = similarity >= cls.COSINE_THRESHOLD

        # UI score -- a presentation score, NOT a probability that the
        # two images belong to the same person.
        score = max(0.0, min(100.0, ((similarity + 1.0) / 2.0) * 100.0))

        return {
            "similarity": round(similarity, 6),
            "distance": round(distance, 6),
            "score": round(score, 2),
            "threshold": cls.COSINE_THRESHOLD,
            "passed": passed,
            "decision": "MATCH" if passed else "NO_MATCH",
            "explanation": (
                "Face embeddings are within the configured "
                "cosine similarity threshold."
                if passed
                else "Face embeddings are below the configured "
                "cosine similarity threshold."
            ),
        }