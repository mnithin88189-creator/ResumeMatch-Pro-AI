
from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
from pypdf import PdfReader
from ai_matcher import calculate_ai_match

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__, static_folder=None)


def extract_pdf_text(file_storage):
    reader = PdfReader(file_storage.stream)
    pages = []

    for page in reader.pages:
        pages.append(page.extract_text() or "")

    return "\n".join(pages).strip()


# Home page
@app.get("/")
def index():
    return send_from_directory(BASE_DIR, "index(1).html")


# Frontend CSS and JavaScript files
@app.get("/<path:filename>")
def frontend_assets(filename):
    if filename not in {"app.js", "styles.css"}:
        return jsonify({"error": "Not found"}), 404

    return send_from_directory(BASE_DIR, filename)


# Backend health check
@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "ResumeMatch Pro AI Python Backend"
    })


# AI Resume Matching API
@app.post("/api/match")
def match_resume():
    resume_file = request.files.get("resume")

    if not resume_file or not resume_file.filename:
        return jsonify({"error": "Resume PDF is required."}), 400

    if not resume_file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF resumes are supported."}), 400

    job_skills_raw = request.form.get("job_skills", "")
    job_description = request.form.get("job_description", "")
    job_title = request.form.get("job_title", "")

    job_skills = [
        skill.strip()
        for skill in job_skills_raw.split(",")
        if skill.strip()
    ]

    if not job_skills:
        return jsonify({"error": "Job skills are required."}), 400

    try:
        resume_text = extract_pdf_text(resume_file)
    except Exception:
        return jsonify({"error": "Could not read the uploaded PDF."}), 400

    if not resume_text:
        return jsonify({
            "error": "No readable text found in PDF. Upload a text-based resume PDF."
        }), 400

    result = calculate_ai_match(
        resume_text=resume_text,
        job_title=job_title,
        job_description=job_description,
        job_skills=job_skills
    )

    return jsonify({
        "resume_text": resume_text,
        "resume_file_name": resume_file.filename,
        **result
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
