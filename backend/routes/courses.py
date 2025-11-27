import re
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlmodel import Session, select

# Import des modèles
from ..models import (
    Course, CourseCreate, CourseRead, 
    Lesson, LessonCreate, LessonRead
)
from ..database import get_session
from ..services.blob_service import generate_sas_url, delete_file_from_blob, upload_file_to_blob

router = APIRouter()

# --- UTILITAIRE : Slugify ---
def create_slug(title: str) -> str:
    # Transforme "Mon Super Cours !" en "mon-super-cours"
    slug = title.lower().strip()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

# ==========================================
#                 COURSES
# ==========================================

@router.get("/courses", response_model=List[CourseRead])
def list_courses(session: Session = Depends(get_session)):
    """Liste tous les cours disponibles"""
    courses = session.exec(select(Course)).all()
    return courses

@router.post("/courses", response_model=CourseRead)
def create_course(course: CourseCreate, session: Session = Depends(get_session)):
    """Crée un nouveau cours (juste les infos, pas de fichier ici)"""
    # Génération du slug si non fourni
    if not course.slug:
        course.slug = create_slug(course.title)
    
    # Vérif unicité slug
    existing = session.exec(select(Course).where(Course.slug == course.slug)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Un cours avec ce titre/slug existe déjà.")

    db_course = Course.model_validate(course)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course

@router.get("/courses/{slug_or_id}", response_model=CourseRead)
def get_course(slug_or_id: str, session: Session = Depends(get_session)):
    """Récupère un cours par son ID ou son SLUG"""
    if slug_or_id.isdigit():
        course = session.get(Course, int(slug_or_id))
    else:
        course = session.exec(select(Course).where(Course.slug == slug_or_id)).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    return course

@router.delete("/courses/{course_id}")
def delete_course(course_id: int, session: Session = Depends(get_session)):
    """Supprime un cours et ses leçons (Nettoyage des blobs géré en cascade si besoin)"""
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Cours introuvable")
    
    for lesson in course.lessons:
        if lesson.content_url:
            delete_file_from_blob(lesson.content_url)

    session.delete(course)
    session.commit()
    return {"message": "Cours supprimé"}

# ==========================================
#                 LESSONS
# ==========================================

@router.get("/courses/{course_id}/lessons", response_model=List[LessonRead])
def list_lessons_for_course(course_id: int, session: Session = Depends(get_session)):
    """Liste les leçons d'un cours, triées par ordre"""
    # Vérif si le cours existe
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Cours introuvable")
        
    statement = select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.order)
    lessons = session.exec(statement).all()
    return lessons

@router.post("/lessons", response_model=LessonRead)
def create_lesson(
    course_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    content_type: str = Form("text"),
    content_text: str = Form(None),
    content_url: str = Form(None),
    order: int = Form(0),
    file: UploadFile = File(None),
    session: Session = Depends(get_session)
):
    """
    Ajoute une leçon à un cours.
    Supporte 2 modes:
    - contenu texte (content_type=text + content_text)
    - contenu fichier (upload) ou lien externe (content_url)
    """
    if not session.get(Course, course_id):
        raise HTTPException(status_code=404, detail="Cours lié introuvable")

    final_content_type = content_type or "text"
    final_content_url = None
    final_content_text = None

    # Gestion upload fichier si présent
    if file:
        try:
            ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
            unique_filename = f"{uuid.uuid4()}.{ext}"

            upload_file_to_blob(file.file, unique_filename)

            final_content_url = unique_filename

            if ext == "pdf":
                final_content_type = "pdf"
            elif ext in ["mp4", "mov", "avi"]:
                final_content_type = "video"
            elif ext in ["doc", "docx"]:
                final_content_type = "word"
            else:
                # Par défaut, on garde le type fourni ou texte
                final_content_type = final_content_type or "text"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur upload Azure : {str(e)}")
    else:
        # Pas de fichier: soit texte, soit lien externe
        if (final_content_type == "text") and content_text:
            final_content_text = content_text
        elif final_content_type in ["pdf", "video", "word", "link"] and content_url:
            final_content_url = content_url

    # Validation du type via l'Enum côté modèle
    try:
        from ..models import ContentType as ContentTypeEnum
        enum_type = ContentTypeEnum(final_content_type)
    except Exception:
        raise HTTPException(status_code=422, detail=f"content_type invalide: {final_content_type}")

    db_lesson = Lesson(
        title=title,
        description=description,
        course_id=course_id,
        order=order,
        content_type=enum_type,
        content_url=final_content_url,
        content_text=final_content_text,
    )

    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

@router.get("/lessons/{lesson_id}")
def get_lesson_details(lesson_id: int, session: Session = Depends(get_session)):
    """
    Récupère le contenu d'une leçon.
    Si c'est un fichier Azure (Video/PDF), génère une URL signée temporaire.
    """
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    
    response = lesson.model_dump()
    
    # Si la leçon contient un fichier stocké sur Azure (content_url)
    # On ne signe QUE si c'est un blob interne (pas une URL http(s))
    if lesson.content_url and not str(lesson.content_url).lower().startswith(("http://", "https://")):
        signed_url = generate_sas_url(lesson.content_url)
        response["content_url_signed"] = signed_url
    
    return response

@router.put("/lessons/{lesson_id}", response_model=LessonRead)
def update_lesson(lesson_id: int, lesson_update: LessonCreate, session: Session = Depends(get_session)):
    db_lesson = session.get(Lesson, lesson_id)
    if not db_lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    
    lesson_data = lesson_update.model_dump(exclude_unset=True)
    for key, value in lesson_data.items():
        setattr(db_lesson, key, value)
        
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, session: Session = Depends(get_session)):
    """Supprime une leçon ET son fichier associé sur Azure (Nettoyage complet)"""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Leçon introuvable")
    
    # 1. Nettoyage Azure Blob Storage
    # Si la leçon a un fichier attaché (PDF/Vidéo), on le supprime du Cloud
    if lesson.content_url:
        delete_file_from_blob(lesson.content_url)
    
    # 2. Suppression BDD
    session.delete(lesson)
    session.commit()
    
    return {"message": "Leçon et fichier associé supprimés"}