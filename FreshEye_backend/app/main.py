from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.recipes import load_recipes, match_recipes

# from app.mock_detector import MockDetector

from app.real_detector import RealDetector

app = FastAPI(title="FreshEye — Fresh Ingredient Detection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = RealDetector()

RECETAS = load_recipes()

FORMATOS_VALIDOS = {"image/jpeg", "image/png", "image/webp"}


class RecomendacionRequest(BaseModel):
    ingredientes: list[str] = []


@app.get("/")
def root():
    return {"status": "ok", "mensaje": "API FreshEye activa"}


@app.post("/detect")
async def detectar(file: UploadFile = File(...)):
    if file.content_type not in FORMATOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: {file.content_type}. Use JPEG, PNG or WEBP.",
        )

    contenido = await file.read()
    if len(contenido) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    try:
        detecciones = detector.predict(contenido)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing the image: {e}")

    ingredientes_unicos = sorted({d["clase"] for d in detecciones})

    return {
        "detecciones": detecciones,
        "ingredientes_detectados": ingredientes_unicos,
        "total_objetos": len(detecciones),
    }


@app.get("/recipes")
def listar_recetas():
    return RECETAS


@app.post("/recipes/recommend")
def recomendar_recetas(payload: RecomendacionRequest):
    if not payload.ingredientes:
        return []
    return match_recipes(payload.ingredientes, RECETAS)
