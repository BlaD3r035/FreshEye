import { useEffect, useState } from "react";
import { fetchMatchedRecipes } from "../services/detectionApi";
import RecipeCard from "./RecipeCard";
import type { Detection, MatchedRecipe } from "../types";

interface ResultsSheetProps {
  detections: Detection[];
  onReset: () => void;
}

export default function ResultsSheet({
  detections,
  onReset,
}: ResultsSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [recipes, setRecipes] = useState<MatchedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detectedKey = detections.map((d) => d.id).join(",");

  const uniqueDetections = detections.filter(
    (d, i, arr) => arr.findIndex((x) => x.id === d.id) === i,
  );

  useEffect(() => {
    const counts = new Map<string, number>();
    for (const d of detections) {
      counts.set(d.id, (counts.get(d.id) ?? 0) + 1);
    }
    console.log(
      "Ingredientes detectados (nombre: cantidad):",
      Object.fromEntries([...counts.entries()].map(([id, n]) => [id, n])),
    );
  }, [detections]);

  useEffect(() => {
    const t = setTimeout(() => setExpanded(true), 30);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMatchedRecipes(detectedKey.split(",").filter(Boolean))
      .then((data) => {
        if (!cancelled) setRecipes(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detectedKey]);

  return (
    <div
      className={`fixed left-0 right-0 bottom-0 max-w-[480px] mx-auto bg-surface rounded-t-[24px] border border-border border-b-0 px-5 pt-[10px] pb-4 max-h-[72vh] flex flex-col transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${expanded ? "translate-y-0" : "translate-y-[96%]"}`}
    >
      <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4 shrink-0" />

      <div className="flex items-start justify-between gap-3 shrink-0">
        <div>
          <p className="font-mono text-[0.66rem] tracking-widest text-tomato m-0 mb-1">
            ESCANEO COMPLETO
          </p>
          <h2 className="text-[1.15rem] m-0">
            {uniqueDetections.length} ingredientes encontrados
          </h2>
        </div>
        <button
          className="shrink-0 bg-surface-alt border border-border text-text py-2 px-3.5 rounded-full text-[0.8rem] cursor-pointer"
          onClick={onReset}
        >
          Nueva foto
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mt-4 shrink-0">
        {uniqueDetections.map((d) => (
          <span
            key={d.id}
            className="flex items-center gap-1.5 bg-surface-alt border border-border py-[6px] px-3 rounded-full text-[0.82rem]"
          >
            <span>{d.emoji}</span> {d.name}
          </span>
        ))}
      </div>

      <div className="h-px bg-border my-5 shrink-0" />

      <p className="font-mono text-[0.66rem] tracking-widest text-tomato m-0 mb-1 shrink-0">
        RECETAS PARA TI
      </p>

      <div className="flex-1 min-h-0 mt-2.5">
        {loading ? (
          <div className="h-full flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 min-h-[52px] rounded-[16px] bg-surface-alt border border-border animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-tomato text-[0.88rem]">{error}</p>
        ) : recipes.length === 0 ? (
          <p className="text-text-muted text-[0.88rem]">
            No se encontraron recetas para esta combinación. Prueba con otra foto.
          </p>
        ) : (
          <div className="h-full overflow-y-auto flex flex-col gap-2.5 pr-1">
            {recipes.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
