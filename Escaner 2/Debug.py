import cv2
import numpy as np
from ultralytics import YOLO
import easyocr
from card_scanner import load_json_cards, improve_ocr_preprocessing, get_text_class_name

def debug_card_detection(image_path, weights_path, json_path):
    """Versión de debugging para ver exactamente qué está fallando"""
    print("="*80)
    print("🔍 MODO DEBUG - ANÁLISIS COMPLETO DE DETECCIÓN")
    print("="*80)
    
    # Cargar modelo y imagen
    model = YOLO(weights_path)
    image = cv2.imread(image_path)
    cards = load_json_cards(json_path)
    reader = easyocr.Reader(['es', 'en'])
    
    print(f"📸 Imagen cargada: {image.shape}")
    print(f"🃏 Cartas en base de datos: {len(cards)}")
    
    # Probar con múltiples umbrales
    for conf_threshold in [0.1, 0.2, 0.3, 0.4, 0.5]:
        print(f"\n🎯 Probando con umbral de confianza: {conf_threshold}")
        
        results = model(image_path, conf=conf_threshold)[0]
        print(f"📊 Detecciones encontradas: {len(results.boxes) if results.boxes is not None else 0}")
        
        if results.boxes is not None and len(results.boxes) > 0:
            for i, box in enumerate(results.boxes):
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                class_id = int(box.cls[0]) if hasattr(box, 'cls') else 0
                class_name = get_text_class_name(class_id)
                
                print(f"\n📦 Caja {i+1}:")
                print(f"   🎯 Confianza: {confidence:.3f}")
                print(f"   📍 Coordenadas: ({x1}, {y1}) -> ({x2}, {y2})")
                print(f"   🏷️ Clase: {class_name} (ID: {class_id})")
                print(f"   📏 Tamaño: {x2-x1}x{y2-y1}")
                
                # Extraer ROI
                h, w = image.shape[:2]
                pad = 10
                x1p = max(x1 - pad, 0)
                y1p = max(y1 - pad, 0)
                x2p = min(x2 + pad, w)
                y2p = min(y2 + pad, h)
                roi = image[y1p:y2p, x1p:x2p]
                
                # Guardar ROI para inspección
                roi_filename = f"debug_roi_{conf_threshold}_{i+1}.jpg"
                cv2.imwrite(roi_filename, roi)
                print(f"   💾 ROI guardada: {roi_filename}")
                
                # Probar OCR en ROI original
                print("   🔤 OCR en imagen original:")
                try:
                    ocr_result = reader.readtext(roi)
                    if ocr_result:
                        for j, (bbox, text, conf) in enumerate(ocr_result):
                            print(f"      Texto {j+1}: '{text}' (confianza: {conf:.3f})")
                    else:
                        print("      ❌ No se detectó texto")
                except Exception as e:
                    print(f"      ❌ Error en OCR: {e}")
                
                # Probar OCR en ROI mejorada
                print("   🔤 OCR en imagen mejorada:")
                try:
                    improved_roi = improve_ocr_preprocessing(roi)
                    improved_filename = f"debug_improved_roi_{conf_threshold}_{i+1}.jpg"
                    cv2.imwrite(improved_filename, improved_roi)
                    print(f"   💾 ROI mejorada guardada: {improved_filename}")
                    
                    ocr_result = reader.readtext(improved_roi)
                    if ocr_result:
                        for j, (bbox, text, conf) in enumerate(ocr_result):
                            print(f"      Texto {j+1}: '{text}' (confianza: {conf:.3f})")
                    else:
                        print("      ❌ No se detectó texto")
                except Exception as e:
                    print(f"      ❌ Error en OCR mejorado: {e}")
            
            break  # Si encontramos detecciones, no probar umbrales más altos
        else:
            print("   ❌ No se encontraron detecciones")
    
    # Si no se encontraron detecciones, probar OCR en toda la imagen
    if results.boxes is None or len(results.boxes) == 0:
        print("\n🖼️ Probando OCR en toda la imagen:")
        try:
            full_ocr = reader.readtext(image)
            if full_ocr:
                print(f"   ✅ Texto encontrado en imagen completa:")
                for i, (bbox, text, conf) in enumerate(full_ocr):
                    print(f"      {i+1}: '{text}' (confianza: {conf:.3f})")
            else:
                print("   ❌ No se detectó texto en toda la imagen")
        except Exception as e:
            print(f"   ❌ Error en OCR completo: {e}")
    
    print("\n" + "="*80)
    print("🏁 DEBUG COMPLETADO")
    print("="*80)

if __name__ == "__main__":
    # Probar con la primera carta
    debug_card_detection(
        image_path="D:/trabajo/Escaner 2/cartas_prueba/OOF-02.png",  # Ajusta el path
        weights_path="runs/detect/card_text_detection_precise/weights/best.pt",
        json_path="D:/trabajo/Escaner 2/Cartas.Collection3.json"
    )