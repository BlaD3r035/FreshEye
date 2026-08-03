import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type RefObject,
} from "react";
import type { CameraStatus } from "../types";

interface UseCameraReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const [status, setStatus] = useState<CameraStatus>("idle");

  const startCamera = useCallback(async () => {
    if (startingRef.current || streamRef.current) return;
    startingRef.current = true;
    setStatus("starting");

    try {
      for (;;) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
          setStatus("ready");
          break;
        } catch (err) {
          const error = err as DOMException;

          if (error.name === "AbortError") {
            console.warn("Capture interrupted (likely double mount), retrying…");
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            continue;
          }

          console.warn("Cannot access camera:", error.name, error.message);
          setStatus("denied");
          break;
        }
      }
    } finally {
      startingRef.current = false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return { videoRef, status, startCamera, stopCamera, capturePhoto };
}
