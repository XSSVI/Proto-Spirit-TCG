import pandas as pd
import requests
import os
from urllib.parse import urlparse
import time
import random
from pathlib import Path
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

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

def crear_session_robusta():
    """Crear una sesión de requests más robusta"""
    session = requests.Session()
    
    # Configurar reintentos
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    # Headers más completos para evitar detección de bot
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
    })
    
    return session

def leer_csv_urls(ruta_csv):
    """Leer URLs desde archivo CSV"""
    try:
        df = pd.read_csv(ruta_csv)
        
        print(f"📊 CSV cargado: {len(df)} filas")
        print(f"📋 Columnas disponibles: {list(df.columns)}")
        
        # Buscar columna con URLs automáticamente
        url_column = None
        for col in df.columns:
            col_lower = col.lower()
            if any(palabra in col_lower for palabra in ['url', 'link', 'imagen', 'image']):
                url_column = col
                break
        
        if url_column is None:
            print("Columnas disponibles:")
            for i, col in enumerate(df.columns):
                print(f"   {i}: {col}")
            
            idx = int(input("¿Qué columna contiene las URLs? (número): "))
            url_column = df.columns[idx]
        
        print(f"🔗 Usando columna: '{url_column}'")
        
        # Extraer URLs
        urls = df[url_column].dropna().astype(str).tolist()
        urls = [url.strip() for url in urls if url.strip() and 'http' in url]
        
        print(f"✅ {len(urls)} URLs válidas encontradas")
        return urls
        
    except Exception as e:
        print(f"❌ Error leyendo CSV: {e}")
        return []

