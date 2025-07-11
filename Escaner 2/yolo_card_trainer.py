import os
import json
import random
import numpy as np
import cv2
from pathlib import Path
from ultralytics import YOLO
from typing import List, Dict, Tuple
import torch

class YOLOCardTextTrainer:
    def __init__(self, cards_json_path: str, images_folder: str, dataset_path: str = "dataset"):
        self.cards_data = self.load_cards_data(cards_json_path)
        self.images_folder = Path(images_folder)
        self.dataset_path = Path(dataset_path)
        self.text_classes = self.create_text_class_mapping()
        self.image_extensions = ['.jpg', '.jpeg', '.png']

    def load_cards_data(self, json_path: str) -> List[Dict]:
        with open(json_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def create_text_class_mapping(self) -> Dict[str, int]:
        return {
            'card_name': 0,
            'element_type': 1,
            'species': 2,
            'description': 3,
            'stats': 4,
            'card_code': 5
        }

    def get_image_files(self) -> List[Path]:
        files = []
        for ext in self.image_extensions:
            files.extend(self.images_folder.glob(f'*{ext}'))
        return files

    def setup_dataset_structure(self):
        for split in ['train', 'val', 'test']:
            (self.dataset_path / 'images' / split).mkdir(parents=True, exist_ok=True)
            (self.dataset_path / 'labels' / split).mkdir(parents=True, exist_ok=True)

    def create_annotation(self, class_id: int, x: float, y: float, w: float, h: float, img_w: int, img_h: int) -> str:
        cx = (x + w / 2) / img_w
        cy = (y + h / 2) / img_h
        nw = w / img_w
        nh = h / img_h
        return f"{class_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}"

    def create_precise_annotations(self, img: np.ndarray) -> List[str]:
        h, w = img.shape[:2]
        boxes = []

        # Define relative boxes (customized for layout like OOF cards)
        layout = {
            'card_name':     (0.10, 0.03, 0.80, 0.05),
            'element_type':  (0.08, 0.72, 0.84, 0.035),
            'species':       (0.08, 0.76, 0.45, 0.03),
            'description':   (0.08, 0.81, 0.84, 0.10),
            'stats':         (0.65, 0.91, 0.30, 0.05),
            'card_code':     (0.80, 0.97, 0.18, 0.02)
        }

        for key, (x, y, bw, bh) in layout.items():
            class_id = self.text_classes[key]
            abs_x = int(x * w)
            abs_y = int(y * h)
            abs_w = int(bw * w)
            abs_h = int(bh * h)
            boxes.append(self.create_annotation(class_id, abs_x, abs_y, abs_w, abs_h, w, h))

        return boxes

    def process_real_images(self, apply_augmentation: bool = True):
        files = self.get_image_files()
        if not files:
            print("❌ No se encontraron imágenes.")
            return 0

        print(f"🔍 Procesando {len(files)} imágenes...")
        self.setup_dataset_structure()
        count = 0

        for i, img_path in enumerate(files):
            img = cv2.imread(str(img_path))
            if img is None:
                print(f"⚠️ No se pudo cargar {img_path.name}")
                continue

            annotations = self.create_precise_annotations(img)
            if not annotations:
                print(f"❌ No se detectó texto en {img_path.name}")
                continue

            split = 'train' if i < len(files) * 0.7 else 'val' if i < len(files) * 0.85 else 'test'
            img_name = f"{img_path.stem}_{count:04d}.jpg"
            label_name = f"{img_path.stem}_{count:04d}.txt"

            cv2.imwrite(str(self.dataset_path / 'images' / split / img_name), img)
            with open(self.dataset_path / 'labels' / split / label_name, 'w') as f:
                f.write('\n'.join(annotations))

            count += 1

        print(f"✅ Procesamiento completo: {count} imágenes con anotaciones.")
        return count

    def create_yaml_config(self):
        config = {
            'path': str(self.dataset_path.absolute()),
            'train': 'images/train',
            'val': 'images/val',
            'test': 'images/test',
            'nc': len(self.text_classes),
            'names': list(self.text_classes.keys())
        }
        with open(self.dataset_path / 'config.yaml', 'w') as f:
            import yaml
            yaml.dump(config, f)
        return self.dataset_path / 'config.yaml'

    def get_optimal_device(self):
        if torch.cuda.is_available():
            print(f"🟢 Usando GPU: {torch.cuda.get_device_name(0)}")
            return 'cuda'
        print("🟡 Usando CPU")
        return 'cpu'

    def train_model(self, epochs=100, batch_size=4, img_size=640):
        self.setup_dataset_structure()
        yaml_path = self.create_yaml_config()
        processed = self.process_real_images()
        if processed == 0:
            print("❌ No se procesaron imágenes para entrenamiento.")
            return None

        device = self.get_optimal_device()
        model = YOLO('yolov8n.pt')
        return model.train(
            data=str(yaml_path),
            epochs=epochs,
            imgsz=img_size,
            batch=batch_size,
            project="runs/detect",
            name="card_text_fixedlayout",
            device=device,
            val=True,
            verbose=True
        )

if __name__ == "__main__":
    trainer = YOLOCardTextTrainer(
        cards_json_path="D:/trabajo/Escaner 2/Cartas.Collection3.json",
        images_folder="D:/trabajo/Escaner 2/cartas_prueba"
    )

    print("🚀 Iniciando entrenamiento...")
    results = trainer.train_model(epochs=100, batch_size=4)
    if results:
        print("🎯 ¡Entrenamiento completado!")
