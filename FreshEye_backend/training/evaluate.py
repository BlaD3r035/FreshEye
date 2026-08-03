import argparse
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--weights",
        default="../models/best.pt",
        help="Path to the trained model (best.pt)",
    )
    args = parser.parse_args()
    # carga el modelo YOLO y evalua con dataset Val
    model = YOLO(args.weights)
    metrics = model.val()

    print("\n===== RESULTS =====")
    print(f"mAP50    : {metrics.box.map50:.4f}  ")
    print(f"mAP50-95 : {metrics.box.map:.4f} ")



if __name__ == "__main__":
    main()
