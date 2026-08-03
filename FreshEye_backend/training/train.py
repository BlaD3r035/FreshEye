import argparse
from pathlib import Path
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
# data de entrenamiento y validación
DATA_YAML = BASE_DIR / "data.yaml"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model",
        default="yolov8m.pt",

    )
    parser.add_argument("--epochs", type=int, default=150)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument(
        "--patience",
        type=int,
        default=30,

    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Parallel processes to load images. "
        "",
    )
    args = parser.parse_args()

    model = YOLO(args.model)

    model.train(
        data=str(DATA_YAML),
        epochs=args.epochs, # epocas de entrenamiento
        imgsz=args.imgsz, # tamaño de imagen
        batch=args.batch, # imagenes para actualizar pesos
        patience=args.patience, # paciencia para early stopping
        workers=args.workers, # procesos paralelos para cargar imagenes
        augment=True, 
        mosaic=1.0, # hace collage de imagenes 
        mixup=0.1, # hace superposición de imagenes
        hsv_h=0.02, # variación de tono
        hsv_s=0.6, # variación de saturación
        hsv_v=0.4, # variación de brillo
        project="runs",
        name="freshvision",
    )

    print("\nTraining completed.")
    print("Model saved: runs/freshvision/weights/best.pt")


if __name__ == "__main__":
    main()