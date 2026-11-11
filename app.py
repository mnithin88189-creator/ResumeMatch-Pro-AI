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
from werkzeug.security import generate_password_hash, check_password_hash

import uuid
import io
import re
import sqlite3


# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

DATABASE = BASE_DIR / "users.db"

MAX_RESUME_SIZE = 5 * 1024 * 1024

app = Flask(__name__, static_folder=None)

app.config["MAX_CONTENT_LENGTH"] = MAX_RESUME_SIZE + (100 * 1024)


# --------------------------------------------------
# DATABASE
# --------------------------------------------------

def get_db_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():

    connection = get_db_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(email, role)
        )
    """)

    connection.commit()
    connection.close()


initialize_database()


# --------------------------------------------------
# AUTHENTICATION VALIDATION
# --------------------------------------------------

def get_auth_data():

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return None

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    role = str(data.get("role", "")).strip().lower()

    return {
        "name": name,
        "email": email,
        "password": password,
        "role": role
    }


def valid_email(email):

    return bool(
        re.fullmatch(
            r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
            email
        )
    )


# --------------------------------------------------
# CREATE ACCOUNT API
# --------------------------------------------------

@app.post("/api/register")
def register():

    data = get_auth_data()

    if data is None:
        return jsonify({
            "error": "Please provide valid account details."
        }), 400

    name = data["name"]
    email = data["email"]
    password = data["password"]
    role = data["role"]

    if not name:
        return jsonify({
            "error": "Name is required."
        }), 400

    if not valid_email(email):
        return jsonify({
            "error": "Please enter a valid email address."
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters."
        }), 400

    if role not in ("student", "hr"):
        return jsonify({
            "error": "Please select a valid role."
        }), 400

    password_hash = generate_password_hash(password)

    connection = get_db_connection()

    try:

        
       
        connection.execute(
    """
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
    """,
    (name, email, password_hash, role)
)


        connection.commit()

    except sqlite3.IntegrityError:

        return jsonify({
            "error": "An account with this email already exists for this role."
        }), 409

    finally:
        connection.close()

    return jsonify({
        "message": "Account created successfully.",
        "name": name,
        "email": email,
        "role": role
    }), 201


# --------------------------------------------------
# LOGIN API
# --------------------------------------------------

@app.post("/api/login")
def login():

    data = get_auth_data()

    if data is None:
        return jsonify({
            "error": "Please provide your login details."
        }), 400

    email = data["email"]
    password = data["password"]
    role = data["role"]

    if not valid_email(email) or not password:
        return jsonify({
            "error": "Please enter a valid email and password."
        }), 400

    if role not in ("student", "hr"):
        return jsonify({
            "error": "Please select a valid role."
        }), 400

    connection = get_db_connection()

    user = connection.execute(
        """
        SELECT id, name, email, password_hash, role
        FROM users
        WHERE email = ? AND role = ?
        """,
        (email, role)
    ).fetchone()

    connection.close()

    if user is None or not check_password_hash(
        user["password_hash"],
        password
    ):
        return jsonify({
            "error": "Incorrect email or password."
        }), 401

    return jsonify({
        "message": "Login successful.",
        "name": user["name"],
        "email": user["email"],
        "role": user["role"]
    }), 200


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

    pdf_bytes = resume_file.read()

    file_size = len(pdf_bytes)

    if file_size == 0:
        return jsonify({
            "error": "Uploaded PDF is empty."
        }), 400

    if file_size > MAX_RESUME_SIZE:
        return jsonify({
            "error": "Resume file must be 5 MB or smaller."
        }), 413

    if not pdf_bytes.startswith(b"%PDF-"):
        return jsonify({
            "error": "Invalid PDF file. Please upload a valid PDF."
        }), 400

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

    # AI RESUME MATCHING

    try:
        result = calculate_ai_match(
            resume_text=resume_text,
            job_title=job_title,
            job_description=job_description,
            job_skills=job_skills
        )

    except Exception:
        app.logger.exception("AI resume matching failed")

        return jsonify({
            "error": "AI resume matching failed. Please try again."
        }), 500

    # SAVE ORIGINAL PDF

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

    # RESPONSE

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