import argparse
from pathlib import Path
from ultralytics import YOLO

BASE_DIR = Path(__file__).resolve().parent
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
        help="Parallel processes to load images. Lower it if you get RAM (not VRAM) "
        "errors like 'cv2.error: Insufficient memory'.",
    )
    args = parser.parse_args()

    model = YOLO(args.model)

    model.train(
        data=str(DATA_YAML),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        patience=args.patience,
        workers=args.workers,
        augment=True,
        mosaic=1.0,
        mixup=0.1,
        hsv_h=0.02,
        hsv_s=0.6,
        hsv_v=0.4,
        project="runs",
        name="freshvision",
    )

    print("\nTraining completed.")
    print("Model saved: runs/freshvision/weights/best.pt")


if __name__ == "__main__":
    main()