import type { Ingredient } from "../types";

export const CLASS_TO_INGREDIENT: Record<string, Ingredient> = {
  Aguacate: { id: "Aguacate", name: "Aguacate", emoji: "🥑" },
  Ajo: { id: "Ajo", name: "Ajo", emoji: "🧄" },
  Auyama: { id: "Auyama", name: "Auyama", emoji: "🎃" },
  Berenjena: { id: "Berenjena", name: "Berenjena", emoji: "🍆" },
  Carne_de_res: { id: "Carne de res", name: "Carne de res", emoji: "🥩" },
  Cebolla: { id: "Cebolla", name: "Cebolla", emoji: "🧅" },
  Champinon: { id: "Champinon", name: "Champinon", emoji: "🍄" },
  Cilantro: { id: "Cilantro", name: "Cilantro", emoji: "🌿" },
  Huevo: { id: "Huevo", name: "Huevo", emoji: "🥚" },
  Lechuga: { id: "Lechuga", name: "Lechuga", emoji: "🥬" },
  Limon: { id: "Limon", name: "Limon", emoji: "🍋" },
  Papa: { id: "Papa", name: "Papa", emoji: "🥔" },
  Pasta: { id: "Pasta", name: "Pasta", emoji: "🍝" },
  Pechuga_de_pollo: {
    id: "Pechuga de pollo",
    name: "Pechuga de pollo",
    emoji: "🍗",
  },
  Pepino: { id: "Pepino", name: "Pepino", emoji: "🥒" },
  Perejil: { id: "Perejil", name: "Perejil", emoji: "🌱" },
  Pimenton: { id: "Pimenton", name: "Pimenton", emoji: "🫑" },
  Tomate: { id: "Tomate", name: "Tomate", emoji: "🍅" },
  Zanahoria: { id: "Zanahoria", name: "Zanahoria", emoji: "🥕" },
  brocoli: { id: "brocoli", name: "brocoli", emoji: "🥦" },
};

export function ingredientFromClass(clase: string): Ingredient {
  const known = CLASS_TO_INGREDIENT[clase];
  if (known) return known;

  return {
    id: clase.toLowerCase().replace(/[^a-z0-9]+/gi, "_"),
    name: clase.replace(/_/g, " "),
    emoji: "🥗",
  };
}
