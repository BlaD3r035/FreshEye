import argparse
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", default="../models/best.pt")
    args = parser.parse_args()

    model = YOLO(args.weights)
    ruta_exportada = model.export(format="onnx")
    print(f"\nModel exported to: {ruta_exportada}")
    print("To use it in the API you will need 'onnxruntime' instead of plain 'ultralytics'.")


if __name__ == "__main__":
    main()
