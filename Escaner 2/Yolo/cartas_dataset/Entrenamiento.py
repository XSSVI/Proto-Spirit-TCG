import os
import cv2
import numpy as np
import random
import shutil
from pathlib import Path
import albumentations as A
from PIL import Image, ImageDraw
import yaml
import json
import warnings

# Suprimir warnings de libpng
warnings.filterwarnings("ignore", category=UserWarning, module="PIL")
os.environ['OPENCV_IO_ENABLE_OPENEXR'] = '1'

class CardDatasetPreprocessor:
    def __init__(self, input_folder, output_folder, card_classes=None):
        self.input_folder = Path(input_folder)
        self.output_folder = Path(output_folder)
        
        # Definir clases de cartas ampliadas (incluyendo marcos dorados/beige)
        if card_classes is None:
            self.card_classes = {
                'spirit': 0,      # Marco rojo/naranja (Spirit/Fire)
                'evocation': 1,   # Marco azul/cian (Evocation)
                'stasis': 2,      # Marco gris/blanco (Stasis)
                'blast': 3,       # Marco verde (Blast)
                'beyonder': 4,    # Marco dorado/beige (Beyonder/Dark)
                'hunter': 5,      # Marco marrón/tierra (Hunter)
                'carta': 6,       # Clase genérica para cartas no clasificadas
            }
        else:
            self.card_classes = card_classes
            
        self.setup_directories()
        
    def setup_directories(self):
        """Crear estructura de directorios para YOLO"""
        dirs = ['train/images', 'train/labels', 'val/images', 'val/labels', 'test/images', 'test/labels']
        for dir_path in dirs:
            (self.output_folder / dir_path).mkdir(parents=True, exist_ok=True)
    
    def create_occlusion_masks(self, image_shape, num_masks=3):
        """Crear máscaras de oclusión para simular partes tapadas (optimizado para cartas de juego)"""
        masks = []
        h, w = image_shape[:2]
        
        for _ in range(num_masks):
            mask = np.ones((h, w), dtype=np.uint8) * 255
            
            # Tipos de oclusión más realistas para cartas de juego
            occlusion_type = random.choice(['corner_fold', 'finger', 'partial_cover', 'edge_damage', 'shadow'])
            
            if occlusion_type == 'corner_fold':
                # Simular esquina doblada
                corner = random.choice(['tl', 'tr', 'bl', 'br'])
                fold_size = random.randint(min(w,h)//8, min(w,h)//4)
                
                if corner == 'tl':  # top-left
                    mask[0:fold_size, 0:fold_size] = 0
                elif corner == 'tr':  # top-right
                    mask[0:fold_size, w-fold_size:w] = 0
                elif corner == 'bl':  # bottom-left
                    mask[h-fold_size:h, 0:fold_size] = 0
                else:  # bottom-right
                    mask[h-fold_size:h, w-fold_size:w] = 0
                    
            elif occlusion_type == 'finger':
                # Simular dedo tapando parte de la carta
                finger_width = random.randint(w//15, w//8)
                finger_height = random.randint(h//6, h//3)
                
                x = random.randint(0, w - finger_width)
                y = random.randint(0, h - finger_height)
                
                # Crear forma ovalada para el dedo
                center_x, center_y = x + finger_width//2, y + finger_height//2
                cv2.ellipse(mask, (center_x, center_y), (finger_width//2, finger_height//2), 0, 0, 360, 0, -1)
                
            elif occlusion_type == 'partial_cover':
                # Simular otra carta parcialmente encima
                cover_width = random.randint(w//4, w//2)
                cover_height = random.randint(h//4, h//2)
                
                x = random.randint(0, w - cover_width)
                y = random.randint(0, h - cover_height)
                
                mask[y:y+cover_height, x:x+cover_width] = 0
                
            elif occlusion_type == 'edge_damage':
                # Simular borde dañado
                edge = random.choice(['top', 'bottom', 'left', 'right'])
                damage_size = random.randint(min(w,h)//20, min(w,h)//10)
                
                if edge == 'top':
                    mask[0:damage_size, :] = 0
                elif edge == 'bottom':
                    mask[h-damage_size:h, :] = 0
                elif edge == 'left':
                    mask[:, 0:damage_size] = 0
                else:  # right
                    mask[:, w-damage_size:w] = 0
                    
            else:  # shadow
                # Simular sombra diagonal
                shadow_thickness = random.randint(min(w,h)//15, min(w,h)//8)
                
                # Crear sombra diagonal
                for i in range(h):
                    start_x = int(i * 0.3)  # Pendiente de la sombra
                    end_x = min(w, start_x + shadow_thickness)
                    if start_x < w:
                        mask[i, start_x:end_x] = 0
            
            masks.append(mask)
        
        return masks
    
    def apply_augmentations(self, image, bbox=None):
        """Aplicar augmentaciones usando Albumentations (preservando colores de cartas)"""
        transform = A.Compose([
            # Augmentaciones de color más conservadoras para preservar la identidad del color
            A.RandomBrightnessContrast(brightness_limit=0.15, contrast_limit=0.15, p=0.5),
            A.HueSaturationValue(hue_shift_limit=5, sat_shift_limit=15, val_shift_limit=10, p=0.4),
            A.RandomGamma(gamma_limit=(1.0, 1.15), p=0.3),
            
            # Efectos de iluminación
            A.RandomShadow(p=0.3),
            A.RandomSunFlare(p=0.1),
            
            # Ruido y desenfoque (muy suaves para mantener legibilidad)
            A.OneOf([
                A.Blur(blur_limit=(3, 5), p=1.0),
                A.GaussNoise(var_limit=(5.0, 20.0), mean=0, p=1.0),
                A.MotionBlur(blur_limit=(3, 7), p=1.0),
            ], p=0.2),
            
            # Transformaciones geométricas (limitadas)
            A.Rotate(limit=8, p=0.4),
            A.RandomScale(scale_limit=0.08, p=0.3),
            A.Affine(translate_percent={'x': (-0.03, 0.03), 'y': (-0.03, 0.03)}, 
                    scale=(0.92, 1.08), rotate=(-3, 3), p=0.3),
            
            # Perspectiva (simular ángulo de vista)
            A.Perspective(scale=(0.01, 0.03), p=0.2),
            
            # Efectos de cámara muy suaves
            A.OpticalDistortion(distort_limit=0.05, p=0.1),
            A.GridDistortion(distort_limit=0.05, p=0.1),
            
        ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']) if bbox else None)
        
        if bbox:
            try:
                transformed = transform(image=image, bboxes=[bbox], class_labels=[0])
                return transformed['image'], transformed['bboxes'][0] if transformed['bboxes'] else bbox
            except Exception as e:
                print(f"Error en augmentación: {e}")
                return image, bbox
        else:
            try:
                return transform(image=image)['image'], None
            except Exception as e:
                print(f"Error en augmentación: {e}")
                return image, None
    
    def detect_card_color_type(self, image):
        """Detectar el tipo de carta basado en el color del marco (MEJORADO)"""
        # Convertir a diferentes espacios de color para mejor análisis
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        h, w = image.shape[:2]
        
        # Analizar múltiples regiones del marco (más preciso)
        border_width = max(8, min(w, h) // 25)  # Marco más delgado
        
        # Extraer múltiples regiones del marco
        regions = []
        # Bordes principales
        regions.append(hsv[0:border_width, :])  # top
        regions.append(hsv[h-border_width:h, :])  # bottom  
        regions.append(hsv[:, 0:border_width])  # left
        regions.append(hsv[:, w-border_width:w])  # right
        
        # Esquinas (donde el marco suele ser más visible)
        corner_size = border_width * 2
        regions.append(hsv[0:corner_size, 0:corner_size])  # top-left
        regions.append(hsv[0:corner_size, w-corner_size:w])  # top-right
        regions.append(hsv[h-corner_size:h, 0:corner_size])  # bottom-left
        regions.append(hsv[h-corner_size:h, w-corner_size:w])  # bottom-right
        
        # Definir rangos de color AMPLIADOS y más precisos
        color_ranges = {
            'spirit': {
                'hsv_ranges': [([0, 80, 80], [15, 255, 255]), ([165, 80, 80], [180, 255, 255])],
                'description': 'Spirit/Fire cards (red/orange frame)'
            },
            'evocation': {
                'hsv_ranges': [([90, 70, 70], [130, 255, 255])],
                'description': 'Evocation cards (blue/cyan frame)'
            },
            'blast': {
                'hsv_ranges': [([35, 70, 50], [85, 255, 255])],
                'description': 'Blast cards (green frame)'
            },
            'stasis': {
                'hsv_ranges': [([0, 0, 150], [180, 40, 255])],
                'description': 'Stasis cards (gray/white frame)'
            },
            'beyonder': {
                'hsv_ranges': [
                    ([15, 30, 120], [35, 150, 255]),  # Dorado/beige
                    ([20, 20, 140], [40, 100, 220]),  # Beige claro
                    ([10, 40, 100], [30, 120, 200])   # Dorado oscuro
                ],
                'description': 'Beyonder/Dark cards (golden/beige frame)'
            },
            'hunter': {
                'hsv_ranges': [
                    ([8, 50, 60], [25, 180, 160]),    # Marrón/tierra
                    ([15, 60, 80], [30, 200, 180])    # Marrón claro
                ],
                'description': 'Hunter cards (brown/earth frame)'
            }
        }
        
        # Análisis de color mejorado
        card_scores = {}
        
        for card_type, color_info in color_ranges.items():
            total_pixels = 0
            total_area = 0
            
            for region in regions:
                if region.size == 0:
                    continue
                    
                region_area = region.shape[0] * region.shape[1]
                total_area += region_area
                
                for hsv_range in color_info['hsv_ranges']:
                    try:
                        mask = cv2.inRange(region, np.array(hsv_range[0]), np.array(hsv_range[1]))
                        total_pixels += cv2.countNonZero(mask)
                    except Exception as e:
                        print(f"Error en detección de color {card_type}: {e}")
                        continue
            
            # Calcular score normalizado
            if total_area > 0:
                score = (total_pixels / total_area) * 100
                card_scores[card_type] = score
            else:
                card_scores[card_type] = 0
        
        # Análisis adicional usando LAB para colores dorados/beige
        if max(card_scores.values()) < 5:  # Si no se detectó color claro
            lab_regions = []
            for region_hsv in regions:
                if region_hsv.size > 0:
                    # Convertir región HSV de vuelta a BGR y luego a LAB
                    region_bgr = cv2.cvtColor(region_hsv, cv2.COLOR_HSV2BGR)
                    region_lab = cv2.cvtColor(region_bgr, cv2.COLOR_BGR2LAB)
                    lab_regions.append(region_lab)
            
            # Buscar colores dorados/beige en espacio LAB
            for region_lab in lab_regions:
                if region_lab.size == 0:
                    continue
                
                # Valores LAB típicos para dorado/beige
                # L: 60-90 (luminosidad media-alta)
                # A: 0-20 (ligeramente hacia rojo)
                # B: 10-40 (hacia amarillo)
                mask_beige = cv2.inRange(region_lab, 
                                       np.array([60, 0, 10]), 
                                       np.array([90, 20, 40]))
                
                beige_pixels = cv2.countNonZero(mask_beige)
                if beige_pixels > 0:
                    region_area = region_lab.shape[0] * region_lab.shape[1]
                    beige_score = (beige_pixels / region_area) * 100
                    
                    # Sumar al score de beyonder
                    card_scores['beyonder'] = card_scores.get('beyonder', 0) + beige_score
        
        # Encontrar el tipo con mayor score
        if card_scores:
            detected_type = max(card_scores, key=card_scores.get)
            max_score = card_scores[detected_type]
            
            print(f"Detección de color: {detected_type} (score: {max_score:.2f}%)")
            print(f"Todos los scores: {card_scores}")
            
            # Solo devolver detección si el score es suficientemente alto
            if max_score > 2:  # Umbral más bajo para cartas sutiles
                return detected_type
        
        # Si no se detecta ningún color específico, analizar texto o usar genérico
        print("No se detectó color específico, usando clase genérica")
        return 'carta'
    
    def detect_card_bbox(self, image):
        """Detectar automáticamente el bounding box de la carta (MEJORADO)"""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            h, w = image.shape[:2]
            
            # Método 1: Detección por threshold adaptativo
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                         cv2.THRESH_BINARY, 11, 2)
            
            # Operaciones morfológicas para limpiar la imagen
            kernel = np.ones((3,3), np.uint8)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
            thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
            
            # Encontrar contornos
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if not contours:
                # Método alternativo con detección de bordes Canny
                blurred = cv2.GaussianBlur(gray, (5, 5), 0)
                edges = cv2.Canny(blurred, 30, 100)  # Umbrales más bajos
                contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Filtrar contornos por área y forma
                min_area = (h * w) * 0.05  # Reducir área mínima al 5%
                max_area = (h * w) * 0.95  # Área máxima
                
                valid_contours = []
                for c in contours:
                    area = cv2.contourArea(c)
                    if min_area < area < max_area:
                        # Verificar que el contorno sea aproximadamente rectangular
                        peri = cv2.arcLength(c, True)
                        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
                        
                        # Calcular aspect ratio
                        x, y, cont_w, cont_h = cv2.boundingRect(c)
                        aspect_ratio = float(cont_w) / cont_h
                        
                        # Las cartas suelen tener aspect ratio entre 0.6 y 0.8
                        if 0.5 < aspect_ratio < 1.0:
                            valid_contours.append(c)
                
                if valid_contours:
                    # Si hay múltiples contornos válidos, elegir el más grande
                    largest_contour = max(valid_contours, key=cv2.contourArea)
                    
                    # Obtener rectángulo que encierra el contorno
                    x, y, cont_w, cont_h = cv2.boundingRect(largest_contour)
                    
                    # Añadir margen pequeño pero no excesivo
                    margin = 0.01
                    x = max(0, x - int(w * margin))
                    y = max(0, y - int(h * margin))
                    cont_w = min(w - x, cont_w + int(w * margin * 2))
                    cont_h = min(h - y, cont_h + int(h * margin * 2))
                    
                    # Convertir a formato YOLO
                    center_x = (x + cont_w/2) / w
                    center_y = (y + cont_h/2) / h
                    width = cont_w / w
                    height = cont_h / h
                    
                    # Validar rangos
                    center_x = max(0.0, min(1.0, center_x))
                    center_y = max(0.0, min(1.0, center_y))
                    width = max(0.0, min(1.0, width))
                    height = max(0.0, min(1.0, height))
                    
                    return [center_x, center_y, width, height]
            
            # Si no se detecta contorno válido, usar casi toda la imagen
            return [0.5, 0.5, 0.90, 0.90]
            
        except Exception as e:
            print(f"Error en detección de bbox: {e}")
            return [0.5, 0.5, 0.90, 0.90]
    
    def create_variations(self, image_path, num_variations=5):
        """Crear variaciones de una imagen con oclusiones y augmentaciones"""
        # Leer imagen con manejo de warnings
        try:
            # Usar PIL para leer y convertir a RGB, luego a BGR para OpenCV
            pil_image = Image.open(str(image_path)).convert('RGB')
            image = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Error al leer {image_path}: {e}")
            return []
        
        if image is None:
            return []
        
        # Detectar tipo de carta basado en color del marco
        card_type = self.detect_card_color_type(image)
        class_id = self.card_classes.get(card_type, self.card_classes.get('carta', 0))
        
        # Detectar bbox de la carta
        bbox = self.detect_card_bbox(image)
        
        variations = []
        
        # Imagen original
        variations.append((image.copy(), bbox, 'original', class_id))
        
        # Crear variaciones con oclusión
        try:
            masks = self.create_occlusion_masks(image.shape, num_variations//2)
            
            for i, mask in enumerate(masks):
                # Aplicar oclusión
                occluded_image = image.copy()
                occluded_image[mask == 0] = [0, 0, 0]  # Pintar de negro las áreas ocluidas
                
                # Aplicar augmentaciones
                aug_image, aug_bbox = self.apply_augmentations(occluded_image, bbox)
                variations.append((aug_image, aug_bbox, f'occluded_{i}', class_id))
        except Exception as e:
            print(f"Error en creación de oclusiones: {e}")
        
        # Crear variaciones solo con augmentaciones (sin oclusión)
        try:
            for i in range(num_variations - len([v for v in variations if 'occluded' in v[2]])):
                aug_image, aug_bbox = self.apply_augmentations(image.copy(), bbox)
                variations.append((aug_image, aug_bbox, f'augmented_{i}', class_id))
        except Exception as e:
            print(f"Error en augmentaciones: {e}")
        
        return variations
    
    def save_yolo_format(self, image, bbox, image_path, label_path, class_id=0):
        """Guardar imagen y etiqueta en formato YOLO"""
        try:
            # Guardar imagen
            cv2.imwrite(str(image_path), image)
            
            # Guardar etiqueta con clase detectada
            with open(label_path, 'w') as f:
                f.write(f"{class_id} {bbox[0]} {bbox[1]} {bbox[2]} {bbox[3]}\n")
        except Exception as e:
            print(f"Error al guardar {image_path}: {e}")
    
    def process_dataset(self, train_split=0.7, val_split=0.2, variations_per_image=5):
        """Procesar todo el dataset"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
        image_files = [f for f in self.input_folder.iterdir() 
                      if f.suffix.lower() in image_extensions]
        
        if not image_files:
            print("No se encontraron imágenes en la carpeta especificada")
            return
        
        # Mezclar imágenes
        random.shuffle(image_files)
        
        # Dividir dataset
        n_train = int(len(image_files) * train_split)
        n_val = int(len(image_files) * val_split)
        
        train_files = image_files[:n_train]
        val_files = image_files[n_train:n_train + n_val]
        test_files = image_files[n_train + n_val:]
        
        print(f"Procesando {len(image_files)} imágenes:")
        print(f"- Train: {len(train_files)}")
        print(f"- Validation: {len(val_files)}")
        print(f"- Test: {len(test_files)}")
        
        # Procesar cada split
        for split_name, files in [('train', train_files), ('val', val_files), ('test', test_files)]:
            print(f"\nProcesando {split_name}...")
            
            image_counter = 0
            for img_file in files:
                print(f"Procesando: {img_file.name}")
                
                try:
                    # Crear variaciones
                    variations = self.create_variations(img_file, variations_per_image)
                    
                    for var_image, bbox, var_type, class_id in variations:
                        # Nombres de archivos
                        base_name = f"{img_file.stem}_{var_type}_{image_counter:04d}"
                        image_path = self.output_folder / split_name / 'images' / f"{base_name}.jpg"
                        label_path = self.output_folder / split_name / 'labels' / f"{base_name}.txt"
                        
                        # Guardar en formato YOLO con la clase detectada
                        self.save_yolo_format(var_image, bbox, image_path, label_path, class_id)
                        image_counter += 1
                        
                except Exception as e:
                    print(f"Error procesando {img_file.name}: {e}")
                    continue
        
        # Crear archivo de configuración YAML
        self.create_yaml_config()
        print(f"\n¡Dataset procesado exitosamente!")
        print(f"Archivos guardados en: {self.output_folder}")
    
    def create_yaml_config(self):
        """Crear archivo de configuración para YOLO"""
        config = {
            'path': str(self.output_folder.absolute()),
            'train': 'train/images',
            'val': 'val/images',
            'test': 'test/images',
            'nc': len(self.card_classes),  # número de clases
            'names': list(self.card_classes.keys())  # nombres de las clases
        }
        
        yaml_path = self.output_folder / 'dataset.yaml'
        with open(yaml_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        
        print(f"Archivo de configuración creado: {yaml_path}")
        print(f"Clases detectadas: {list(self.card_classes.keys())}")

def train_yolo_model(dataset_path, model_size='n'):
    """Entrenar modelo YOLO"""
    try:
        from ultralytics import YOLO
        
        # Cargar modelo pre-entrenado
        model = YOLO(f'yolov8{model_size}.pt')
        
        # Entrenar
        results = model.train(
            data=str(Path(dataset_path) / 'dataset.yaml'),
            epochs=100,
            imgsz=640,
            batch=16,
            device='auto', 
            patience=20,
            save=True,
            project='card_detection',
            name='yolo_cards'
        )
        
        print("¡Entrenamiento completado!")
        return model
        
    except ImportError:
        print("Instala ultralytics para entrenar: pip install ultralytics")
        return None

# Ejemplo de uso
if __name__ == "__main__":
    INPUT_FOLDER = r"C:/Users/exqua/Downloads/Imgs"  # Cambiar por ruta imagenes
    OUTPUT_FOLDER = "dataset_cartas_yolo"
    
    # Definir clases de cartas AMPLIADAS
    CARD_CLASSES = {
        'spirit': 0,      # Cartas con marco rojo/naranja (Spirit/Fire)
        'evocation': 1,   # Cartas con marco azul/cian (Evocation)
        'stasis': 2,      # Cartas con marco gris/blanco (Stasis)
        'blast': 3,      
        'beyonder': 4,    
        'hunter': 5,      
        'carta': 6        # Clase genérica para cartas no clasificadas
    }
    
    # Crear y procesar dataset
    processor = CardDatasetPreprocessor(INPUT_FOLDER, OUTPUT_FOLDER, CARD_CLASSES)
    processor.process_dataset(
        train_split=0.7,
        val_split=0.2,
        variations_per_image=8  # Número de variaciones por imagen
    )
    
    # Entrenar modelo (opcional)
    # model = train_yolo_model(OUTPUT_FOLDER, model_size='n')  # 'n', 's', 'm', 'l', 'x'