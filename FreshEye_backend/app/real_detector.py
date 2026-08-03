import io
import numpy as np
from PIL import Image, ImageOps
from ultralytics import YOLO

from app.config import MODEL_PATH


class RealDetector:
    def __init__(self, model_path: str = MODEL_PATH, confidence_threshold: float = 0.2):
        # carga el modelo YOLO desde el archivo
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold

    def predict(self, image_bytes: bytes):
        # 
        image = Image.open(io.BytesIO(image_bytes))
        # corrige la orientación de la imagen y la pasa a 3 canales
        image = ImageOps.exif_transpose(image).convert("RGB")
        # convierte la imagen a un array de numpy y cambia el orden de los canales para
        # interpretación del modelo
        img_array = np.array(image)
        img_array = img_array[:, :, ::-1]

        results = self.model(
            img_array,
            verbose=False,
            conf=self.confidence_threshold, 
            augment=True,  # evalua la imagen en varias iteraciones para mejorar la detección
            agnostic_nms=True, # inpide sobreposición de clases en la misma caja
        )[0]

        w, h = image.size
        detecciones = []
        for box in results.boxes:
            # por item sacar caja. id trust y clase
            x1, y1, x2, y2 = box.xyxy[0].tolist()  # normalizada 0-1
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
            """      
                {"clase": "Huevo", "confianza": 0.87, "box": [0.12, 0.30, 0.45, 0.62]},
                {"clase": "Tomate", "confianza": 0.73, "box": [0.50, 0.20, 0.71, 0.55]},
            
            """
   

        return detecciones

