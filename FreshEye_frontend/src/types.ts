export interface Ingredient {
  id: string;
  name: string;
  emoji: string;
}

export type BoundingBox = [number, number, number, number];

export interface Detection extends Ingredient {
  confidence: number; // 0-100
  box: BoundingBox;
}

export interface Recipe {
  id: string;
  title: string;
  time: string;
  difficulty: "Facil" | "Medio" | "Dificil";
  emoji: string;
  ingredientIds: string[];
  steps: string[];
}

export interface MatchedRecipe extends Recipe {
  matchCount: number;
  matchedIds: string[];
  matchScore: number; // 0-1
}

export type AppPhase = "capture" | "scanning" | "results";

export type CameraStatus = "idle" | "starting" | "ready" | "denied";
