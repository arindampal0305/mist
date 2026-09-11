try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

import numpy as np
from PIL import Image
import io

class CopyMoveDetector:
    """
    Implements Copy-Move Forgery Detection using DCT block matching (Fridrich et al. 2003).
    Detects duplicated regions within an image (e.g. cloned visa stamps, names, or signatures).
    """

    @staticmethod
    def detect_copy_move(
        image_bytes: bytes, block_size: int = 16, stride: int = 8, threshold: float = 0.98
    ) -> tuple[bytes, float, bool]:
        """
        Runs DCT block matching to identify duplicate image regions.
        Returns:
            - mask_bytes: Base64 JPEG encoded overlay mask showing copied/pasted blocks
            - score: Float tamper score in range [0.0, 1.0]
            - copy_move_flag: True if significant cloned regions detected
        """
        if not HAS_CV2:
            # Fallback if opencv is not installed
            return b"", 0.0, False

        # Decode image to grayscale numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return b"", 0.0, False

        # Resize large images for performance (max dimension 800px)
        h, w = img.shape[:2]
        max_dim = 800
        if max(h, w) > max_dim:
            scale = max_dim / max(h, w)
            img_small = cv2.resize(img, (int(w * scale), int(h * scale)))
        else:
            img_small = img.copy()

        gray = cv2.cvtColor(img_small, cv2.COLOR_BGR2GRAY)
        sh, sw = gray.shape

        blocks = []
        positions = []

        # Extract blocks & compute 2D DCT
        for y in range(0, sh - block_size + 1, stride):
            for x in range(0, sw - block_size + 1, stride):
                block = gray[y : y + block_size, x : x + block_size].astype(np.float32)
                dct = cv2.dct(block)
                # Take top-left 16 low-frequency AC/DC coefficients
                feat = dct[:4, :4].flatten()
                # Quantize for robust matching
                feat_q = (feat / 8.0).astype(np.int32)
                blocks.append(feat_q)
                positions.append((x, y))

        if not blocks:
            return b"", 0.0, False

        blocks_arr = np.array(blocks)

        # Lexicographically sort feature vectors
        dtype = [(f'f{i}', blocks_arr.dtype) for i in range(blocks_arr.shape[1])]
        struct_arr = blocks_arr.view(dtype)
        sort_idx = np.argsort(struct_arr, order=[f'f{i}' for i in range(blocks_arr.shape[1])], axis=0).flatten()

        sorted_pos = [positions[i] for i in sort_idx]

        # Search adjacent sorted blocks for duplicates
        matches = []
        min_dist_sq = (block_size * 2) ** 2  # Ignore adjacent neighboring blocks

        for i in range(len(sort_idx) - 1):
            if np.array_equal(blocks_arr[sort_idx[i]], blocks_arr[sort_idx[i + 1]]):
                p1 = sorted_pos[i]
                p2 = sorted_pos[i + 1]
                dist_sq = (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2
                if dist_sq >= min_dist_sq:
                    matches.append((p1, p2))

        # Build visual overlay mask
        mask = np.zeros((sh, sw, 3), dtype=np.uint8)
        mask[:] = (10, 15, 30)  # Dark background

        for p1, p2 in matches:
            cv2.rectangle(mask, p1, (p1[0] + block_size, p1[1] + block_size), (0, 0, 255), -1)
            cv2.rectangle(mask, p2, (p2[0] + block_size, p2[1] + block_size), (0, 255, 255), -1)
            cv2.line(mask, (p1[0] + block_size // 2, p1[1] + block_size // 2),
                     (p2[0] + block_size // 2, p2[1] + block_size // 2), (0, 255, 0), 1)

        # Calculate tamper score based on match count
        num_matches = len(matches)
        score = min(float(num_matches / 40.0), 1.0)
        copy_move_flag = score > 0.35

        # Resize mask back to original image size
        mask_orig = cv2.resize(mask, (w, h))
        is_success, buffer = cv2.imencode(".jpg", mask_orig)
        mask_bytes = buffer.tobytes() if is_success else b""

        return mask_bytes, round(score, 3), copy_move_flag
