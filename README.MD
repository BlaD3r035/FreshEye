# FreshEye

Aplicación **Frontend + Backend** para detección de ingredientes de cocina con **Computer Vision (YOLOv8)** y recomendación de recetas según los ingredientes encontrados.

## 1) Estructura del proyecto

```text
FreshEye/
├── FreshEye_frontend/          # Cliente web (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # UI principal (captura, escaneo, resultados)
│   │   ├── hooks/              # Hook de cámara
│   │   ├── services/           # Llamadas HTTP al backend
│   │   ├── data/               # Catálogo de ingredientes
│   │   └── lib/                # Config de API
│   ├── .env.local.example
│   └── package.json
│
├── FreshEye_backend/           # API + detección con YOLO
│   ├── app/
│   │   ├── main.py             # API FastAPI (/detect, /recipes, /recipes/recommend)
│   │   ├── real_detector.py    # Inferencia YOLOv8 sobre imágenes
│   │   ├── recipes.py          # Carga y matching de recetas
│   │   └── config.py           # Config global (MODEL_PATH, CLASSES)
│   ├── models/
│   │   └── best.pt             # Pesos del modelo entrenado
│   ├── training/
│   │   ├── train.py            # Script de entrenamiento YOLOv8
│   │   ├── evaluate.py         # Script de evaluación
│   │   └── data.yaml           # Configuración del dataset
│   ├── util/
│   │   └── recipes.json        # Base de recetas
│   ├── requirements.txt
│   └── requirements-training.txt
│
└── runs/                       # Resultados históricos de entrenamiento/evaluación
```

## 2) Requisitos

- Python 3.10+ recomendado
- Node.js 20+ recomendado
- npm (incluido con Node)

## 3) Instalación

### 3.1 Backend

Desde `/home/runner/work/FreshEye/FreshEye/FreshEye_backend`:

```bash
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

> Para entrenamiento/evaluación de modelo también instala:

```bash
pip install -r requirements-training.txt
```

### 3.2 Frontend

Desde `/home/runner/work/FreshEye/FreshEye/FreshEye_frontend`:

```bash
npm install
cp .env.local.example .env.local
```

Variable usada:

- `VITE_API_URL=http://localhost:8000` (URL base de la API)

## 4) Ejecución de la aplicación

### 4.1 Levantar backend (FastAPI)

Desde `/home/runner/work/FreshEye/FreshEye/FreshEye_backend` con el entorno virtual activo:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Endpoints principales:

- `GET /` estado de la API
- `POST /detect` detección de ingredientes en imagen
- `GET /recipes` listado de recetas
- `POST /recipes/recommend` recetas recomendadas por ingredientes detectados

### 4.2 Levantar frontend (Vite)

Desde `/home/runner/work/FreshEye/FreshEye/FreshEye_frontend`:

```bash
npm run dev
```

Luego abre la URL que imprime Vite (normalmente `http://localhost:5173`).

## 5) Scripts y funcionamiento

### Frontend (`FreshEye_frontend/package.json`)

- `npm run dev`: inicia servidor de desarrollo.
- `npm run build`: compila TypeScript y genera build de producción.
- `npm run lint`: ejecuta ESLint.
- `npm run preview`: sirve localmente el build generado.

### Backend (scripts Python)

### API

- Ejecutar servicio:
  - `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### Entrenamiento YOLOv8

Desde `/home/runner/work/FreshEye/FreshEye/FreshEye_backend/training`:

```bash
python train.py --model yolov8m.pt --epochs 150 --imgsz 640 --batch 16 --patience 30 --workers 4
```

Parámetros disponibles en `train.py`:

- `--model`: checkpoint/base model (default `yolov8m.pt`)
- `--epochs`: épocas de entrenamiento
- `--imgsz`: tamaño de imagen
- `--batch`: batch size
- `--patience`: early stopping
- `--workers`: workers para carga de datos

### Evaluación del modelo

Desde `/home/runner/work/FreshEye/FreshEye/FreshEye_backend/training`:

```bash
python evaluate.py --weights ../models/best.pt
```

Este script imprime métricas como `mAP50` y `mAP50-95`.

## 6) Flujo funcional resumido

1. El frontend captura/sube una imagen.
2. Envía la imagen al endpoint `POST /detect`.
3. El backend ejecuta inferencia con YOLOv8 (`models/best.pt`).
4. El frontend recibe ingredientes detectados y solicita recomendaciones.
5. El backend compara ingredientes contra `util/recipes.json` y retorna recetas ordenadas por match.
