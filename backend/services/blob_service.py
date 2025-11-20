import os
from datetime import datetime, timedelta, timezone
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions

CONNECTION_STRING = os.getenv("STORAGE_ACCOUNT_CONNECTION_STRING") # A rajouter dans tes outputs Terraform ou .env manuellement pour le dev local
# En prod (Azure App Service), on utilise souvent l'identité gérée, mais la connection string est plus simple pour ce projet.
# Si tu n'as pas la connection string complète, tu peux la construire avec STORAGE_ACCOUNT_NAME et KEY.

CONTAINER_NAME = os.getenv("content_container_name", "content")
ACCOUNT_NAME = os.getenv("STORAGE_ACCOUNT_NAME")
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

def upload_file_to_blob(file_obj, filename: str):
    blob_client = get_blob_client(filename)
    blob_client.upload_blob(file_obj, overwrite=True)
    return filename

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