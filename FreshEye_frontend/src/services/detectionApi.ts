import { API_BASE_URL } from "../lib/apiConfig";
import { ingredientFromClass } from "../data/ingredientCatalog";
import type { BoundingBox, Detection, MatchedRecipe } from "../types";

interface DeteccionApi {
  clase: string;
  confianza: number; // 0-1
  box: [number, number, number, number]; // normalizado 0-1
}

interface DetectarResponse {
  detecciones: DeteccionApi[];
  ingredientes_detectados: string[];
  total_objetos: number;
}

export class DetectionApiError extends Error {}

function dataUrlToFile(dataUrl: string, filename = "captura.jpg"): File {
  const [header, base64 = ""] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export async function detectIngredients(
  imageDataUrl: string,
): Promise<Detection[]> {
  const file = dataUrlToFile(imageDataUrl);
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/detect`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new DetectionApiError(
      "Hubo un error de red al intentar analizar la imagen.",
    );
  }

  if (!response.ok) {
    let detail = `Error ${response.status} al analizar la imagen.`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      //
    }
    throw new DetectionApiError(detail);
  }

  const data = (await response.json()) as DetectarResponse;

  return data.detecciones.map((d): Detection => {
    const ingredient = ingredientFromClass(d.clase);
    return {
      ...ingredient,
      confidence: Math.round(d.confianza * 100),
      box: d.box as BoundingBox,
    };
  });
}

export async function fetchMatchedRecipes(
  ingredientIds: string[],
): Promise<MatchedRecipe[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/recipes/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredientes: ingredientIds }),
    });
  } catch {
    throw new DetectionApiError(
      "Hubo un error de red al intentar cargar las recetas.",
    );
  }

  if (!response.ok) {
    let detail = `Error ${response.status} al cargar las recetas.`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      //
    }
    throw new DetectionApiError(detail);
  }

  return (await response.json()) as MatchedRecipe[];
}
