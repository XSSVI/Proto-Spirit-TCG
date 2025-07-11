import pandas as pd
import requests
import os
from urllib.parse import urlparse
import time
import random
from pathlib import Path

def crear_estructura_carpetas():
    """Crear la estructura de carpetas para YOLO"""
    carpetas = [
        'cartas_dataset/images/train',
        'cartas_dataset/images/val', 
        'cartas_dataset/images/test',
        'cartas_dataset/labels/train',
        'cartas_dataset/labels/val',
        'cartas_dataset/labels/test'
    ]
    
    for carpeta in carpetas:
        Path(carpeta).mkdir(parents=True, exist_ok=True)
    print("✅ Estructura de carpetas creada")

def leer_csv_urls(ruta_csv):
    """Leer URLs desde archivo CSV"""
    try:
        # Intentar leer el CSV
        df = pd.read_csv(ruta_csv)
        
        print(f"📊 CSV cargado: {len(df)} filas")
        print(f"📋 Columnas disponibles: {list(df.columns)}")
        
        # Buscar columna con URLs automáticamente
        url_column = None
        for col in df.columns:
            col_lower = col.lower()
            if any(palabra in col_lower for palabra in ['url', 'link', 'imagen', 'image', 'photo', 'foto']):
                url_column = col
                break
        
        if url_column is None:
            print("❌ No se encontró columna de URLs automáticamente.")
            print("Columnas disponibles:")
            for i, col in enumerate(df.columns):
                print(f"   {i}: {col}")
            
            idx = int(input("¿Qué columna contiene las URLs? (número): "))
            url_column = df.columns[idx]
        
        print(f"🔗 Usando columna: '{url_column}'")
        
        # Extraer URLs y limpiar
        urls = df[url_column].dropna().astype(str).tolist()
        urls = [url.strip() for url in urls if url.strip() and url.lower() != 'nan']
        
        print(f"✅ {len(urls)} URLs válidas encontradas")
        return urls
        
    except Exception as e:
        print(f"❌ Error leyendo CSV: {e}")
        return []

def es_url_valida(url):
    """Verificar si la URL parece válida"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def obtener_extension_desde_url(url):
    """Extraer extensión del archivo desde URL"""
    parsed = urlparse(url)
    path = parsed.path.lower()
    
    if path.endswith(('.jpg', '.jpeg')):
        return '.jpg'
    elif path.endswith('.png'):
        return '.png'
    elif path.endswith('.webp'):
        return '.webp'
    elif path.endswith('.gif'):
        return '.gif'
    else:
        return '.jpg'  # Por defecto

def descargar_imagen(url, ruta_destino, timeout=15):
    """Descargar una imagen desde URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        response.raise_for_status()
        
        # Verificar tamaño del archivo (evitar archivos muy grandes)
        content_length = response.headers.get('content-length')
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB max
            print(f"⚠️  Archivo muy grande: {url}")
            return False
        
        # Verificar que sea una imagen
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            print(f"⚠️  No es imagen: {url}")
            return False
            
        with open(ruta_destino, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Verificar que el archivo se descargó correctamente
        if os.path.getsize(ruta_destino) < 1024:  # Menos de 1KB
            os.remove(ruta_destino)
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)[:50]}...")
        return False

def distribuir_imagenes(urls, train_pct=0.7, val_pct=0.2, test_pct=0.1):
    """Distribuir URLs entre train/val/test"""
    urls_validas = [url for url in urls if es_url_valida(url)]
    print(f"🔗 URLs válidas: {len(urls_validas)}/{len(urls)}")
    
    random.shuffle(urls_validas)
    
    total = len(urls_validas)
    train_end = int(total * train_pct)
    val_end = train_end + int(total * val_pct)
    
    return {
        'train': urls_validas[:train_end],
        'val': urls_validas[train_end:val_end], 
        'test': urls_validas[val_end:]
    }

