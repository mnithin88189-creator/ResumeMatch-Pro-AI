
from flask import (
    Flask,
    jsonify,
    request,
    send_from_directory,
    abort
)

from pathlib import Path
from pypdf import PdfReader
from ai_matcher import calculate_ai_match

from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge

import uuid
import io
import re


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB

# Allow small multipart form overhead.
app = Flask(__name__, static_folder=None)

app.config["MAX_CONTENT_LENGTH"] = MAX_RESUME_SIZE + (100 * 1024)


# --------------------------------------------------
# PDF TEXT EXTRACTION
# --------------------------------------------------

def extract_pdf_text(pdf_bytes):

    reader = PdfReader(io.BytesIO(pdf_bytes))

    pages = []

    for page in reader.pages:
        pages.append(page.extract_text() or "")

    return "\n".join(pages).strip()


# --------------------------------------------------
# FILE SIZE FORMAT
# --------------------------------------------------

def get_file_size(file_size):

    return round(file_size / (1024 * 1024), 2)


# --------------------------------------------------
# HOME PAGE
# --------------------------------------------------

@app.get("/")
def index():

    return send_from_directory(BASE_DIR, "index(1).html")


# --------------------------------------------------
# FRONTEND CSS AND JAVASCRIPT
# --------------------------------------------------

@app.get("/<path:filename>")
def frontend_assets(filename):

    if filename not in {"app.js", "styles.css"}:
        return jsonify({"error": "Not found"}), 404

    return send_from_directory(BASE_DIR, filename)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():

    return jsonify({
        "status": "ok",
        "service": "ResumeMatch Pro AI Python Backend"
    })


# --------------------------------------------------
# UPLOAD AND AI RESUME MATCHING
# --------------------------------------------------

@app.post("/api/match")
def match_resume():

    resume_file = request.files.get("resume")

    if not resume_file or not resume_file.filename:
        return jsonify({
            "error": "Resume PDF is required."
        }), 400

    original_filename = secure_filename(resume_file.filename)

    if not original_filename:
        return jsonify({
            "error": "Invalid resume filename."
        }), 400

    if not original_filename.lower().endswith(".pdf"):
        return jsonify({
            "error": "Only PDF resumes are supported."
        }), 400

    # Read uploaded file into memory.
    pdf_bytes = resume_file.read()

    # Validate actual file size.
    file_size = len(pdf_bytes)

    if file_size == 0:
        return jsonify({
            "error": "Uploaded PDF is empty."
        }), 400

    if file_size > MAX_RESUME_SIZE:
        return jsonify({
            "error": "Resume file must be 5 MB or smaller."
        }), 413

    # Validate PDF signature.
    if not pdf_bytes.startswith(b"%PDF-"):
        return jsonify({
            "error": "Invalid PDF file. Please upload a valid PDF."
        }), 400

    # Get job information.
    job_skills_raw = request.form.get("job_skills", "")
    job_description = request.form.get("job_description", "")
    job_title = request.form.get("job_title", "")

    job_skills = [
        skill.strip()
        for skill in job_skills_raw.split(",")
        if skill.strip()
    ]

    if not job_skills:
        return jsonify({
            "error": "Job skills are required."
        }), 400

    # Extract resume text.
    try:

        resume_text = extract_pdf_text(pdf_bytes)

    except Exception:

        return jsonify({
            "error": "Could not read the uploaded PDF."
        }), 400

    if not resume_text:

        return jsonify({
            "error": (
                "No readable text found in PDF. "
                "Upload a text-based resume PDF."
            )
        }), 400

    # --------------------------------------------------
    # SEMANTIC AI MATCHING
    # --------------------------------------------------

    try:

        result = calculate_ai_match(
            resume_text=resume_text,
            job_title=job_title,
            job_description=job_description,
            job_skills=job_skills
        )

    except Exception as error:

        app.logger.exception("AI resume matching failed")

        return jsonify({
            "error": "AI resume matching failed. Please try again."
        }), 500

    # --------------------------------------------------
    # SAVE ORIGINAL PDF
    # --------------------------------------------------

    resume_id = uuid.uuid4().hex

    stored_filename = f"{resume_id}.pdf"

    file_path = UPLOAD_DIR / stored_filename

    try:

        file_path.write_bytes(pdf_bytes)

    except OSError:

        app.logger.exception("Could not save uploaded resume")

        return jsonify({
            "error": "Could not save the uploaded resume."
        }), 500

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return jsonify({

        "resume_text": resume_text,

        "resume_file_name": original_filename,

        "resume_file_size_bytes": file_size,

        "resume_file_size_mb": get_file_size(file_size),

        "resume_id": resume_id,

        "resume_download_url": f"/api/resume/{resume_id}",

        **result

    })


# --------------------------------------------------
# DOWNLOAD ORIGINAL RESUME
# --------------------------------------------------

@app.get("/api/resume/<resume_id>")
def download_resume(resume_id):

    # Accept only generated UUID-style hexadecimal IDs.
    if not re.fullmatch(r"[a-f0-9]{32}", resume_id):
        abort(404)

    stored_filename = f"{resume_id}.pdf"

    file_path = UPLOAD_DIR / stored_filename

    if not file_path.is_file():
        abort(404)

    return send_from_directory(
        UPLOAD_DIR,
        stored_filename,
        as_attachment=True,
        download_name=f"Resume_{resume_id[:8]}.pdf"
    )


# --------------------------------------------------
# FILE SIZE ERROR HANDLER
# --------------------------------------------------

@app.errorhandler(RequestEntityTooLarge)
def handle_large_file(error):

    return jsonify({
        "error": "Upload is too large. Maximum allowed size is 5 MB."
    }), 413


# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
