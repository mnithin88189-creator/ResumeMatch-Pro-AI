# ResumeMatch Pro AI – Semantic Resume Job Matching Engine

An AI-powered resume and job matching application that analyzes resumes against job requirements using Natural Language Processing (NLP) and Machine Learning techniques.

## 🌐 Live Demo

**Live Website:** https://resumematch-pro-ai.onrender.com

## 🚀 Features

- Resume PDF upload and text extraction.
- AI-powered resume and job matching.
- ATS compatibility score calculation.
- Matched skills identification.
- Job description analysis.
- TF-IDF and Cosine Similarity.
- Student dashboard with ATS score updates.
- Job listings and Apply Job functionality.

## 🧠 AI Matching Method

The application uses:

1. **TF-IDF:** Converts resume and job description text into numerical features.
2. **Cosine Similarity:** Measures textual similarity.
3. **Skill Matching:** Identifies skills present in the resume.
4. **ATS Score:** Combines skill matching and NLP similarity.

Matching score calculation:

- Skill Matching – 65%
- NLP Similarity – 35%

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Backend | Python, Flask |
| Machine Learning | Scikit-learn |
| NLP | TF-IDF, Cosine Similarity |
| PDF Processing | pypdf |
| Deployment | Render |
| Version Control | Git, GitHub |
| Production Server | Gunicorn |

## 📂 Project Structure

```text
ResumeMatch-Pro-AI/
│
├── app.py
├── ai_matcher.py
├── app.js
├── styles.css
├── index(1).html
├── requirements.txt
├── README.md
├── run_project.bat
└── .gitignore
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/mnithin88189-creator/ResumeMatch-Pro-AI.git
```

### 2. Open the project folder

```bash
cd ResumeMatch-Pro-AI
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
python app.py
```

### 5. Open in browser

```text
http://127.0.0.1:5000
```

## 🔗 API Endpoint

**Health Check**

```text
GET /api/health
```

**Resume Matching**

```text
POST /api/match
```

The matching endpoint accepts a PDF resume, job title, job description, and required job skills.

## ☁️ Deployment

Deployed using Render.

**Build Command:**

```bash
pip install -r requirements.txt
```

**Start Command:**

```bash
gunicorn --bind 0.0.0.0:$PORT app:app
```

## 🎯 Project Objective

To simplify the recruitment process by analyzing resumes, identifying relevant skills, and measuring how closely a candidate's resume matches a job description.

## 👨‍💻 Developer

**M. Nithin**

B.Tech – Artificial Intelligence

GitHub: https://github.com/mnithin88189-creator

---

*Note: The generated ATS score is an indicative matching score and should not be treated as an official score from any employer's ATS platform.*
