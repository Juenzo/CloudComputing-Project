from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Course, Lesson
from ..shemas import (
	CourseCreate,
	CourseRead,
	CourseUpdate,
	LessonCreate,
	LessonRead,
	LessonUpdate,
)


router = APIRouter()


# Courses endpoints
@router.get("/courses", response_model=List[CourseRead])
def list_courses(db: Session = Depends(get_db)):
	return db.query(Course).order_by(Course.id.asc()).all()


@router.get("/courses/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db)):
	course = db.query(Course).filter(Course.id == course_id).first()
	if not course:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
	return course


@router.post("/courses", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
def create_course(payload: CourseCreate, db: Session = Depends(get_db)):
	exists = db.query(Course).filter(Course.slug == payload.slug).first()
	if exists:
		raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
	course = Course(
		slug=payload.slug,
		title=payload.title,
		level=payload.level,
		description=payload.description,
	)
	db.add(course)
	db.commit()
	db.refresh(course)
	return course


@router.put("/courses/{course_id}", response_model=CourseRead)
def update_course(course_id: int, payload: CourseUpdate, db: Session = Depends(get_db)):
	course = db.query(Course).filter(Course.id == course_id).first()
	if not course:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

	if payload.slug is not None:
		# Ensure slug uniqueness
		conflict = db.query(Course).filter(Course.slug == payload.slug, Course.id != course_id).first()
		if conflict:
			raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
		course.slug = payload.slug
	if payload.title is not None:
		course.title = payload.title
	if payload.level is not None:
		course.level = payload.level
	if payload.description is not None:
		course.description = payload.description

	db.commit()
	db.refresh(course)
	return course


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(course_id: int, db: Session = Depends(get_db)):
	course = db.query(Course).filter(Course.id == course_id).first()
	if not course:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
	db.delete(course)
	db.commit()
	return None


# Lessons endpoints
@router.get("/courses/{course_id}/lessons", response_model=List[LessonRead])
def list_lessons_for_course(course_id: int, db: Session = Depends(get_db)):
	# 404 if course not found (explicit)
	course_exists = db.query(Course.id).filter(Course.id == course_id).first()
	if not course_exists:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
	return db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.sort_order.asc(), Lesson.id.asc()).all()


@router.post("/courses/{course_id}/lessons", response_model=LessonRead, status_code=status.HTTP_201_CREATED)
def create_lesson_for_course(course_id: int, payload: LessonCreate, db: Session = Depends(get_db)):
	course = db.query(Course).filter(Course.id == course_id).first()
	if not course:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
	lesson = Lesson(
		course_id=course_id,
		slug=payload.slug,
		title=payload.title,
		duration=payload.duration,
		pdf_blob=payload.pdf_blob,
		quiz_blob=payload.quiz_blob,
		sort_order=payload.sort_order or 0,
	)
	db.add(lesson)
	db.commit()
	db.refresh(lesson)
	return lesson


@router.get("/lessons/{lesson_id}", response_model=LessonRead)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
	lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
	if not lesson:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
	return lesson


@router.put("/lessons/{lesson_id}", response_model=LessonRead)
def update_lesson(lesson_id: int, payload: LessonUpdate, db: Session = Depends(get_db)):
	lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
	if not lesson:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

	if payload.slug is not None:
		lesson.slug = payload.slug
	if payload.title is not None:
		lesson.title = payload.title
	if payload.duration is not None:
		lesson.duration = payload.duration
	if payload.pdf_blob is not None:
		lesson.pdf_blob = payload.pdf_blob
	if payload.quiz_blob is not None:
		lesson.quiz_blob = payload.quiz_blob
	if payload.sort_order is not None:
		lesson.sort_order = payload.sort_order

	db.commit()
	db.refresh(lesson)
	return lesson


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
	lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
	if not lesson:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
	db.delete(lesson)
	db.commit()
	return None
