import json
from pathlib import Path

RECIPES_PATH = Path(__file__).resolve().parent.parent / "util" / "recipes.json"


def _normalize(ingredient_id: str) -> str:
    return ingredient_id.replace("_", " ").strip().lower()


def load_recipes() -> list[dict]:
    with open(RECIPES_PATH, encoding="utf-8") as f:
        return json.load(f)


def match_recipes(
    ingredient_ids: list[str], recipes: list[dict] | None = None
) -> list[dict]:
    recipes = recipes if recipes is not None else load_recipes()
    available = {_normalize(i) for i in ingredient_ids}

    matched = []
    for recipe in recipes:
        matched_ids = [
            i for i in recipe["ingredientIds"] if _normalize(i) in available
        ]
        if not matched_ids:
            continue

        matched.append(
            {
                **recipe,
                "matchCount": len(matched_ids),
                "matchedIds": matched_ids,
                "matchScore": round(
                    len(matched_ids) / len(recipe["ingredientIds"]), 2
                ),
            }
        )

    matched.sort(key=lambda r: (-r["matchScore"], -r["matchCount"]))
    return matched
