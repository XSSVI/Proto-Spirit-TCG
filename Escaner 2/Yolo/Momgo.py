from pymongo import MongoClient
import json
from pathlib import Path

# Conexión a MongoDB Atlas
DB_USERNAME = "exquard00"
DB_PASSWORD = "ABC123"
DB_NAME = "Cartas"
COLLECTION_NAME = "imagenes"

MONGO_URI = f"mongodb+srv://{DB_USERNAME}:{DB_PASSWORD}@cartas.a3sy8yn.mongodb.net/?retryWrites=true&w=majority&appName=Cartas"

def extraer_urls_y_codigos():
    """
    Extrae las URLs y códigos (nombres sin extensión) de todas las imágenes
    """
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]
        
        # Obtener todas las imágenes
        imagenes = list(collection.find({}, {
            "nombre_archivo": 1, 
            "imagen_url": 1, 
            "_id": 0
        }))
        
        if not imagenes:
            print("❌ No se encontraron imágenes en la base de datos")
            return []
        
        # Procesar cada imagen
        resultado = []
        
        print(f"📋 Procesando {len(imagenes)} imágenes...")
        print("-" * 60)
        
        for img in imagenes:
            # Extraer nombre sin extensión
            nombre_archivo = img["nombre_archivo"]
            code = Path(nombre_archivo).stem  # Quita la extensión (.png, .jpg, etc.)
            url = img["imagen_url"]
            
            # Crear objeto con los tags solicitados
            item = {
                "code": code,
                "url": url
            }
            
            resultado.append(item)
            
            print(f"✅ {nombre_archivo} -> code: '{code}', url: {url}")
        
        print("-" * 60)
        print(f"📊 Total procesadas: {len(resultado)}")
        
        return resultado
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return []

def guardar_como_json(datos, nombre_archivo="imagenes_urls.json"):
    """
    Guarda los datos en un archivo JSON
    """
    try:
        with open(nombre_archivo, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Archivo guardado como: {nombre_archivo}")
        
    except Exception as e:
        print(f"❌ Error guardando archivo: {e}")

def mostrar_formato_python(datos):
    """
    Muestra los datos en formato de lista de Python
    """
    print("\n🐍 Formato Python (lista de diccionarios):")
    print("-" * 50)
    print("imagenes = [")
    for item in datos:
        print(f'    {{"code": "{item["code"]}", "url": "{item["url"]}"}},')
    print("]")

def mostrar_solo_urls(datos):
    """
    Muestra solo las URLs para copiar fácilmente
    """
    print("\n🔗 Solo URLs:")
    print("-" * 50)
    for item in datos:
        print(f"{item['code']}: {item['url']}")

def crear_nueva_coleccion(datos):
    """
    Crea una nueva colección en MongoDB con solo code y url
    """
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        nueva_collection = db["urls_limpias"]  # Nueva colección
        
        # Limpiar colección si existe
        nueva_collection.delete_many({})
        
        # Insertar datos limpios
        if datos:
            nueva_collection.insert_many(datos)
            print(f"💾 Nueva colección 'urls_limpias' creada con {len(datos)} registros")
        
    except Exception as e:
        print(f"❌ Error creando nueva colección: {e}")

# Ejecutar el script
if __name__ == "__main__":
    print("🚀 Extrayendo URLs y códigos de imágenes...")
    print("=" * 60)
    
    # Extraer datos
    datos = extraer_urls_y_codigos()
    
    if datos:
        # Mostrar diferentes formatos
        print("\n" + "=" * 60)
        
        # 1. Guardar como JSON
        guardar_como_json(datos)
        
        # 2. Mostrar en formato Python
        mostrar_formato_python(datos)
        
        # 3. Mostrar solo URLs
        mostrar_solo_urls(datos)
        
        # 4. Crear nueva colección en MongoDB (opcional)
        respuesta = input("\n¿Quieres crear una nueva colección 'urls_limpias' en MongoDB? (s/n): ")
        if respuesta.lower() in ['s', 'si', 'sí', 'yes', 'y']:
            crear_nueva_coleccion(datos)
        
        print("\n✅ ¡Proceso completado!")
        
    else:
        print("❌ No se pudieron extraer los datos")