ResumeMatch Pro AI - Python + AI/NLP Version

WHAT CHANGED
- Added Python Flask backend.
- Added PDF resume processing in Python using pypdf.
- Added NLP/ML-assisted ATS matching using TF-IDF and cosine similarity with skill matching.
- Student still uploads only a Resume PDF; Resume Summary is removed.
- Existing Student/HR dashboard and localStorage demo workflow are preserved.

HOW TO RUN
1. Install Python.
2. Open this project folder in Command Prompt / PowerShell.
3. Run: python -m pip install -r requirements.txt
4. Run: python app.py
5. Open: http://127.0.0.1:5000

IMPORTANT
Do not open index(1).html directly with file:// when using the Python backend. Start app.py first.

AI/NLP MATCHING
The backend extracts text from the PDF, then combines:
- Required skill coverage
- TF-IDF text vectors
- Cosine similarity between the job and resume
The final ATS-style score uses 65% skill coverage and 35% NLP similarity.
