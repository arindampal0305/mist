import threading


class FaceEngine:
    """
    Single shared InsightFace FaceAnalysis instance.

    Both the detector (detection + landmarks) and the matcher
    (recognition only) pull their models from this one instance
    instead of each creating their own FaceAnalysis pipeline.

    Benefits:
    - Models load once, not twice (faster startup, half the memory)
    - A model-loading failure only needs to be diagnosed in one place
    - Thread-safe lazy initialization
    """

    _app = None
    _lock = threading.Lock()

    MODEL_NAME = "buffalo_l"
    DET_SIZE = (640, 640)

    @classmethod
    def get_app(cls):
        if cls._app is None:
            with cls._lock:
                if cls._app is None:
                    cls._app = cls._build_app()
        return cls._app

    @classmethod
    def _build_app(cls):
        try:
            from insightface.app import FaceAnalysis
        except ImportError as exc:
            raise RuntimeError(
                "InsightFace is not installed. "
                "Run: pip install insightface onnxruntime"
            ) from exc

        try:
            app = FaceAnalysis(
                name=cls.MODEL_NAME,
                providers=["CPUExecutionProvider"],
            )
            app.prepare(ctx_id=-1, det_size=cls.DET_SIZE)
        except Exception as exc:
            raise RuntimeError(
                "Failed to load InsightFace 'buffalo_l' models. This "
                "almost always means one or more .onnx files under "
                "~/.insightface/models/buffalo_l are corrupted or "
                "incomplete (a failed/interrupted download). Run "
                "verify_models.py --fix to check and re-download them. "
                f"Original error: {exc}"
            ) from exc

        return app

    @classmethod
    def get_recognition_model(cls):
        app = cls.get_app()
        if "recognition" not in app.models:
            raise RuntimeError("ArcFace recognition model was not loaded")
        return app.models["recognition"]

    @classmethod
    def reset(cls):
        """Force a reload on next access (e.g. after fixing model files)."""
        with cls._lock:
            cls._app = None