def procesar_csv_cartas(ruta_csv, max_imagenes=500):
    """Función principal para procesar CSV y descargar imágenes"""
    
    print(f"🔍 Leyendo CSV desde: {ruta_csv}")
    
    # Verificar que existe el archivo
    if not os.path.exists(ruta_csv):
        print(f"❌ No se encuentra el archivo: {ruta_csv}")
        return
    
    # Leer URLs del CSV
    urls = leer_csv_urls(ruta_csv)
    if not urls:
        print("❌ No se pudieron extraer URLs del CSV")
        return
    
    # Crear estructura de carpetas
    crear_estructura_carpetas()
    
    # Mostrar muestra de URLs
    print(f"\n📋 Muestra de URLs encontradas:")
    for i, url in enumerate(urls[:5]):
        print(f"   {i+1}. {url}")
    if len(urls) > 5:
        print(f"   ... y {len(urls)-5} más")
    
    # Confirmar antes de continuar
    respuesta = input(f"\n¿Proceder con la descarga de {min(len(urls), max_imagenes)} imágenes? (s/n): ")
    if respuesta.lower() != 's':
        print("❌ Cancelado por el usuario")
        return
    
    # Limitar número de imágenes si es necesario
    if len(urls) > max_imagenes:
        urls = random.sample(urls, max_imagenes)
        print(f"📊 Limitando a {max_imagenes} imágenes")
    
    # Distribuir en train/val/test
    distribucion = distribuir_imagenes(urls)
    
    print(f"\n📊 Distribución del dataset:")
    print(f"   🎯 Train: {len(distribucion['train'])} imágenes (70%)")
    print(f"   ✅ Val: {len(distribucion['val'])} imágenes (20%)")
    print(f"   🧪 Test: {len(distribucion['test'])} imágenes (10%)")
    
    # Descargar cada conjunto
    total_exitosas = 0
    for conjunto, urls_conjunto in distribucion.items():
        if not urls_conjunto:
            continue
            
        print(f"\n🔄 Descargando {conjunto.upper()}...")
        carpeta_destino = f'cartas_dataset/images/{conjunto}'
        
        exitosas = 0
        for i, url in enumerate(urls_conjunto, 1):
            print(f"   [{i:3}/{len(urls_conjunto)}] ", end='')
            
            # Generar nombre de archivo único
            extension = obtener_extension_desde_url(url)
            nombre_archivo = f"{conjunto}_{i:04d}{extension}"
            ruta_completa = os.path.join(carpeta_destino, nombre_archivo)
            
            if descargar_imagen(url, ruta_completa):
                exitosas += 1
                total_exitosas += 1
                print("✅")
            else:
                print("❌")
            
            # Pausa para no sobrecargar servidores
            time.sleep(0.3)
        
        print(f"   📊 {conjunto}: {exitosas}/{len(urls_conjunto)} exitosas ({exitosas/len(urls_conjunto)*100:.1f}%)")
    
    # Crear archivo de configuración
    crear_data_yaml()
    
    print(f"\n🎉 ¡Descarga completada!")
    print(f"📊 Total de imágenes descargadas: {total_exitosas}")
    print(f"📁 Dataset guardado en: cartas_dataset/")
    print(f"📋 Próximo paso: Etiquetar las imágenes con LabelImg")

def crear_data_yaml():
    """Crear archivo de configuración YOLO"""
    config = """# Configuración del dataset de cartas
path: ./cartas_dataset
train: images/train
val: images/val
test: images/test

nc: 1  # número de clases
names: ['carta']  # nombres de las clases
"""
    
    with open('cartas_dataset/data.yaml', 'w', encoding='utf-8') as f:
        f.write(config)
    print("✅ data.yaml creado")

# ===== EJECUTAR SCRIPT =====
if __name__ == "__main__":
    # Tu ruta del CSV
    CSV_PATH = r"C:\Users\exqua\Downloads\Base\url"
    
    print("🚀 Script de descarga de imágenes desde CSV")
    print("="*50)
    
    # Verificar si el path tiene extensión
    if not CSV_PATH.endswith('.csv'):
        # Buscar archivos CSV en la carpeta
        if os.path.isdir(CSV_PATH):
            archivos_csv = [f for f in os.listdir(CSV_PATH) if f.endswith('.csv')]
            if archivos_csv:
                print(f"📁 Archivos CSV encontrados en {CSV_PATH}:")
                for i, archivo in enumerate(archivos_csv):
                    print(f"   {i}: {archivo}")
                
                idx = int(input("¿Qué archivo CSV usar? (número): "))
                CSV_PATH = os.path.join(CSV_PATH, archivos_csv[idx])
            else:
                print(f"❌ No se encontraron archivos CSV en: {CSV_PATH}")
                exit()
    
    print(f"📄 Usando archivo: {CSV_PATH}")
    
    # Procesar el CSV
    procesar_csv_cartas(CSV_PATH, max_imagenes=300)  # Ajusta max_imagenes según necesites