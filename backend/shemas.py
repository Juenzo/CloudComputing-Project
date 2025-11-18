from typing import Optional, List

from pydantic import BaseModel, Field


# Courses
class CourseBase(BaseModel):
	slug: str = Field(..., examples=["cloud-intro"])
	title: str
	level: Optional[str] = None
	description: Optional[str] = None


class CourseCreate(CourseBase):
	pass


class CourseUpdate(BaseModel):
	slug: Optional[str] = None
	title: Optional[str] = None
	level: Optional[str] = None
	description: Optional[str] = None


class CourseRead(CourseBase):
	id: int

	class Config:
		from_attributes = True


# Lessons
class LessonBase(BaseModel):
	slug: str
	title: str
	duration: Optional[str] = None
	pdf_blob: Optional[str] = None
	quiz_blob: Optional[str] = None
	sort_order: Optional[int] = 0


class LessonCreate(LessonBase):
	pass


class LessonUpdate(BaseModel):
	slug: Optional[str] = None
	title: Optional[str] = None
	duration: Optional[str] = None
	pdf_blob: Optional[str] = None
	quiz_blob: Optional[str] = None
	sort_order: Optional[int] = None


class LessonRead(LessonBase):
	id: int
	course_id: int

	class Config:
		from_attributes = True
