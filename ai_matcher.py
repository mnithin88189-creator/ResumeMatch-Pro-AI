import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def _skill_matches(resume_text: str, job_skills: list[str]) -> list[str]:
    resume = _normalize(resume_text)
    matched = []
    for skill in job_skills:
        normalized = _normalize(skill)
        if normalized and re.search(r"(?<![a-z0-9+#.])" + re.escape(normalized) + r"(?![a-z0-9+#.])", resume):
            matched.append(skill)
    return matched


def calculate_ai_match(resume_text: str, job_title: str, job_description: str, job_skills: list[str]) -> dict:
    """NLP/ML-assisted ATS matching using TF-IDF and cosine similarity plus skill matching."""
    resume = _normalize(resume_text)
    job_text = _normalize(" ".join([job_title, job_description, " ".join(job_skills)]))

    matched_skills = _skill_matches(resume, job_skills)
    skill_score = (len(matched_skills) / len(job_skills) * 100) if job_skills else 0

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    try:
        matrix = vectorizer.fit_transform([job_text, resume])
        similarity = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0]) * 100
    except ValueError:
        similarity = 0.0

    # 65% required-skill coverage + 35% NLP similarity.
    score = round((skill_score * 0.65) + (similarity * 0.35))
    score = max(0, min(100, score))

    if score >= 75:
        recommendation = "Strong Match"
    elif score >= 50:
        recommendation = "Moderate Match"
    else:
        recommendation = "Needs Review"

    return {
        "score": score,
        "matched_skills": matched_skills,
        "skill_score": round(skill_score),
        "nlp_similarity": round(similarity),
        "recommendation": recommendation,
        "matching_method": "TF-IDF + Cosine Similarity + Skill Matching",
    }
