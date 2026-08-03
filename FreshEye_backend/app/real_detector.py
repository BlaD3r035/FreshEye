import io
import cv2
import numpy as np
from PIL import Image, ImageOps
from ultralytics import YOLO

from app.config import MODEL_PATH


class ImagePreprocessor:

    def __init__(self, clahe_clip: float = 1.2, clahe_grid=(8, 8), max_dim: int = 1024):
        self.clahe = cv2.createCLAHE(clipLimit=clahe_clip, tileGridSize=clahe_grid)
        self.max_dim = max_dim
    # resize de imagen max 1024, mejor manejo de la imagen y de igual manera en yolo se reduce a 640
    def resize(self, img: np.ndarray) -> np.ndarray:
        h, w = img.shape[:2]
        scale = self.max_dim / max(h, w)
        if scale < 1:
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA) 
        return img
    
    # filtro bilateral (reduccion de ruido sin perder bordes )
    def denoise(self, img: np.ndarray) -> np.ndarray:
        return cv2.bilateralFilter(img, d=7, sigmaColor=50, sigmaSpace=50)
    
    # ecualizacion de histograma (mantiene contraste pero evita saturacion de colores)
    def enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        ycrcb = cv2.cvtColor(img, cv2.COLOR_BGR2YCrCb)
        y, cr, cb = cv2.split(ycrcb)
        y = self.clahe.apply(y)
        ycrcb = cv2.merge((y, cr, cb))
        return cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)

    # mejora de nitidez (aumenta el contraste de los bordes, mejor para hojas y detalles finos)
    def sharpen(self, img: np.ndarray) -> np.ndarray:
        blur = cv2.GaussianBlur(img, (0, 0), sigmaX=3)
        return cv2.addWeighted(img, 1.5, blur, -0.5, 0)


    def process(self, img: np.ndarray):
        img = self.resize(img)
        img = self.denoise(img)
        img = self.enhance_contrast(img)
        img = self.sharpen(img)
        
        return img


class RealDetector:
    def __init__(self, model_path: str = MODEL_PATH, confidence_threshold: float = 0.2):
        self.model = YOLO(model_path)
        self.confidence_threshold = confidence_threshold
        self.preprocessor = ImagePreprocessor()

    def predict(self, image_bytes: bytes):
        image = Image.open(io.BytesIO(image_bytes))
        image = ImageOps.exif_transpose(image).convert("RGB")

        img_array = np.array(image)
        img_array = img_array[:, :, ::-1]

        img_array = self.preprocessor.process(img_array)

        results = self.model(
            img_array,
            verbose=False,
            conf=self.confidence_threshold,
            augment=True,
            agnostic_nms=True,
        )[0]

        h, w = img_array.shape[:2]

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