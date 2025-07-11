import json
import sys
import os
import argparse
from ultralytics import YOLO
import cv2
import easyocr
import difflib
import re

def load_json_cards(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def limpiar_texto(texto):
    """Limpia el texto removiendo caracteres especiales y normalizando espacios"""
    texto = re.sub(r'[^\w\s]', ' ', texto)
    texto = re.sub(r'\s+', ' ', texto)
    return texto.strip().lower()

def buscar_cartas_por_keywords(text, cards, keywords_ref, similarity_threshold=0.75):
    """Busca cartas por palabras clave con tolerancia a errores"""
    texto = text.lower()
    palabras_encontradas = []
    
    # Dividir el texto en palabras para búsqueda más precisa
    palabras_texto = [p.strip() for p in limpiar_texto(texto).split()]
    
    # Buscar palabras clave en el texto usando similitud
    for keyword in keywords_ref:
        keyword_lower = keyword.lower()
        # Buscar coincidencia directa
        if keyword_lower in texto:
            palabras_encontradas.append(keyword)
            continue
            
        # Buscar similitud entre palabras
        for palabra in palabras_texto:
            if len(palabra) > 3:  # Solo palabras significativas
                ratio = difflib.SequenceMatcher(None, palabra, keyword_lower).ratio()
                if ratio >= similarity_threshold:
                    print(f"🔑 Palabra clave similar: '{palabra}' ≈ '{keyword}' ({ratio:.2f})")
                    palabras_encontradas.append(keyword)
                    break
    
    cartas_encontradas = []
    for card in cards:
        card_keywords = [str(kw).lower() for kw in card.get("keywords", [])]
        if any(kw in card_keywords for kw in palabras_encontradas):
            cartas_encontradas.append(card)
            
    return cartas_encontradas, palabras_encontradas

def buscar_cartas_por_nombre_similar(text, cards, min_sim=0.6):
    """Busca cartas por nombre con mayor tolerancia a errores"""
    # Separar el texto en palabras, eliminando signos y espacios extra
    palabras = [p.strip() for p in limpiar_texto(text).split()]
    nombres_encontrados = []
    palabras_encontradas = []
    
    # Búsqueda exacta primero
    for card in cards:
        name = card.get("name", "").lower()
        if name in text.lower():
            nombres_encontrados.append(card)
            palabras_encontradas.append(name)
            print(f"🎯 Coincidencia exacta: '{name}'")
            return nombres_encontrados, palabras_encontradas
    
    # Búsqueda por similitud de palabra
    for card in cards:
        name = card.get("name", "").lower()
        
        # Comprobar cada palabra individual
        for palabra in palabras:
            if len(palabra) >= 3:  # Ignorar palabras muy cortas
                # Comprobar si la palabra es parte del nombre de la carta
                if palabra in name:
                    ratio = len(palabra) / len(name)
                    if ratio > 0.5:  # La palabra debe ser una parte significativa
                        nombres_encontrados.append(card)
                        palabras_encontradas.append(palabra)
                        print(f"🔎 Coincidencia parcial: '{palabra}' en '{name}' (proporción: {ratio:.2f})")
                        break
                
                # Comprobar similitud        
                ratio = difflib.SequenceMatcher(None, palabra, name).ratio()
                if ratio >= min_sim:
                    nombres_encontrados.append(card)
                    palabras_encontradas.append(palabra)
                    print(f"🔍 Coincidencia por similitud: '{palabra}' ≈ '{name}' (similitud: {ratio:.2f})")
                    break
    
    return nombres_encontrados, palabras_encontradas

def scan_card(image_path, weights_path, json_path):
    model = YOLO(weights_path)
    results = model(image_path, conf=0.1)[0]
    print(f"📊 Detecciones encontradas: {len(results.boxes) if results.boxes is not None else 0}")

    image = cv2.imread(image_path)
    cards = load_json_cards(json_path)
    keywords_ref = [
        "recruit", "return", "push", "recharge", "recover", "vanquish", "ghost", "manifest", 
        "silence", "break", "reveal", "sacrifice", "clone", "morph", "chosen one", "wanderer", 
        "control", "flood", "approach", "unbreakable", "immune", "breakthrough", "assault", "undying"
    ]
    reader = easyocr.Reader(['en'])
    detections = []
    
    if results.boxes is not None and len(results.boxes) > 0:
        for i, box in enumerate(results.boxes):
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            confidence = float(box.conf[0])
            print(f"🔍 Procesando caja {i+1}: confianza={confidence:.2f}, coordenadas=({x1},{y1},{x2},{y2})")
            h, w = image.shape[:2]
            pad = 10
            x1p = max(x1 - pad, 0)
            y1p = max(y1 - pad, 0)
            x2p = min(x2 + pad, w)
            y2p = min(y2 + pad, h)
            roi = image[y1p:y2p, x1p:x2p]
            result = reader.readtext(roi)
            if result:
                text = result[0][1]
                print(f"📝 Texto detectado en caja {i+1}: {text.strip()}")
            else:
                text = ""
                print(f"⚠️ No se detectó texto en caja {i+1}")
                continue

            # Buscar coincidencias primero por nombre
            cartas_nombre, palabras_nombre = buscar_cartas_por_nombre_similar(text, cards, min_sim=0.6)
            cartas_kw, palabras_kw = buscar_cartas_por_keywords(text, cards, keywords_ref, similarity_threshold=0.75)
            
            if cartas_nombre:
                print(f"🃏 Cartas encontradas por nombre: {[c.get('name') for c in cartas_nombre]}")
                print(f"🔠 Palabras que coincidieron: {palabras_nombre}")
                detections.append((text, palabras_nombre, [c.get('name') for c in cartas_nombre]))
            elif cartas_kw:
                print(f"🃏 Cartas encontradas por palabras clave: {[c.get('name') for c in cartas_kw]}")
                print(f"🔑 Palabras clave detectadas: {palabras_kw}")
                detections.append((text, palabras_kw, [c.get('name') for c in cartas_kw]))
            else:
                print("❌ No se encontraron coincidencias para esta caja")
    else:
        print("❌ No se detectaron cajas. Intentando OCR en toda la imagen...")
        result = reader.readtext(image)
        if result:
            full_text = " ".join([r[1] for r in result])
            print(f"📄 Texto completo detectado: {full_text}")
        else:
            full_text = ""
            print("⚠️ No se detectó texto en la imagen completa")
        
        cartas_nombre, palabras_nombre = buscar_cartas_por_nombre_similar(full_text, cards, min_sim=0.6)
        cartas_kw, palabras_kw = buscar_cartas_por_keywords(full_text, cards, keywords_ref, similarity_threshold=0.75)
        
        if cartas_nombre:
            print(f"🃏 Cartas encontradas por nombre: {[c.get('name') for c in cartas_nombre]}")
            print(f"🔠 Palabras que coincidieron: {palabras_nombre}")
            detections.append((full_text, palabras_nombre, [c.get('name') for c in cartas_nombre]))
        elif cartas_kw:
            print(f"🃏 Cartas encontradas por palabras clave: {[c.get('name') for c in cartas_kw]}")
            print(f"🔑 Palabras clave detectadas: {palabras_kw}")
            detections.append((full_text, palabras_kw, [c.get('name') for c in cartas_kw]))
        else:
            print("❌ No se encontraron coincidencias en la imagen completa")

    print("\n🧠 Resultados finales:")
    if detections:
        for text, keywords, cartas in detections:
            print(f"\n📄 Texto: {text.strip()}")
            print(f"🔤 Palabras encontradas: {keywords}")
            print(f"🃏 Cartas detectadas: {cartas}")
    else:
        print("❌ No se encontraron cartas en esta imagen")
        
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Escáner de cartas con YOLO + OCR")
    parser.add_argument('--source', required=True, help="Ruta a la imagen")
    parser.add_argument('--weights', required=True, help="Ruta al modelo entrenado")
    parser.add_argument('--json', required=True, help="Ruta al archivo JSON de cartas")

    args = parser.parse_args()

    # Verificar que los archivos existan
    if not os.path.exists(args.source):
        print(f"❌ Error: La imagen no existe: {args.source}")
        sys.exit(1)
    
    if not os.path.exists(args.weights):
        print(f"❌ Error: El modelo no existe: {args.weights}")
        sys.exit(1)
    
    if not os.path.exists(args.json):
        print(f"❌ Error: El archivo JSON no existe: {args.json}")
        sys.exit(1)

    scan_card(args.source, args.weights, args.json)