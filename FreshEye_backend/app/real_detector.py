import io
import numpy as np
from PIL import Image, ImageOps
from ultralytics import YOLO

from app.config import MODEL_PATH


class RealDetector:
    def __init__(self, model_path: str = MODEL_PATH, confidence_threshold: float = 0.2):
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold

    def predict(self, image_bytes: bytes):
        image = Image.open(io.BytesIO(image_bytes))
    
        image = ImageOps.exif_transpose(image).convert("RGB")
        img_array = np.array(image)
       
        img_array = img_array[:, :, ::-1]

        results = self.model(
            img_array,
            verbose=False,
            conf=self.confidence_threshold,
            augment=True,  
            agnostic_nms=True,  
        )[0]

        w, h = image.size
        detecciones = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            clase_id = int(box.cls[0])
            confianza = round(float(box.conf[0]), 2)
            clase = self.model.names[clase_id]

          
            detecciones.append({
                "clase": clase,
                "confianza": confianza,
                "box": [
                    round(x1 / w, 3),
                    round(y1 / h, 3),
                    round(x2 / w, 3),
                    round(y2 / h, 3),
                ],
            })

        return detecciones

