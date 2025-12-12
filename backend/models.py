from typing import List, Optional
from enum import Enum
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel

# --- ENUMS ---
class CategoryName(str, Enum):
    programming = "Programming"
    cloud = "Cloud"
    data_science = "Data Science"
    design = "Design"
    marketing = "Marketing"
    business = "Business"

class ContentType(str, Enum):
    video = "video"
    pdf = "pdf"
    word = "word"
    text = "text"
    link = "link"

# --- COURSE ---
class CourseBase(SQLModel):
    title: str = Field(index=True, max_length=255)
    description: Optional[str] = None
    category: CategoryName = CategoryName.programming
    level: Optional[str] = "Beginner"
    image_url: Optional[str] = None

class Course(CourseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    slug: str = Field(unique=True, index=True, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    lessons: List["Lesson"] = Relationship(back_populates="course", cascade_delete=True)
    quizzes: List["Quiz"] = Relationship(back_populates="course", cascade_delete=True)

class CourseCreate(CourseBase):
    slug: Optional[str] = Field(default=None, unique=True, index=True, max_length=255)

class CourseRead(CourseBase):
    id: int
    slug: str
    created_at: datetime


# --- LESSON ---
class LessonBase(SQLModel):
    title: str
    description: Optional[str] = None
    content_type: ContentType = ContentType.text 
    content_url: Optional[str] = None # URL vers Azure Blob Storage (PDF, Vidéo, Word...)
    content_text: Optional[str] = None # Pour du contenu texte direct (Markdown/HTML)
    order: int = 0 # Pour ordonner les leçons (1, 2, 3...)
    course_id: int = Field(foreign_key="course.id")

class Lesson(LessonBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course: Course = Relationship(back_populates="lessons")

class LessonCreate(LessonBase):
    pass

class LessonRead(LessonBase):
    id: int


# --- QUIZ ---
class QuizBase(SQLModel):
    title: str
    description: Optional[str] = None
    order: int = 0
    course_id: int = Field(foreign_key="course.id")

class Quiz(QuizBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    course: Course = Relationship(back_populates="quizzes")
    questions: List["QuizQuestion"] = Relationship(back_populates="quiz", cascade_delete=True)

class QuizCreate(QuizBase):
    pass

class QuizRead(QuizBase):
    id: int


# --- QUIZ QUESTION ---
class QuizQuestionBase(SQLModel):
    text: str
    points: int = 1
    quiz_id: int = Field(foreign_key="quiz.id")

class QuizQuestion(QuizQuestionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    quiz: Quiz = Relationship(back_populates="questions")
    choices: List["QuizChoice"] = Relationship(back_populates="question", cascade_delete=True)

class QuizQuestionRead(QuizQuestionBase):
    id: int


# --- QUIZ CHOICE ---
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
    # On n'envoie PAS is_correct au front-end pour éviter la triche !

# --- Mises à jour des modèles de lecture imbriqués ---
# Ces classes permettent de lire un Quiz avec ses questions d'un coup
class QuizQuestionReadWithChoices(QuizQuestionRead):
    choices: List[QuizChoiceRead] = []

class QuizReadWithQuestions(QuizRead):
    questions: List[QuizQuestionReadWithChoices] = []