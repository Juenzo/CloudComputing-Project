from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(Text, unique=True, nullable=False)
    title = Column(Text, nullable=False)
    level = Column(Text)
    description = Column(Text)

    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    slug = Column(Text, nullable=False)
    title = Column(Text, nullable=False)
    duration = Column(Text)
    pdf_blob = Column(Text)
    quiz_blob = Column(Text)
    sort_order = Column(Integer, default=0)

    course = relationship("Course", back_populates="lessons")
