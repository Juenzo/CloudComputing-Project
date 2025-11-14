CREATE TABLE IF NOT EXISTS courses (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,     -- ex: 'cloud-intro'
  title       TEXT NOT NULL,
  level       TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
  id          SERIAL PRIMARY KEY,
  course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,            -- ex: 'cloud-1'
  title       TEXT NOT NULL,
  duration    TEXT,
  pdf_blob    TEXT,                     -- ex: 'pdf/evaluation.pdf'
  quiz_blob   TEXT,
  sort_order  INTEGER DEFAULT 0
);