def verificar_url_accesible(url, session, timeout=10):
    """Verificar si una URL es accesible antes de descargar"""
    try:
        response = session.head(url, timeout=timeout, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def descargar_imagen(url, ruta_destino, session, timeout=20):
    """Descargar una imagen desde URL con múltiples estrategias"""
    
    # Estrategia 1: Descarga normal
    try:
        response = session.get(url, timeout=timeout, stream=True)
        response.raise_for_status()
        
        with open(ruta_destino, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True, "OK"
        
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 401:
            # Estrategia 2: Intentar con headers adicionales
            try:
                headers_extra = {
                    'Referer': url.split('/')[0] + '//' + url.split('/')[2],
                    'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                }
                response = session.get(url, headers=headers_extra, timeout=timeout, stream=True)
                response.raise_for_status()
                
                with open(ruta_destino, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                return True, "OK con headers extra"
                
            except Exception as e2:
                return False, f"401 - No autorizado: {str(e2)[:30]}"
        else:
            return False, f"HTTP {e.response.status_code}: {str(e)[:30]}"
            
    except Exception as e:
        return False, f"Error: {str(e)[:30]}"

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
    else:
        return '.jpg'

def procesar_csv_cartas(ruta_csv, max_imagenes=70):
    """Función principal"""
    
    print(f"🔍 Leyendo CSV desde: {ruta_csv}")
    
    if not os.path.exists(ruta_csv):
        print(f"❌ No se encuentra el archivo: {ruta_csv}")
        return
    
    # Leer URLs del CSV
    urls = leer_csv_urls(ruta_csv)
    if not urls:
        return
    
    # Crear estructura
    crear_estructura_carpetas()
    
    # Crear sesión robusta
    session = crear_session_robusta()
    
    # Mostrar muestra
    print(f"\n📋 Muestra de URLs:")
    for i, url in enumerate(urls[:5]):
        print(f"   {i+1}. {url}")
    if len(urls) > 5:
        print(f"   ... y {len(urls)-5} más")
    
    # Verificar algunas URLs primero
    print(f"\n🔍 Verificando accesibilidad de las primeras URLs...")
    urls_accesibles = []
    for i, url in enumerate(urls[:10]):
        if verificar_url_accesible(url, session):
            urls_accesibles.append(url)
            print(f"   ✅ URL {i+1}: Accesible")
        else:
            print(f"   ❌ URL {i+1}: No accesible")
    
    if not urls_accesibles:
        print("❌ Ninguna de las primeras URLs es accesible. Revisa las URLs o la configuración.")
        return
    
    # Confirmar
    respuesta = input(f"\n¿Continuar descargando hasta {min(len(urls), max_imagenes)} imágenes? (s/n): ")
    if respuesta.lower() != 's':
        return
    
    # Limitar
    if len(urls) > max_imagenes:
        urls = urls[:max_imagenes]
    
    # Distribuir 70/20/10
    random.shuffle(urls)
    total = len(urls)
    train_end = int(total * 0.7)
    val_end = train_end + int(total * 0.2)
    
    distribucion = {
        'train': urls[:train_end],
        'val': urls[train_end:val_end], 
        'test': urls[val_end:]
    }
    
    print(f"\n📊 Distribución:")
    print(f"   Train: {len(distribucion['train'])}")
    print(f"   Val: {len(distribucion['val'])}")
    print(f"   Test: {len(distribucion['test'])}")
    
    # Descargar
    total_exitosas = 0
    errores_por_tipo = {}
    
    for conjunto, urls_conjunto in distribucion.items():
        if not urls_conjunto:
            continue
            
        print(f"\n🔄 Descargando {conjunto}...")
        carpeta = f'cartas_dataset/images/{conjunto}'
        
        exitosas = 0
        for i, url in enumerate(urls_conjunto, 1):
            print(f"   [{i:2}/{len(urls_conjunto)}] ", end='', flush=True)
            
            extension = obtener_extension_desde_url(url)
            nombre = f"{conjunto}_{i:03d}{extension}"
            ruta = os.path.join(carpeta, nombre)
            
            # Delay aleatorio entre descargas
            time.sleep(random.uniform(0.5, 1.5))
            
            exito, mensaje = descargar_imagen(url, ruta, session)
            if exito:
                exitosas += 1
                total_exitosas += 1
                print("✅")
            else:
                # Registrar tipo de error
                error_tipo = mensaje.split(':')[0]
                errores_por_tipo[error_tipo] = errores_por_tipo.get(error_tipo, 0) + 1
                print(f"❌ {mensaje}")
        
        print(f"   📊 {exitosas}/{len(urls_conjunto)} exitosas")
    
    # Mostrar resumen de errores
    if errores_por_tipo:
        print(f"\n📊 Resumen de errores:")
        for error, cantidad in errores_por_tipo.items():
            print(f"   {error}: {cantidad}")
    
    # Crear config solo si se descargaron imágenes
    if total_exitosas > 0:
        with open('cartas_dataset/data.yaml', 'w') as f:
            f.write("""path: ./cartas_dataset
train: images/train
val: images/val
test: images/test

nc: 1
names: ['carta']
""")
        
        print(f"\n🎉 ¡Completado! {total_exitosas} imágenes descargadas")
        print("💡 Sugerencias para mejorar:")
        print("   - Si muchas URLs fallan, verifica que sean públicas")
        print("   - Considera usar APIs oficiales si están disponibles")
        print("   - Algunos sitios requieren cookies o tokens de sesión")
    else:
        print("\n❌ No se pudo descargar ninguna imagen.")
        print("💡 Posibles soluciones:")
        print("   - Las URLs requieren autenticación")
        print("   - El sitio bloquea bots")
        print("   - Las URLs han expirado")

# EJECUTAR
if __name__ == "__main__":
    print("🚀 Descargador de imágenes desde CSV (Versión Mejorada)\n")
    
    # Buscar CSV
    rutas = [
        r"C:\Users\exqua\Downloads\Base\url",
        r"C:\Users\exqua\Downloads\Base\url.csv"
    ]
    
    csv_path = None
    for ruta in rutas:
        if os.path.exists(ruta):
            csv_path = ruta
            break
    
    if not csv_path:
        csv_path = input("Ingresa la ruta completa al CSV: ").strip()
    
    procesar_csv_cartas(csv_path)