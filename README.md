# FreshEye

FreshEye es una aplicación de visión por computador para detectar ingredientes de cocina en una imagen y recomendar recetas según los ingredientes encontrados.

El repositorio contiene:
- **Frontend** en React + Vite (`FreshEye_frontend`)
- **Backend** en FastAPI + YOLO (`FreshEye_backend`)
- **Scripts de entrenamiento/evaluación** del modelo (`FreshEye_backend/training`)

## Estructura principal

```text
FreshEye/
├── FreshEye_frontend/          # Cliente web (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/         # UI principal
│   │   ├── hooks/              # Hook de cámara
│   │   ├── services/           # Llamadas HTTP al backend
│   │   ├── data/               # Catálogo de ingredientes
│   │   └── lib/                # Config de API
│   ├── .env.local.example
│   └── package.json
│
├── FreshEye_backend/           # API + detección con YOLO
|   ├── dataset/                # labels e imagenes para el entrenamiento de YOLOV8m
│   ├── app/
│   │   ├── main.py             # API FastAPI Rutas
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
└── runs/                       # Resultados históricos de entrenamiento/evaluación (last)
```

## Requisitos

- **Node.js** 18+
- **npm** 9+ / **pnpm**
- **Python** 3.10+

## Instalación

### 1) Clonar y entrar al proyecto

```bash
git clone https://github.com/BlaD3r035/FreshEye.git
cd FreshEye
```

### 2) Backend

```bash
cd FreshEye_backend
python -m venv .venv
source .venv/bin/activate 
pip install --upgrade pip
pip install -r requirements.txt
```

### 3) Frontend

```bash
cd FreshEye_frontend
npm install
cp .env.local.example .env.local
```

## Ejecución de la app principal

### 1) Iniciar backend (API)

Desde `FreshEye_backend`:

```bash
source .venv/bin/activate 
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints principales:
- `GET /` estado de la API
- `POST /detect` detección de ingredientes desde imagen (type File)
- `GET /recipes` listado de recetas
- `POST /recipes/recommend` recomendaciones según ingredientes detectados

### 2) Levantar frontend

Desde `FreshEye_frontend`:

```bash
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

## ¿Cómo funciona la app?

1. El usuario captura una foto desde el frontend.
2. El frontend envía la imagen al endpoint `POST /detect`.
3. El backend procesa la imagen con el modelo YOLO (`models/best.pt`) y devuelve detecciones con clase, confianza y caja.
4. El frontend toma los ingredientes detectados y consulta `POST /recipes/recommend`.
5. El backend cruza ingredientes detectados con `util/recipes.json` y devuelve recetas ordenadas por coincidencia.

## Scripts (entrenamiento y evaluación)

Los scripts están en `FreshEye_backend/training`.

### Instalar dependencias de entrenamiento

Desde `FreshEye_backend` :

```bash
pip install -r requirements-training.txt
```

### Entrenar modelo

```bash
python training/train.py
```

Parámetros útiles:
- `--model` (default: `yolov8m.pt`)
- `--epochs` (default: `150`)
- `--imgsz` (default: `640`)
- `--batch` (default: `16`)
- `--patience` (default: `30`)
- `--workers` (default: `4`)

Ejemplo:

```bash
python training/train.py --model yolov8m.pt --epochs 100 --imgsz 640 --batch 16
```

### Evaluar modelo

```bash
python training/evaluate.py --weights ../models/best.pt
```

`data.yaml` define rutas y clases del dataset para entrenamiento/validación.

