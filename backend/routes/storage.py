from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.blob_service import upload_file_to_blob
from ..database import get_session
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload un fichier vers Azure Blob Storage et retourne le nom du fichier stocké"""
    try:
        # On génère un nom unique pour éviter les conflits
        extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{extension}"
        
        # Lecture et upload
        file_data = await file.read()
        uploaded_name = upload_file_to_blob(file_data, unique_filename)
        
        return {"filename": uploaded_name, "original_name": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))