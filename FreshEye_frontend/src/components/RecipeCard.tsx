import { useState } from "react";
import type { MatchedRecipe } from "../types";

interface RecipeCardProps {
  recipe: MatchedRecipe;
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-surface-alt border border-border rounded-[16px] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 bg-transparent border-none py-3.5 px-3.5 cursor-pointer text-text text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="text-xl">{recipe.emoji}</span>
        <span className="flex-1 flex flex-col gap-[2px] min-w-0">
          <span className="font-bold text-[0.95rem]">{recipe.title}</span>
          <span className="text-[0.74rem] text-text-muted">
            {recipe.time} · {recipe.difficulty} · {recipe.matchCount}/
            {recipe.ingredientIds.length} ingredientes
          </span>
        </span>
        <span className="font-mono text-[0.75rem] text-bg bg-tomato py-[3px] px-2 rounded-full font-bold">
          {Math.round(recipe.matchScore * 100)}%
        </span>
        <span className="text-[1.1rem] text-text-muted w-[18px] text-center">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="px-3.5 pb-4 border-t border-border">
          <p className="font-mono text-[0.66rem] tracking-widest text-text-muted mt-3.5 mb-2">
            Ingredientes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.ingredientIds.map((id) => (
              <span
                key={id}
                className={`text-[0.72rem] py-1 px-[9px] rounded-full capitalize border border-border ${
                  recipe.matchedIds.includes(id)
                    ? "bg-tomato/15 border-tomato-dim text-tomato"
                    : "text-text-muted"
                }`}
              >
                {id.replace(/_/g, " ")}
              </span>
            ))}
          </div>

          <p className="font-mono text-[0.66rem] tracking-widest text-text-muted mt-3.5 mb-2">
            Instrucciones
          </p>
          <ol className="m-0 pl-[18px] text-text text-[0.85rem] leading-[1.5]">
            {recipe.steps.map((step, i) => (
              <li key={i} className="mb-[6px]">
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
