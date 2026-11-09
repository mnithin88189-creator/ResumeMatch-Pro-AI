
import re
from sentence_transformers import SentenceTransformer, util


# Load the semantic NLP model only once
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
_model = None


def get_model():
    global _model

    if _model is None:
        print("Loading Semantic NLP model...")
        _model = SentenceTransformer(MODEL_NAME)
        print("Semantic NLP model loaded successfully!")

    return _model


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
    Semantic NLP resume matching using Sentence Transformers.
    Combines semantic similarity with required skill coverage.
    """

    resume = normalize(resume_text)

    job_text = normalize(
        " ".join([
            job_title,
            job_description,
            " ".join(job_skills)
        ])
    )

    # Required skill matching
    matched_skills = skill_matches(resume, job_skills)

    skill_score = (
        len(matched_skills) / len(job_skills) * 100
        if job_skills else 0
    )

    # Semantic similarity
    model = get_model()

    embeddings = model.encode(
        [job_text, resume],
        convert_to_tensor=True,
        normalize_embeddings=True
    )

    similarity = float(
        util.cos_sim(embeddings[0], embeddings[1]).item()
    ) * 100

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
            "Sentence Transformers + Semantic Similarity "
            "+ Skill Matching"
        )
    }
