from fastapi import APIRouter, UploadFile, File, HTTPException
from ..services.blob_service import upload_file_to_blob, delete_file_from_blob
import uuid

router = APIRouter()

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    1. Reçoit un fichier (PDF, Vidéo, Image...)
    2. L'envoie sur Azure Blob Storage
    3. Retourne le nom unique du fichier à stocker dans la BDD (content_url)
    """
    try:
        # Génération d'un nom unique (ex: "mon-cours.pdf" -> "a1b2-c3d4... .pdf")
        extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid.uuid4()}.{extension}"
        
        # Lecture et envoi
        file_data = await file.read()
        uploaded_name = upload_file_to_blob(file_data, unique_filename)
        
        return {
            "filename": uploaded_name, 
            "original_name": file.filename,
            "message": "Fichier uploadé avec succès. Utilisez 'filename' pour créer votre leçon."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur upload : {str(e)}")
    

@router.delete("/upload/{filename}")
def delete_uploaded_file(filename: str):
    """Route utilitaire pour supprimer un fichier manuellement"""
    success = delete_file_from_blob(filename)
    if not success:
        raise HTTPException(status_code=404, detail="Fichier introuvable ou erreur suppression")
    return {"message": f"Fichier {filename} supprimé avec succès"}