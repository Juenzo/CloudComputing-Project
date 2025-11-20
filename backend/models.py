from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

# --- COURSE ---
class CourseBase(SQLModel):
    title: str
    # CORRECTION ICI : Ajout de max_length=255 pour permettre l'indexation SQL Server
    slug: str = Field(unique=True, index=True, max_length=255)
    level: Optional[str] = None
    description: Optional[str] = None

class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lessons: List["Lesson"] = Relationship(back_populates="course", cascade_delete=True)

class CourseCreate(CourseBase):
    pass

class CourseRead(CourseBase):
    id: int


# --- LESSON ---
class LessonBase(SQLModel):
    title: str
    # CORRECTION CONSEILLÉE ICI AUSSI (Même si pas d'index explicite, c'est plus propre)
    slug: str = Field(max_length=255) 
    content_text: Optional[str] = None
    duration: Optional[str] = None
    sort_order: int = 0
    pdf_filename: Optional[str] = None
    video_filename: Optional[str] = None
    course_id: int = Field(foreign_key="course.id")

class Lesson(LessonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course: Course = Relationship(back_populates="lessons")
    questions: List["QuizQuestion"] = Relationship(back_populates="lesson", cascade_delete=True)

class LessonCreate(LessonBase):
    pass

class LessonRead(LessonBase):
    id: int


# --- QUIZ ---
# (Le reste du fichier ne change pas)
class QuizQuestionBase(SQLModel):
    text: str
    lesson_id: int = Field(foreign_key="lesson.id")

class QuizQuestion(QuizQuestionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    lesson: Lesson = Relationship(back_populates="questions")
    choices: List["QuizChoice"] = Relationship(back_populates="question", cascade_delete=True)

class QuizChoiceBase(SQLModel):
    text: str
    is_correct: bool = False
    question_id: int = Field(foreign_key="quizquestion.id")

class QuizChoice(QuizChoiceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question: QuizQuestion = Relationship(back_populates="choices")

class QuizChoiceRead(SQLModel):
    id: int
    text: str

class QuizQuestionRead(QuizQuestionBase):
    id: int
    choices: List[QuizChoiceRead] = []