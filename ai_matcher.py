
import re

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def normalize(text):
    return re.sub(r"\s+", " ", (text or "").lower()).strip()


def skill_matches(resume_text, job_skills):
    resume = normalize(resume_text)
    matched = []

    for skill in job_skills:
        normalized = normalize(skill)

        if normalized and re.search(
            r"(?<![a-z0-9+#.])"
            + re.escape(normalized)
            + r"(?![a-z0-9+#.])",
            resume
        ):
            matched.append(skill)

    return matched


def calculate_ai_match(
    resume_text,
    job_title,
    job_description,
    job_skills
):
    """
    Resume matching using TF-IDF, cosine similarity
    and required skill coverage.
    """

    resume = normalize(resume_text)

    job_text = normalize(
        " ".join([
            job_title or "",
            job_description or "",
            " ".join(job_skills or [])
        ])
    )

    # Required skill matching
    matched_skills = skill_matches(
        resume,
        job_skills or []
    )

    skill_score = (
        len(matched_skills) / len(job_skills) * 100
        if job_skills else 0
    )

    # TF-IDF similarity
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2)
        )

        vectors = vectorizer.fit_transform([
            job_text,
            resume
        ])

        similarity = float(
            cosine_similarity(
                vectors[0:1],
                vectors[1:2]
            )[0][0]
        ) * 100

    except ValueError:
        similarity = 0.0

    similarity = max(0, min(100, similarity))

    # Combined ATS score
    score = round(
        (skill_score * 0.65) +
        (similarity * 0.35)
    )

    score = max(0, min(100, score))

    # Recommendation
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
        "semantic_similarity": round(similarity),
        "recommendation": recommendation,
        "matching_method": (
            "TF-IDF + Cosine Similarity + Skill Matching"
        )
    }
