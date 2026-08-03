import { useState } from "react";
import CaptureStage from "./components/CaptureStage";
import ScanOverlay from "./components/ScanOverlay";
import ResultsSheet from "./components/ResultsSheet";
import type { AppPhase, Detection } from "./types";

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("capture");
  const [image, setImage] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);

  const handleImageReady = (dataUrl: string) => {
    setImage(dataUrl);
    setPhase("scanning");
  };

  const handleScanComplete = (found: Detection[]) => {
    setDetections(found);
    setPhase("results");
  };

  const handleReset = () => {
    setImage(null);
    setDetections([]);
    setPhase("capture");
  };

  return (
    <div className="min-h-screen max-w-[480px] mx-auto px-5 pt-7 relative overflow-hidden bg-[#f5ece3]">
      <header className="mb-5">
        <br />
        <h1 className="text-4xl font-extrabold m-0 mb-1 tracking-tight">
          Fresh<span className="text-tomato">Eye</span>
        </h1>
        <p className="m-0 text-text-muted text-[0.92rem]">
          ¿Qué podemos cocinar hoy?
        </p>
      </header>
      .
      <main className="relative">
        {phase === "capture" && (
          <CaptureStage onImageReady={handleImageReady} />
        )}

        {phase === "scanning" && image && (
          <ScanOverlay
            image={image}
            onComplete={handleScanComplete}
            onCancel={handleReset}
          />
        )}

        {phase === "results" && image && (
          <>
            <div className="relative w-full rounded-[24px] overflow-hidden bg-surface border border-border">
              <img
                src={image}
                alt="Foto analizada"
                className="w-full h-auto block"
              />
            </div>
            <ResultsSheet detections={detections} onReset={handleReset} />
          </>
        )}
      </main>
    </div>
  );
}
