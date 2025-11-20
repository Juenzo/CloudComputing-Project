from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from ..database import get_session
from ..models import Course, CourseCreate, CourseRead, Lesson, LessonCreate, LessonRead
from ..services.blob_service import generate_sas_url

router = APIRouter()

# --- COURSES ---
@router.get("/courses", response_model=List[CourseRead])
def list_courses(session: Session = Depends(get_session)):
    courses = session.exec(select(Course)).all()
    return courses

@router.post("/courses", response_model=CourseRead)
def create_course(course: CourseCreate, session: Session = Depends(get_session)):
    db_course = Course.model_validate(course)
    session.add(db_course)
    session.commit()
    session.refresh(db_course)
    return db_course

@router.get("/courses/{course_id}", response_model=CourseRead)
def get_course(course_id: int, session: Session = Depends(get_session)):
    course = session.get(Course, course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

# --- LESSONS ---
@router.get("/courses/{course_id}/lessons", response_model=List[LessonRead])
def list_lessons(course_id: int, session: Session = Depends(get_session)):
    statement = select(Lesson).where(Lesson.course_id == course_id).order_by(Lesson.sort_order)
    lessons = session.exec(statement).all()
    return lessons

@router.post("/lessons", response_model=LessonRead)
def create_lesson(lesson: LessonCreate, session: Session = Depends(get_session)):
    db_lesson = Lesson.model_validate(lesson)
    session.add(db_lesson)
    session.commit()
    session.refresh(db_lesson)
    return db_lesson

@router.get("/lessons/{lesson_id}/content")
def get_lesson_content(lesson_id: int, session: Session = Depends(get_session)):
    """Retourne les URLs signées pour lire les fichiers PDF/Vidéo"""
    lesson = session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    return {
        "pdf_url": generate_sas_url(lesson.pdf_filename) if lesson.pdf_filename else None,
        "video_url": generate_sas_url(lesson.video_filename) if lesson.video_filename else None,
        "text": lesson.content_text
    }