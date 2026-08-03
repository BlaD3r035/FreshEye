import { useEffect, useRef, type ChangeEvent } from "react";
import { useCamera } from "../hooks/useCamera";

interface CaptureStageProps {
  onImageReady: (dataUrl: string) => void;
}

export default function CaptureStage({ onImageReady }: CaptureStageProps) {
  const { videoRef, status, startCamera, capturePhoto } = useCamera();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    const dataUrl = capturePhoto();
    if (dataUrl) onImageReady(dataUrl);
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImageReady(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden bg-surface border border-border">
        {status === "denied" ? (
          <div className="h-full flex flex-col items-center justify-center text-text-muted text-center p-5 gap-1">
            <span className="text-3xl mb-2">📷</span>
            <p>Acceso a la cámara denegado.</p>
            <p className="text-[0.85rem]">Puedes subir una foto en su lugar.</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover block"
            muted
            playsInline
          />
        )}

        <div
          className="absolute inset-3.5 pointer-events-none"
          aria-hidden="true"
        >
          <span className="absolute w-5.5 h-5.5 border-2 border-tomato/55 top-0 left-0 border-r-0 border-b-0 rounded-tl-[6px]" />
          <span className="absolute w-5.5 h-5.5 border-2 border-tomato/55 top-0 right-0 border-l-0 border-b-0 rounded-tr-[6px]" />
          <span className="absolute w-5.5 h-5.5 border-2 border-tomato/55 bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[6px]" />
          <span className="absolute w-5.5 h-5.5 border-2 border-tomato/55 bottom-0 right-0 border-l-0 border-t-0 rounded-br-[6px]" />
        </div>

        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[0.85rem] text-text-muted bg-bg/50">
            Iniciando cámara…
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-6">
        <button
          className="w-[68px] h-[68px] rounded-full border-none bg-tomato flex items-center justify-center cursor-pointer active:scale-[0.92] disabled:bg-surface-alt disabled:cursor-not-allowed transition-transform duration-150 ease-out"
          onClick={handleCapture}
          disabled={status !== "ready"}
          aria-label="Tomar foto"
        >
          <span className="w-[52px] h-[52px] rounded-full border-[3px] border-bg" />
        </button>

        <button
          className="flex flex-col items-center gap-1 bg-transparent border-none text-text-muted font-[var(--font-display)] text-[0.8rem] cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <span className="w-[44px] h-[44px] rounded-full border border-border flex items-center justify-center text-xl text-text">
            ⤒
          </span>
          Subir foto
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleUpload}
        />
      </div>
    </div>
  );
}
