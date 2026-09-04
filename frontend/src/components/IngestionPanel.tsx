
import React, { useRef, useState } from 'react';
import {
  Upload,
  Camera,
  ShieldCheck,
  FileWarning,
  AlertTriangle,
  Skull,
  Settings,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Props {
  onScenarioSelect: (id: string) => void;
  loading: boolean;
}

const scenarios = [
  {
    id: 'clean_passport',
    label: 'S1 - Clean Passport',
    icon: ShieldCheck,
  },
  {
    id: 'spliced_photo',
    label: 'S2 - Spliced Photo',
    icon: FileWarning,
  },
  {
    id: 'dob_alteration',
    label: 'S3 - DOB Alteration',
    icon: AlertTriangle,
  },
  {
    id: 'watchlist_hit',
    label: 'S4 - Watchlist Hit',
    icon: Skull,
  },
];

const API_BASE = 'http://127.0.0.1:8000';

export const IngestionPanel: React.FC<Props> = ({
  onScenarioSelect,
  loading,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);

  // ============================================================
  // MRZ STATE
  // ============================================================

  const [mrzLine1, setMrzLine1] = useState('');
  const [mrzLine2, setMrzLine2] = useState('');
  const [mrzResult, setMrzResult] = useState<any>(null);
  const [mrzLoading, setMrzLoading] = useState(false);
  const [mrzError, setMrzError] = useState('');

  // ============================================================
  // FACE / CAMERA STATE
  // ============================================================

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [verificationId, setVerificationId] = useState<string | null>(
    null
  );

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(
    null
  );

  const [documentFaceLoading, setDocumentFaceLoading] = useState(false);
  const [faceVerificationLoading, setFaceVerificationLoading] =
    useState(false);

  const [faceError, setFaceError] = useState('');
  const [documentFaceStatus, setDocumentFaceStatus] = useState('');
  const [faceResult, setFaceResult] = useState<any>(null);

  // ============================================================
  // DOCUMENT PREVIEW
  // ============================================================

  const createDocumentPreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setDocumentPreview(url);
    } else {
      setDocumentPreview(null);
    }
  };

  // ============================================================
  // REGISTER DOCUMENT FACE
  // ============================================================

  const registerDocumentFace = async (file: File) => {
    setDocumentFaceLoading(true);
    setFaceError('');
    setDocumentFaceStatus('');
    setFaceResult(null);
    setVerificationId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${API_BASE}/api/face/register-document`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Could not extract a face from the uploaded document.'
        );
      }

      if (!data.verification_id) {
        throw new Error(
          'Backend did not return a verification ID.'
        );
      }

      setVerificationId(data.verification_id);

      setDocumentFaceStatus(
        'Document face detected and registered successfully.'
      );
    } catch (error) {
      setDocumentFaceStatus(
        'Document uploaded, but a face could not be registered.'
      );

      setFaceError(
        error instanceof Error
          ? error.message
          : 'Unable to register document face.'
      );
    } finally {
      setDocumentFaceLoading(false);
    }
  };

  // ============================================================
  // FILE SELECTED
  // ============================================================

  const handleFileSelected = (file: File) => {
    setFileName(file.name);

    createDocumentPreview(file);

    setCapturedImage(null);
    setFaceResult(null);
    setFaceError('');
    setDocumentFaceStatus('');

    registerDocumentFace(file);
  };

  // ============================================================
  // DRAG & DROP
  // ============================================================

  const handleDrag = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      e.type === 'dragenter' ||
      e.type === 'dragover'
    ) {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      handleFileSelected(e.target.files[0]);
    }

    e.target.value = '';
  };

  // ============================================================
  // CAMERA START
  // ============================================================

  const startCamera = async () => {
    setFaceError('');
    setFaceResult(null);

    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          'Camera access is not supported by this browser.'
        );
      }

      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        cameraStreamRef.current = null;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: {
              ideal: 1280,
            },
            height: {
              ideal: 720,
            },
          },
          audio: false,
        });

      cameraStreamRef.current = stream;

      setCapturedImage(null);
      setCameraActive(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          videoRef.current
            .play()
            .catch(() => {});
        }
      }, 100);
    } catch (error) {
      setCameraActive(false);

      setFaceError(
        error instanceof Error
          ? error.message
          : 'Unable to access camera.'
      );
    }
  };

  // ============================================================
  // CAMERA STOP
  // ============================================================

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  // ============================================================
  // CAPTURE FACE
  // ============================================================

  const captureFace = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setFaceError('Camera is not ready.');
      return;
    }

    if (
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setFaceError(
        'Camera image is not ready yet. Please wait a moment.'
      );
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');

    if (!context) {
      setFaceError(
        'Unable to capture camera image.'
      );
      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const imageData = canvas.toDataURL(
      'image/jpeg',
      0.92
    );

    setCapturedImage(imageData);

    stopCamera();
  };

  // ============================================================
  // RETAKE FACE
  // ============================================================

  const retakeFace = async () => {
    setCapturedImage(null);
    setFaceResult(null);
    setFaceError('');

    await startCamera();
  };

  // ============================================================
  // VERIFY IDENTITY
  // ============================================================

  const verifyIdentity = async () => {
    if (!verificationId) {
      setFaceError(
        'No document face is registered. Upload a clear document containing a visible face first.'
      );
      return;
    }

    if (!capturedImage) {
      setFaceError(
        'Capture a live face before verification.'
      );
      return;
    }

    setFaceVerificationLoading(true);
    setFaceError('');
    setFaceResult(null);

    try {
      const response = await fetch(
        capturedImage
      );

      const blob = await response.blob();

      const liveFile = new File(
        [blob],
        'live-face.jpg',
        {
          type: 'image/jpeg',
        }
      );

      const formData = new FormData();

      formData.append(
        'file',
        liveFile
      );

      const verifyResponse = await fetch(
        `${API_BASE}/api/face/verify?verification_id=${encodeURIComponent(
          verificationId
        )}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(
          data?.detail ||
            'Face verification failed.'
        );
      }

      setFaceResult(data);
    } catch (error) {
      setFaceError(
        error instanceof Error
          ? error.message
          : 'Unable to verify identity.'
      );
    } finally {
      setFaceVerificationLoading(false);
    }
  };

  // ============================================================
  // MRZ INPUT
  // ============================================================

  const handleLine1Change = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMrzLine1(e.target.value);
    setMrzResult(null);
    setMrzError('');
  };

  const handleLine2Change = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMrzLine2(e.target.value);
    setMrzResult(null);
    setMrzError('');
  };

  // ============================================================
  // MRZ VERIFICATION
  // ============================================================

  const handleMrzVerify = async () => {
    setMrzError('');
    setMrzResult(null);
    setMrzLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/mrz/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            line1: mrzLine1,
            line2: mrzLine2,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'MRZ verification failed.'
        );
      }

      setMrzResult(data);
    } catch (error) {
      setMrzError(
        error instanceof Error
          ? error.message
          : 'Unable to connect to MIST backend.'
      );
    } finally {
      setMrzLoading(false);
    }
  };

  // ============================================================
  // RESULT STATUS
  // ============================================================

  const renderResultStatus = (
    passed: boolean | undefined
  ) => {
    if (passed === true) {
      return (
        <span className="flex items-center gap-1 text-green-700 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          PASS
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-red-700 font-medium">
        <XCircle className="w-3 h-3" />
        FAIL
      </span>
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="p-4 space-y-4 font-sans">

      {/* ======================================================
          DOCUMENT SCANNER
      ====================================================== */}

      <div className="space-y-1">

        <p className="text-xs text-gray-700 font-medium">
          Document Scanner
        </p>

        <div
          className={`
            relative
            flex flex-col items-center justify-center
            p-4
            border border-dashed
            rounded-lg
            transition-all
            ${
              dragActive
                ? 'border-navy bg-canvas'
                : 'border-gray-300 hover:border-gray-400 bg-canvas/40'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >

          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,application/pdf"
            onChange={handleFileInput}
            className="
              absolute
              inset-0
              w-full
              h-full
              opacity-0
              cursor-pointer
            "
          />

          <Upload className="w-4 h-4 mb-1 text-gray-600" />

          <span className="text-xs text-gray-800 font-medium">
            {fileName || 'Drop passport, Aadhaar or document'}
          </span>

          <span className="text-[11px] text-gray-500 font-normal mt-0.5">
            JPG, PNG, PDF
          </span>

          {documentFaceLoading && (
            <span className="text-[10px] text-gray-500 mt-1">
              Checking document face...
            </span>
          )}

          {documentFaceStatus && (
            <span
              className={`
                text-[10px]
                mt-1
                font-medium
                ${
                  verificationId
                    ? 'text-green-700'
                    : 'text-orange-700'
                }
              `}
            >
              {documentFaceStatus}
            </span>
          )}

        </div>

        {/* DOCUMENT PREVIEW */}

        {documentPreview && (
          <div
            className="
              mt-2
              border
              border-gray-300
              rounded-lg
              overflow-hidden
              bg-gray-50
            "
          >

            <div
              className="
                px-2.5
                py-1.5
                border-b
                border-gray-200
                text-[10px]
                font-medium
                text-gray-600
              "
            >
              UPLOADED DOCUMENT
            </div>

            <div className="p-2 flex justify-center">

              <img
                src={documentPreview}
                alt="Uploaded document"
                className="
                  max-h-48
                  max-w-full
                  object-contain
                  rounded
                "
              />

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          PASSPORT MRZ VERIFICATION
      ====================================================== */}

      <div className="space-y-2">

        <div className="flex items-center justify-between">

          <p className="text-xs text-gray-700 font-medium">
            Passport MRZ Verification
          </p>

          <span className="text-[10px] text-gray-400 font-mono">
            TD3 / 44×2
          </span>

        </div>

        <input
          type="text"
          value={mrzLine1}
          onChange={handleLine1Change}
          placeholder="MRZ Line 1"
          maxLength={44}
          spellCheck={false}
          autoComplete="off"
          className="
            w-full
            px-2.5
            py-2
            text-[11px]
            font-mono
            border
            border-gray-300
            rounded-lg
            bg-white
            focus:outline-none
            focus:border-gray-500
          "
        />

        <input
          type="text"
          value={mrzLine2}
          onChange={handleLine2Change}
          placeholder="MRZ Line 2"
          maxLength={44}
          spellCheck={false}
          autoComplete="off"
          className="
            w-full
            px-2.5
            py-2
            text-[11px]
            font-mono
            border
            border-gray-300
            rounded-lg
            bg-white
            focus:outline-none
            focus:border-gray-500
          "
        />

        <button
          type="button"
          onClick={handleMrzVerify}
          disabled={mrzLoading}
          className="
            w-full
            py-2
            rounded-lg
            bg-navy
            text-white
            text-xs
            font-medium
            hover:opacity-90
            disabled:opacity-50
            transition-opacity
          "
        >
          {mrzLoading
            ? 'Verifying...'
            : 'Verify MRZ'}
        </button>

        {mrzError && (
          <div
            className="
              p-2.5
              rounded-lg
              border
              border-red-300
              bg-red-50
              text-[11px]
              text-red-700
            "
          >
            <div className="flex items-start gap-1.5">

              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />

              <span>
                {mrzError}
              </span>

            </div>
          </div>
        )}

        {mrzResult && (
          <div
            className="
              space-y-1.5
              p-2.5
              rounded-lg
              border
              border-gray-300
              bg-gray-50
            "
          >

            <div className="flex items-center justify-between text-[11px]">

              <span className="text-gray-600">
                Document Number
              </span>

              {renderResultStatus(
                mrzResult.document_number?.passed
              )}

            </div>

            <div className="flex items-center justify-between text-[11px]">

              <span className="text-gray-600">
                DOB
              </span>

              {renderResultStatus(
                mrzResult.dob?.passed
              )}

            </div>

            <div className="flex items-center justify-between text-[11px]">

              <span className="text-gray-600">
                Expiry
              </span>

              {renderResultStatus(
                mrzResult.expiry?.passed
              )}

            </div>

            <div className="flex items-center justify-between text-[11px]">

              <span className="text-gray-600">
                Composite
              </span>

              {renderResultStatus(
                mrzResult.composite?.passed
              )}

            </div>

            {typeof mrzResult.valid === 'boolean' && (
              <div
                className="
                  pt-1.5
                  mt-1.5
                  border-t
                  border-gray-200
                  flex
                  items-center
                  justify-between
                "
              >

                <span className="text-[11px] text-gray-700 font-medium">
                  Overall MRZ
                </span>

                {renderResultStatus(
                  mrzResult.valid
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* ======================================================
          FACE CAPTURE
      ====================================================== */}

      <div className="space-y-2">

        <div className="flex items-center justify-between">

          <p className="text-xs text-gray-700 font-medium">
            Face Capture
          </p>

          <span className="text-[10px] text-gray-400">
            LIVE BIOMETRIC
          </span>

        </div>

        {/* CAMERA AREA */}

        <div
          className="
            relative
            w-full
            h-64
            bg-black
            rounded-lg
            border
            border-gray-300
            flex
            items-center
            justify-center
            overflow-hidden
          "
        >

          {/* LIVE VIDEO */}

          {cameraActive && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />
          )}

          {/* CAPTURED IMAGE */}

          {!cameraActive && capturedImage && (
            <img
              src={capturedImage}
              alt="Captured live face"
              className="
                absolute
                inset-0
                w-full
                h-full
                object-cover
              "
            />
          )}

          {/* EMPTY CAMERA */}

          {!cameraActive && !capturedImage && (
            <div className="flex flex-col items-center justify-center text-gray-400">

              <Camera className="w-8 h-8 mb-2" />

              <span className="text-xs">
                Camera not started
              </span>

            </div>
          )}

          {/* CAMERA STATUS */}

          <div
            className="
              absolute
              top-2
              left-2
              flex
              items-center
              gap-1.5
              bg-black/70
              px-2
              py-1
              rounded
              text-[10px]
              text-white
              font-medium
            "
          >

            <span
              className={`
                w-1.5
                h-1.5
                rounded-full
                ${
                  cameraActive
                    ? 'bg-green-500'
                    : capturedImage
                    ? 'bg-yellow-500'
                    : 'bg-gray-400'
                }
              `}
            />

            <span>
              {cameraActive
                ? 'LIVE STREAM'
                : capturedImage
                ? 'CAPTURED'
                : 'CAMERA READY'}
            </span>

          </div>

          {/* FACE GUIDE */}

          {cameraActive && (
            <div
              className="
                absolute
                inset-10
                border
                border-white/60
                rounded-full
                pointer-events-none
              "
            />
          )}

        </div>

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* ====================================================
            CAMERA BUTTON
        ==================================================== */}

        {!cameraActive && !capturedImage && (
          <button
            type="button"
            onClick={startCamera}
            className="
              w-full
              py-2.5
              rounded-lg
              bg-navy
              text-white
              text-xs
              font-medium
              flex
              items-center
              justify-center
              gap-2
              hover:opacity-90
              transition-opacity
            "
          >

            <Camera className="w-4 h-4" />

            Start Live Camera

          </button>
        )}

        {/* ====================================================
            CAPTURE BUTTON
        ==================================================== */}

        {cameraActive && (
          <button
            type="button"
            onClick={captureFace}
            className="
              w-full
              py-2.5
              rounded-lg
              bg-navy
              text-white
              text-xs
              font-medium
              flex
              items-center
              justify-center
              gap-2
              hover:opacity-90
              transition-opacity
            "
          >

            <Camera className="w-4 h-4" />

            Capture Face

          </button>
        )}

        {/* ====================================================
            RETAKE + VERIFY
        ==================================================== */}

        {capturedImage && (
          <div className="grid grid-cols-2 gap-2">

            <button
              type="button"
              onClick={retakeFace}
              disabled={faceVerificationLoading}
              className="
                py-2.5
                rounded-lg
                border
                border-gray-300
                bg-white
                text-gray-700
                text-xs
                font-medium
                hover:bg-gray-50
                disabled:opacity-50
              "
            >
              Retake
            </button>

            <button
              type="button"
              onClick={verifyIdentity}
              disabled={
                faceVerificationLoading ||
                !verificationId
              }
              className="
                py-2.5
                rounded-lg
                bg-navy
                text-white
                text-xs
                font-medium
                hover:opacity-90
                disabled:opacity-50
              "
            >
              {faceVerificationLoading
                ? 'Verifying...'
                : 'Verify Identity'}
            </button>

          </div>
        )}

        {/* ====================================================
            CAMERA ERROR
        ==================================================== */}

        {faceError && (
          <div
            className="
              p-2.5
              rounded-lg
              border
              border-red-300
              bg-red-50
              text-[11px]
              text-red-700
            "
          >

            <div className="flex items-start gap-1.5">

              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />

              <span>
                {faceError}
              </span>

            </div>

          </div>
        )}

        {/* ====================================================
            FACE RESULT
        ==================================================== */}

        {faceResult && (
          <div
            className="
              space-y-2
              p-3
              rounded-lg
              border
              border-gray-300
              bg-gray-50
            "
          >

            <p
              className="
                text-[10px]
                text-gray-500
                uppercase
                tracking-wider
                font-semibold
              "
            >
              Biometric Verification Result
            </p>

            {/* FACE MATCH */}

            <div className="flex items-center justify-between">

              <span className="text-[11px] text-gray-600">
                Face Match
              </span>

              <div className="flex items-center gap-2">

                <span className="text-xs font-semibold text-gray-800">
                  {faceResult.biometrics?.face_match_score ?? 0}%
                </span>

                {renderResultStatus(
                  faceResult.biometrics?.face_match_passed
                )}

              </div>

            </div>

            {/* LIVENESS */}

            <div className="flex items-center justify-between">

              <span className="text-[11px] text-gray-600">
                Liveness
              </span>

              <div className="flex items-center gap-2">

                <span className="text-xs font-semibold text-gray-800">
                  {faceResult.biometrics?.liveness_score ?? 0}%
                </span>

                {renderResultStatus(
                  faceResult.biometrics?.liveness_passed
                )}

              </div>

            </div>

            {/* LIVENESS STATUS */}

            <div className="flex items-center justify-between">

              <span className="text-[11px] text-gray-600">
                Liveness Status
              </span>

              <span className="text-[11px] font-medium text-gray-800">
                {faceResult.biometrics?.liveness_status ||
                  'UNKNOWN'}
              </span>

            </div>

            {/* FINAL RESULT */}

            <div
              className="
                pt-2
                mt-1
                border-t
                border-gray-200
                flex
                items-center
                justify-between
              "
            >

              <span className="text-[11px] text-gray-700 font-semibold">
                Identity Verification
              </span>

              {faceResult.final?.passed ? (
                <span className="flex items-center gap-1 text-green-700 text-[11px] font-semibold">

                  <CheckCircle2 className="w-3.5 h-3.5" />

                  VERIFIED

                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-700 text-[11px] font-semibold">

                  <XCircle className="w-3.5 h-3.5" />

                  FAILED

                </span>
              )}

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          DEV TOOLS
      ====================================================== */}

      <div className="pt-2 border-t border-gray-200">

        <button
          type="button"
          onClick={() =>
            setShowDevTools(!showDevTools)
          }
          className="
            flex
            items-center
            gap-1.5
            text-xs
            text-gray-600
            hover:text-gray-900
            transition-colors
            font-medium
          "
        >

          <Settings className="w-3.5 h-3.5" />

          <span>
            Dev Tools {showDevTools ? '[-]' : '[+]'}
          </span>

        </button>

        {showDevTools && (
          <div
            className="
              mt-2
              space-y-2
              p-2.5
              bg-gray-50
              rounded-lg
              border
              border-gray-300
            "
          >

            <p
              className="
                text-[10px]
                font-sans
                text-red-600
                font-medium
                uppercase
                tracking-wider
              "
            >
             
            </p>

            <p
              className="
                text-[11px]
                font-sans
                text-gray-700
                font-semibold
                tracking-wider
                uppercase
              "
            >
              SCENARIO INJECTION
            </p>

            <div className="space-y-1.5">

              {scenarios.map((scenario) => {
                const Icon = scenario.icon;

                return (
                  <button
                    key={scenario.id}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      onScenarioSelect(
                        scenario.id
                      )
                    }
                    className="
                      w-full
                      flex
                      items-center
                      gap-2
                      p-2
                      rounded
                      border
                      border-gray-300
                      bg-white
                      hover:bg-gray-100
                      text-left
                      text-xs
                      font-sans
                      font-medium
                      text-navy
                      transition-colors
                      disabled:opacity-50
                    "
                  >

                    <Icon
                      className="
                        w-3.5
                        h-3.5
                        shrink-0
                        text-gray-600
                      "
                    />

                    <span>
                      {scenario.label}
                    </span>

                  </button>
                );
              })}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};