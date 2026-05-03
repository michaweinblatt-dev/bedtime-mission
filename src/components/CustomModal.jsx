import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Upload, Camera } from 'lucide-react';

export default function CustomModal({ config, unlockAudio, playCameraSound }) {
  const {
    type,
    title,
    message,
    showImage,
    currentImage,
    defaultValue = '',
    showDelete,
    confirmText = 'Confirm',
    onConfirm,
    onDelete,
    onCancel,
  } = config;

  const [inputValue, setInputValue] = useState(defaultValue);
  const [localImage, setLocalImage] = useState(currentImage || null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  const [streamError, setStreamError] = useState(false);

  const viewfinderRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (type === 'prompt' && inputRef.current) inputRef.current.focus();
  }, [type]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setStreamError(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setStreamError(false);
      // attach stream to video element after state update
      requestAnimationFrame(() => {
        if (viewfinderRef.current) viewfinderRef.current.srcObject = stream;
      });
    } catch {
      setStreamError(true);
    }
  }, []);

  const takeSnapshot = useCallback(async () => {
    const vf = viewfinderRef.current;
    if (!vf) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    await unlockAudio();
    playCameraSound();

    const canvas = document.createElement('canvas');
    canvas.width = vf.videoWidth;
    canvas.height = vf.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(vf, 0, 0);

    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 400;
      c.height = img.height * (400 / img.width);
      c.getContext('2d').drawImage(img, 0, 0, 400, c.height);
      setLocalImage(c.toDataURL('image/jpeg', 0.7));
      stopCamera();
    };
    img.src = canvas.toDataURL('image/jpeg');
  }, [unlockAudio, playCameraSound, stopCamera]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 400;
        c.height = img.height * (400 / img.width);
        c.getContext('2d').drawImage(img, 0, 0, 400, c.height);
        setLocalImage(c.toDataURL('image/jpeg', 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = () => {
    stopCamera();
    onConfirm(inputValue, localImage);
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure?')) {
      stopCamera();
      onDelete();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') handleCancel();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm text-slate-800">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl text-slate-800">
        <h3 className="text-2xl font-black text-indigo-900 mb-2 text-center uppercase tracking-tight text-slate-800">
          {title}
        </h3>

        {message && (
          <p className="text-slate-500 text-sm mb-4 text-center">{message}</p>
        )}

        {/* Image / camera section */}
        {showImage && (
          <div className="mb-6 flex flex-col items-center">
            {isCameraOpen ? (
              // Camera viewfinder
              <div className="flex flex-col items-center">
                <div className="astronaut-visor w-48 h-48 mb-3 flex items-center justify-center relative bg-black overflow-hidden">
                  <video
                    ref={viewfinderRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {flash && <div className="active-flash absolute inset-0 bg-white" />}
                </div>
                <button
                  onClick={takeSnapshot}
                  className="bg-pink-500 text-white p-4 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                  <Camera className="w-8 h-8 text-white" />
                </button>
                <button
                  onClick={stopCamera}
                  className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center"
                >
                  Cancel
                </button>
              </div>
            ) : (
              // Avatar preview + upload
              <div className="flex flex-col items-center text-slate-800">
                <div className="astronaut-visor w-32 h-32 bg-slate-100 mb-3 flex items-center justify-center relative group text-slate-800">
                  {localImage
                    ? <img src={localImage} className="w-full h-full object-cover" />
                    : <User className="w-12 h-12 text-slate-300" />
                  }
                  <label className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white rounded-[inherit]">
                    <Upload className="text-white w-8 h-8" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                </div>
                {streamError && (
                  <p className="text-xs text-red-400 mb-2">Camera not available</p>
                )}
                <button
                  onClick={startCamera}
                  className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider flex items-center gap-1 hover:text-indigo-700 transition-colors"
                >
                  <Camera className="w-3 h-3 text-indigo-500" /> Take Selfie
                </button>
              </div>
            )}
          </div>
        )}

        {/* Text input */}
        {type === 'prompt' && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl mb-4 text-slate-800 font-bold focus:border-indigo-500 outline-none"
            placeholder="Enter name..."
          />
        )}

        {/* Buttons */}
        <div className="flex justify-between gap-3 mt-4 text-slate-800">
          {showDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-full bg-red-100 text-red-600 font-bold hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          )}
          <div className="flex gap-2 ml-auto text-slate-800">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-full text-slate-400 font-bold hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
