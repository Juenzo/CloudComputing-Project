import os
from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions, ContentSettings

CONNECTION_STRING = os.getenv("STORAGE_ACCOUNT_CONNECTION_STRING")

CONTAINER_NAME = os.getenv("content_container_name", "content")
ACCOUNT_NAME = os.getenv("storage_account_name")
ACCOUNT_KEY = os.getenv("STORAGE_ACCOUNT_KEY") 

def get_blob_client(filename: str):
    # Construit la connection string si elle n'est pas fournie directement
    conn_str = CONNECTION_STRING
    if not conn_str and ACCOUNT_NAME and ACCOUNT_KEY:
         conn_str = f"DefaultEndpointsProtocol=https;AccountName={ACCOUNT_NAME};AccountKey={ACCOUNT_KEY};EndpointSuffix=core.windows.net"
    
    if not conn_str:
        raise Exception("Azure Storage Connection String not found")

    blob_service_client = BlobServiceClient.from_connection_string(conn_str)
    return blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=filename)

def upload_file_to_blob(file_obj, filename: str, content_type: str = None):
    blob_client = get_blob_client(filename)
    
    # Configuration des métadonnées du fichier
    my_content_settings = None
    if content_type:
        my_content_settings = ContentSettings(content_type=content_type)

    blob_client.upload_blob(
        file_obj, 
        overwrite=True, 
        content_settings=my_content_settings # On applique le type ici
    )
    return filename

def delete_file_from_blob(filename: str):
    """Supprime un fichier du conteneur Azure"""
    try:
        blob_client = get_blob_client(filename)
        blob_client.delete_blob()
        return True
    except Exception as e:
        print(f"Erreur lors de la suppression du blob {filename}: {e}")
        return False
    
def generate_sas_url(filename: str):
    """Génère une URL temporaire (1h) pour lire le fichier privé"""
    if not ACCOUNT_NAME or not ACCOUNT_KEY:
        return None
        
    sas_token = generate_blob_sas(
        account_name=ACCOUNT_NAME,
        account_key=ACCOUNT_KEY,
        container_name=CONTAINER_NAME,
        blob_name=filename,
        permission=BlobSasPermissions(read=True),
        expiry=datetime.now(timezone.utc) + timedelta(hours=1)
    )
    
    return f"https://{ACCOUNT_NAME}.blob.core.windows.net/{CONTAINER_NAME}/{filename}?{sas_token}"