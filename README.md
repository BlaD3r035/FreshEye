# FreshEye

FreshEye es una aplicación de visión por computador para detectar ingredientes de cocina en una imagen y recomendar recetas según los ingredientes encontrados.

El repositorio contiene:
- **Frontend** en React + Vite (`FreshEye_frontend`)
- **Backend** en FastAPI + YOLO (`FreshEye_backend`)
- **Scripts de entrenamiento/evaluación** del modelo (`FreshEye_backend/training`)

## Estructura principal

```text
FreshEye/
├── FreshEye_frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── lib/
│   ├── package.json
│   └── .env.local.example
├── FreshEye_backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── real_detector.py
│   │   ├── recipes.py
│   │   └── config.py
│   ├── training/
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   └── data.yaml
│   ├── models/
│   │   └── best.pt
│   ├── util/
│   │   └── recipes.json
│   ├── requirements.txt
│   └── requirements-training.txt
└── runs/
```

## Requisitos

- **Node.js** 18+
- **npm** 9+
- **Python** 3.10+
- (Opcional) GPU compatible para acelerar inferencia y entrenamiento

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
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 3) Frontend

En otra terminal:

```bash
cd FreshEye_frontend
npm install
cp .env.local.example .env.local
```

Si necesitas apuntar a otro backend, edita `VITE_API_URL` en `.env.local`.

## Ejecución de la app principal

### 1) Levantar backend (API)

Desde `FreshEye_backend`:

```bash
source .venv/bin/activate   # En Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Endpoints principales:
- `GET /` estado de la API
- `POST /detect` detección de ingredientes desde imagen
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

Desde `FreshEye_backend` (en tu entorno virtual):

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

## Scripts útiles del frontend

Desde `FreshEye_frontend`:

```bash
npm run dev      # desarrollo
npm run build    # build de producción
npm run preview  # previsualizar build
npm run lint     # lint del frontend
```

## Notas

- El backend acepta imágenes `JPEG`, `PNG` y `WEBP`.
- El frontend, por defecto, consume `http://localhost:8000`.
- Asegúrate de tener el archivo de pesos del modelo en `FreshEye_backend/models/best.pt`.
