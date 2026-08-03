import { useEffect, useRef, useState } from "react";
import { detectIngredients, DetectionApiError } from "../services/detectionApi";
import type { Detection } from "../types";

interface ScanOverlayProps {
  image: string;
  onComplete: (detections: Detection[]) => void;
  onCancel?: () => void;
}

type ScanPhase = "sweeping" | "boxing" | "done";

const SWEEP_DURATION = 1600;
const BOX_STAGGER = 260;
const HOLD_AFTER_LAST_BOX = 700;

export default function ScanOverlay({
  image,
  onComplete,
  onCancel,
}: ScanOverlayProps) {
  const [phase, setPhase] = useState<ScanPhase>("sweeping");
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleBoxes, setVisibleBoxes] = useState(0);
  const requestedFor = useRef<string | null>(null);

  useEffect(() => {
    if (requestedFor.current === image) return;
    requestedFor.current = image;
    setError(null);
    setDetections(null);
    setVisibleBoxes(0);

    let cancelled = false;
    detectIngredients(image)
      .then((found) => {
        if (!cancelled) setDetections(found);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof DetectionApiError
              ? err.message
              : "Ocurrió un error inesperado al analizar la imagen.",
          );
        }
      });
    return () => {
      cancelled = true;
      requestedFor.current = null;
    };
  }, [image]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase((p) => (p === "sweeping" ? "boxing" : p));
    }, SWEEP_DURATION);
    return () => clearTimeout(t1);
  }, [image]);

  useEffect(() => {
    if (phase !== "boxing" || !detections || error) return;
    if (visibleBoxes >= detections.length) {
      const tEnd = setTimeout(() => {
        setPhase("done");
        onComplete(detections);
      }, HOLD_AFTER_LAST_BOX);
      return () => clearTimeout(tEnd);
    }
    const t = setTimeout(() => setVisibleBoxes((n) => n + 1), BOX_STAGGER);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, visibleBoxes, detections, error]);

  if (error) {
    return (
      <div className="w-full">
        <div className="relative w-full aspect-[3/4] rounded-[24px] overflow-hidden bg-surface border border-border flex flex-col items-center justify-center gap-3 p-6 text-center">
          <span className="text-3xl">⚠️</span>
          <p className="text-text-muted text-[0.9rem]">{error}</p>
          {onCancel && (
            <button
              className="mt-2 bg-surface-alt border border-border text-text py-2 px-4 rounded-full text-[0.85rem] cursor-pointer"
              onClick={onCancel}
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  const shownDetections =
    phase === "boxing" && detections ? detections.slice(0, visibleBoxes) : [];

  return (
    <div className="w-full">
      <div className="relative w-full rounded-[24px] overflow-hidden bg-surface border border-border">
        <img
          src={image}
          alt="Foto capturada"
          className="w-full h-auto block"
        />

        {phase === "sweeping" && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute left-0 right-0 h-[3px] bg-saffron shadow-[0_0_16px_4px_rgba(232,163,61,0.65)] animate-sweep" />
          </div>
        )}

        {shownDetections.map((d, i) => (
          <div
            key={`${d.id}-${i}`}
            className="absolute animate-box-in"
            style={{
              left: `${d.box[0] * 100}%`,
              top: `${d.box[1] * 100}%`,
              width: `${(d.box[2] - d.box[0]) * 100}%`,
              height: `${(d.box[3] - d.box[1]) * 100}%`,
            }}
          >
            <span className="absolute w-[14px] h-[14px] border-2 border-saffron top-[-2px] left-[-2px] border-r-0 border-b-0" />
            <span className="absolute w-[14px] h-[14px] border-2 border-saffron top-[-2px] right-[-2px] border-l-0 border-b-0" />
            <span className="absolute w-[14px] h-[14px] border-2 border-saffron bottom-[-2px] left-[-2px] border-r-0 border-t-0" />
            <span className="absolute w-[14px] h-[14px] border-2 border-saffron bottom-[-2px] right-[-2px] border-l-0 border-t-0" />
            <span className="absolute bottom-[calc(100%+4px)] left-[-2px] whitespace-nowrap font-mono text-[0.62rem] bg-bg/85 text-saffron py-[3px] px-[6px] rounded border border-saffron/40">
              {d.emoji} {d.name} <b className="text-text">{d.confidence}%</b>
            </span>
          </div>
        ))}

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[0.68rem] tracking-widest text-saffron bg-bg/60 py-[6px] px-[10px] rounded-full border border-saffron/30">
          <span className="w-[6px] h-[6px] rounded-full bg-saffron animate-blink" />
          {phase === "sweeping"
            ? "ANALIZANDO IMAGEN"
            : detections
              ? "IDENTIFICANDO INGREDIENTES"
              : "ESPERANDO AL API"}
        </div>
      </div>
    </div>
  );
}
