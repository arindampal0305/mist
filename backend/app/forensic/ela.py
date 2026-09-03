from PIL import Image, ImageChops, ImageEnhance
import numpy as np
import io

class ELADetector:
    """
    Computes Error Level Analysis (ELA) on incoming images.
    Identifies zones with varying compression historical rates (typical of splicing).
    """
    @staticmethod
    def run_ela_analysis(image_bytes: bytes, quality: int = 90) -> tuple[bytes, float]:
        original = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        resaved_buffer = io.BytesIO()
        original.save(resaved_buffer, format="JPEG", quality=quality)
        resaved_buffer.seek(0)
        resaved = Image.open(resaved_buffer)
        
        diff_img = ImageChops.difference(original, resaved)
        
        extrema = diff_img.getextrema()
        max_diff = max([ex[1] for ex in extrema]) or 1
        scale = 255.0 / max_diff
        enhanced_diff = ImageEnhance.Brightness(diff_img).enhance(scale)
        
        output_buffer = io.BytesIO()
        enhanced_diff.save(output_buffer, format="JPEG")
        
        arr = np.array(diff_img)
        mean_diff = float(np.mean(arr))
        
        tamper_score = float(np.clip(mean_diff / 10.0, 0.0, 1.0))
        
        return output_buffer.getvalue(), tamper_score
