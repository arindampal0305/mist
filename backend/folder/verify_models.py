"""
Verify (and fix) InsightFace buffalo_l model files.

Corrupted / truncated .onnx files are the #1 cause of:
    google.protobuf.message.DecodeError: Error parsing message
    with type 'onnx.ModelProto'

This usually happens when the buffalo_l.zip download was interrupted
(flaky network, antivirus intercepting the download, disk full, etc).

Usage:
    python verify_models.py          # just check
    python verify_models.py --fix    # check + delete corrupted files so
                                      # InsightFace re-downloads them fresh
"""

import os
import sys
import shutil

try:
    import onnx
except ImportError:
    print("Missing dependency. Run: pip install onnx")
    sys.exit(1)

MODEL_DIR = os.path.join(
    os.path.expanduser("~"), ".insightface", "models", "buffalo_l"
)

EXPECTED_FILES = [
    "1k3d68.onnx",
    "2d106det.onnx",
    "det_10g.onnx",
    "genderage.onnx",
    "w600k_r50.onnx",
]


def check_file(path):
    if not os.path.exists(path):
        return False, "missing"

    size = os.path.getsize(path)
    if size < 1024:
        # Real model files are multiple MB. A file this small is almost
        # certainly an HTML error page or a Git LFS pointer saved with
        # a .onnx extension by mistake.
        return False, f"suspiciously small ({size} bytes)"

    try:
        model = onnx.load(path)
        onnx.checker.check_model(model)
    except Exception as exc:
        return False, f"failed to parse: {exc}"

    return True, f"ok ({size / 1_000_000:.1f} MB)"


def main():
    fix = "--fix" in sys.argv

    if not os.path.isdir(MODEL_DIR):
        print(f"Model directory not found: {MODEL_DIR}")
        print("Nothing to check yet -- it will be created on first run.")
        return

    print(f"Checking models in: {MODEL_DIR}\n")

    bad_files = []

    for filename in EXPECTED_FILES:
        path = os.path.join(MODEL_DIR, filename)
        ok, message = check_file(path)
        status = "OK  " if ok else "BAD "
        print(f"[{status}] {filename:<20} {message}")
        if not ok:
            bad_files.append(path)

    print()

    if not bad_files:
        print("All model files are valid. The DecodeError is not coming "
              "from these files -- check for a partial re-download or a "
              "second buffalo_l folder elsewhere on disk.")
        return

    print(f"{len(bad_files)} file(s) are corrupted or missing.")

    if fix:
        print("Deleting the whole buffalo_l folder so InsightFace "
              "re-downloads a clean copy on next run...")
        shutil.rmtree(MODEL_DIR)
        print("Done. Restart uvicorn; InsightFace will automatically "
              "re-download buffalo_l.zip the next time FaceAnalysis() "
              "is created.")
    else:
        print("Re-run this script with --fix to delete and let "
              "InsightFace re-download them automatically:\n"
              "    python verify_models.py --fix\n"
              "Or delete the folder yourself:\n"
              f"    {MODEL_DIR}")


if __name__ == "__main__":
    main()