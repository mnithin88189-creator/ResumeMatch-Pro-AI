const STORAGE_KEY = "ResumeMatch Pro AI";

const starterData = {
  jobs: [
    {
      id: "job-1",
      title: "Frontend Developer Intern",
      company: "NovaSoft Labs",
      location: "Bengaluru",
      type: "Internship",
      salary: "Rs. 25,000 / month",
      skills: ["HTML", "CSS", "JavaScript", "React"],
      description: "Build responsive dashboards, improve UI quality, and work closely with product engineers."
    },
    {
      id: "job-2",
      title: "Data Analyst Trainee",
      company: "Insight Grid",
      location: "Hyderabad",
      type: "Full-time",
      salary: "Rs. 4.8 LPA",
      skills: ["Python", "SQL", "Excel", "Power BI"],
      description: "Clean datasets, create reports, and turn business questions into measurable insights."
    },
    {
      id: "job-3",
      title: "Java Backend Associate",
      company: "FinCore Systems",
      location: "Chennai",
      type: "Full-time",
      salary: "Rs. 5.6 LPA",
      skills: ["Java", "Spring Boot", "MySQL", "REST API"],
      description: "Develop APIs, maintain backend services, and support secure transaction workflows."
    }
  ],
  applications: []
};

let state = loadState();
let currentUser = null;
let selectedRole = "student";

const app = document.querySelector("#app");

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(starterData);

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(starterData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slug() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function calculateMatch(jobSkills, candidateSkills, resumeText) {
  const candidateSet = new Set(candidateSkills.map((skill) => skill.toLowerCase()));
  const resume = resumeText.toLowerCase();

  const matchedSkills = jobSkills.filter((skill) => {
    const normalized = skill.toLowerCase();
    return candidateSet.has(normalized) || resume.includes(normalized);
  });

  const skillScore = jobSkills.length
    ? (matchedSkills.length / jobSkills.length) * 78
    : 0;

  const resumeBonus = Math.min(22, Math.round(resumeText.trim().length / 38));

  return {
    score: Math.min(100, Math.round(skillScore + resumeBonus)),
    matchedSkills
  };
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2600);
}

function renderLogin() {
  currentUser = null;

  app.innerHTML = `
    <section class="login-page">
      <div class="login-visual">
        <div class="brand">
          <span class="brand-mark">RM</span>
          <span>ResumeMatch Pro AI</span>
        </div>
        <div class="login-copy">
          <h1>Placement hiring portal.</h1>
          <p>Students can discover jobs and apply with their skills. HR teams can post roles, view applicants.</p>
        </div>
      </div>

      <div class="login-panel-wrap">
        <form class="panel" id="loginForm">
          <h2>Sign in</h2>
          <p class="subtle">Choose your portal and enter basic details to continue.</p>

          <div class="role-tabs" role="tablist" aria-label="Login role">
            <button type="button" class="${selectedRole === "student" ? "active" : ""}" data-role="student">Student</button>
            <button type="button" class="${selectedRole === "hr" ? "active" : ""}" data-role="hr">HR</button>
          </div>

          <div class="field">
            <label for="name">Full name</label>
            <input id="name" name="name" placeholder="Enter your name" required />
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" name="email" type="email" placeholder="name@example.com" required />
          </div>

          <button class="btn full" type="submit">
            Login as ${selectedRole === "student" ? "Student" : "HR"}
          </button>
        </form>
      </div>
    </section>
  `;

  document.querySelectorAll("[data-role]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedRole = button.dataset.role;
      renderLogin();
    });
  });

  document.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    currentUser = {
      role: selectedRole,
      name: form.get("name").trim(),
      email: form.get("email").trim()
    };

    selectedRole === "student" ? renderStudent() : renderHr();
  });
}

function renderTopbar(roleLabel) {
  return `
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">CH</span>
        <span>ResumeMatch Pro AI</span>
      </div>

      <div class="user-chip">
        <span class="avatar">${escapeHtml(currentUser.name.charAt(0).toUpperCase())}</span>
        <span>${escapeHtml(currentUser.name)} · ${roleLabel}</span>
        <button class="btn ghost" id="logoutBtn">Logout</button>
      </div>
    </header>
  `;
}

function attachLogout() {
  document.querySelector("#logoutBtn").addEventListener("click", renderLogin);
}

function renderStudent() {
  const myApplications = state.applications.filter(
    (application) => application.studentEmail === currentUser.email
  );

  app.innerHTML = `
    <section class="shell">
      ${renderTopbar("Student")}

      <div class="page">
        <div class="page-head">
          <div>
            <h1>Student Dashboard</h1>
            <p>Browse available jobs and apply with your resume details.</p>
          </div>

          <button class="btn secondary" id="resetDemo">Reset demo data</button>
        </div>

        <div class="stats">
          <div class="stat">
            <span>Open Jobs</span>
            <strong>${state.jobs.length}</strong>
          </div>

          <div class="stat">
            <span>My Applications</span>
            <strong>${myApplications.length}</strong>
          </div>

          <div class="stat">
            <span>Best ATS Score</span>
            <strong>${myApplications.length ? Math.max(...myApplications.map((item) => item.score)) : 0}%</strong>
          </div>
        </div>

        <div class="grid">
          ${state.jobs.map((job) =>
            renderJobCard(job, myApplications.some((item) => item.jobId === job.id))
          ).join("")}
        </div>

        <section class="applications-section">
          <h2 class="section-title">My Applications & AI Analysis</h2>
          <div class="stack">
            ${
              myApplications.length
                ? myApplications.map((application) => {
                    const job = state.jobs.find((item) => item.id === application.jobId);
                    const matchedSkills = application.matchedSkills || [];
                    const requiredSkills = job?.skills || [];

                    const missingSkills = requiredSkills.filter(
                      (skill) => !matchedSkills.some(
                        (matched) => matched.toLowerCase() === skill.toLowerCase()
                      )
                    );

                    return `
                      <article class="application-card">
                        <header>
                          <div>
                            <h3>${escapeHtml(job?.title || "Job Application")}</h3>
                            <div class="meta">
                              ${escapeHtml(job?.company || "")}
                              · Applied on ${escapeHtml(application.appliedAt || "-")}
                            </div>
                          </div>

                          <div class="match">
                            <span class="pill ${application.score >= 75 ? "green" : application.score >= 50 ? "amber" : ""}">
                              ATS Match
                            </span>
                            <strong>${application.score}%</strong>
                            <div class="meter">
                              <span style="width:${application.score}%"></span>
                            </div>
                          </div>
                        </header>

                        <p><strong>Matched Skills</strong></p>
                        <div class="skills">
                          ${
                            matchedSkills.length
                              ? matchedSkills.map((skill) =>
                                  `<span class="skill">${escapeHtml(skill)}</span>`
                                ).join("")
                              : `<span class="meta">No direct skill match</span>`
                          }
                        </div>

                        <p><strong>Missing Skills</strong></p>
                        <div class="skills">
                          ${
                            missingSkills.length
                              ? missingSkills.map((skill) =>
                                  `<span class="skill">${escapeHtml(skill)}</span>`
                                ).join("")
                              : `<span class="meta">No missing skills</span>`
                          }
                        </div>

                        <ul class="muted-list">
                          <li>AI/NLP similarity: ${application.nlpSimilarity ?? "-"}%</li>
                          <li>Skill coverage: ${application.skillScore ?? "-"}%</li>
                          <li>Recommendation: ${escapeHtml(application.recommendation || "Needs Review")}</li>
                        </ul>
                      </article>
                    `;
                  }).join("")
                : `<div class="empty">No applications yet. Apply for a job to see your AI analysis.</div>`
            }
          </div>
        </section>
      </div>
    </section>
  `;

  attachLogout();

  document.querySelector("#resetDemo").addEventListener("click", resetDemo);

  document.querySelectorAll("[data-apply]").forEach((button) => {
    button.addEventListener("click", () => renderApplyForm(button.dataset.apply));
  });
}
function renderJobCard(job, alreadyApplied) {
  return `
    <article class="job-card">
      <header>
        <div>
          <h3>${escapeHtml(job.title)}</h3>
          <div class="meta">
            ${escapeHtml(job.company)} · ${escapeHtml(job.location)}
          </div>
        </div>

        <span class="pill">${escapeHtml(job.type)}</span>
      </header>

      <p class="description">${escapeHtml(job.description)}</p>

      <div class="skills">
        ${job.skills.map((skill) =>
          `<span class="skill">${escapeHtml(skill)}</span>`
        ).join("")}
      </div>

      <div class="card-actions">
        <strong>${escapeHtml(job.salary)}</strong>

        <button
          class="btn ${alreadyApplied ? "secondary" : ""}"
          ${alreadyApplied ? "disabled" : ""}
          data-apply="${job.id}"
        >
          ${alreadyApplied ? "Applied" : "Apply Job"}
        </button>
      </div>
    </article>
  `;
}

function renderApplyForm(jobId) {
  const job = state.jobs.find((item) => item.id === jobId);

  if (!job) {
    showToast("Job not found.");
    renderStudent();
    return;
  }

  app.innerHTML = `
    <section class="shell">
      ${renderTopbar("Student")}

      <div class="page">
        <div class="page-head">
          <div>
            <h1>Apply for ${escapeHtml(job.title)}</h1>
            <p>
              ${escapeHtml(job.company)}
              · Required skills: ${job.skills.map(escapeHtml).join(", ")}
            </p>
          </div>

          <button class="btn secondary" id="backToJobs">
            Back to jobs
          </button>
        </div>

        <form class="form-card" id="applyForm">
          <div class="field">
            <label for="resumeFile">Upload Resume (PDF)</label>

            <input
              id="resumeFile"
              name="resumeFile"
              type="file"
              accept=".pdf,application/pdf"
              required
            />

            <small class="meta">
              Upload your resume PDF. The system will extract the resume
              text and calculate the ATS match.
            </small>
          </div>

          <button class="btn" type="submit">
            Submit Application
          </button>
        </form>
      </div>
    </section>
  `;

  attachLogout();

  document.querySelector("#backToJobs").addEventListener("click", renderStudent);

  document.querySelector("#applyForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const resumeFile = form.get("resumeFile");

    if (!resumeFile || !resumeFile.name) {
      showToast("Please upload your resume PDF.");
      return;
    }

    if (
      resumeFile.type !== "application/pdf" &&
      !resumeFile.name.toLowerCase().endsWith(".pdf")
    ) {
      showToast("Please upload a PDF resume.");
      return;
    }

    const submitButton = event.currentTarget.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "AI Analyzing Resume...";

    try {
      const payload = new FormData();

      payload.append("resume", resumeFile);
      payload.append("job_title", job.title);
      payload.append("job_description", job.description);
      payload.append("job_skills", job.skills.join(","));

      const response = await fetch("/api/match", {
        method: "POST",
        body: payload
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Resume analysis failed.");
      }

      state.applications.push({
        id: `app-${slug()}`,
        jobId: job.id,

        studentName: currentUser.name,
        studentEmail: currentUser.email,

        skills: result.matched_skills || [],
        resume: result.resume_text || "",
        resumeFileName: result.resume_file_name || resumeFile.name,

        score: result.score ?? 0,
        matchedSkills: result.matched_skills || [],
        skillScore: result.skill_score ?? 0,
        nlpSimilarity: result.nlp_similarity ?? 0,

        recommendation: result.recommendation || "Needs Review",
        matchingMethod: result.matching_method || "AI/NLP",

        appliedAt: new Date().toLocaleDateString()
      });

      saveState();

      showToast(`AI analysis complete: ${result.score}% ATS match.`);

      renderStudent();

    } catch (error) {
      console.error(error);

      showToast(error.message || "Could not analyze the resume.");

      submitButton.disabled = false;
      submitButton.textContent = "Submit Application";
    }
  });
}
function renderHr() {
  const applications = state.applications
    .map((application) => ({
      ...application,
      job: state.jobs.find((job) => job.id === application.jobId)
    }))
    .filter((application) => application.job);

  app.innerHTML = `
    <section class="shell">
      ${renderTopbar("HR")}

      <div class="page">
        <div class="page-head">
          <div>
            <h1>HR Dashboard</h1>
            <p>Post jobs, review applicants, and compare ATS matching scores.</p>
          </div>

          <button class="btn secondary" id="resetDemo">
            Reset demo data
          </button>
        </div>

        <div class="stats">
          <div class="stat">
            <span>Posted Jobs</span>
            <strong>${state.jobs.length}</strong>
          </div>

          <div class="stat">
            <span>Applications</span>
            <strong>${applications.length}</strong>
          </div>

          <div class="stat">
            <span>Avg ATS Score</span>
            <strong>
              ${
                applications.length
                  ? Math.round(
                      applications.reduce(
                        (sum, item) => sum + (item.score || 0), 0
                      ) / applications.length
                    )
                  : 0
              }%
            </strong>
          </div>
        </div>

        <div class="hr-layout">
          <form class="form-card" id="jobForm">
            <h2>Post a Job</h2>

            <div class="field">
              <label for="title">Job title</label>
              <input id="title" name="title" required />
            </div>

            <div class="field">
              <label for="company">Company</label>
              <input id="company" name="company" required />
            </div>

            <div class="field">
              <label for="location">Location</label>
              <input id="location" name="location" required />
            </div>

            <div class="field">
              <label for="type">Job type</label>
              <select id="type" name="type">
                <option>Full-time</option>
                <option>Internship</option>
                <option>Contract</option>
              </select>
            </div>

            <div class="field">
              <label for="salary">Salary</label>
              <input id="salary" name="salary" placeholder="Rs. 5 LPA" required />
            </div>

            <div class="field">
              <label for="skills">Required skills</label>
              <input
                id="skills"
                name="skills"
                placeholder="Java, SQL, Spring Boot"
                required
              />
            </div>

            <div class="field">
              <label for="description">Description</label>
              <textarea id="description" name="description" required></textarea>
            </div>

            <button class="btn full" type="submit">Post Job</button>
          </form>

          <section>
            <h2 class="section-title">Applied Jobs & ATS Score</h2>

            <div class="stack">
              ${
                applications.length
                  ? applications.map(renderApplicationCard).join("")
                  : `<div class="empty">No student applications yet.</div>`
              }
            </div>
          </section>
        </div>
      </div>
    </section>
  `;

  attachLogout();

  document.querySelector("#resetDemo").addEventListener("click", resetDemo);

  document.querySelector("#jobForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    state.jobs.unshift({
      id: `job-${slug()}`,
      title: form.get("title").trim(),
      company: form.get("company").trim(),
      location: form.get("location").trim(),
      type: form.get("type"),
      salary: form.get("salary").trim(),
      skills: normalizeSkills(form.get("skills")),
      description: form.get("description").trim()
    });

    saveState();

    showToast("Job posted successfully.");

    renderHr();
  });
}

function renderApplicationCard(application) {
  const score = application.score ?? 0;

  const scoreClass =
    score >= 75 ? "green" : score >= 50 ? "amber" : "";

  const matchedSkills = application.matchedSkills || [];

  return `
    <article class="application-card">
      <header>
        <div>
          <h3>${escapeHtml(application.studentName || "Student")}</h3>

          <div class="meta">
            ${escapeHtml(application.studentEmail || "")}
            · Applied for ${escapeHtml(application.job.title)}
          </div>
        </div>

        <div class="match">
          <span class="pill ${scoreClass}">ATS Match</span>

          <strong>${score}%</strong>

          <div class="meter">
            <span style="width:${score}%"></span>
          </div>
        </div>
      </header>

      <div class="skills">
        ${
          (application.skills || []).map((skill) =>
            `<span class="skill">${escapeHtml(skill)}</span>`
          ).join("")
        }
      </div>

      <p class="description">
        ${escapeHtml(application.resume || "")}
      </p>

      <ul class="muted-list">
        <li>
          Matched skills:
          ${
            matchedSkills.length
              ? matchedSkills.map(escapeHtml).join(", ")
              : "No direct skill match"
          }
        </li>

        <li>
          AI/NLP similarity: ${application.nlpSimilarity ?? "-"}%
          · Skill coverage: ${application.skillScore ?? "-"}%
        </li>

        <li>
          Recommendation:
          ${escapeHtml(application.recommendation || "Needs Review")}
        </li>

        <li>
          Applied on: ${escapeHtml(application.appliedAt || "-")}
        </li>
      </ul>
    </article>
  `;
}

function resetDemo() {
  state = structuredClone(starterData);

  saveState();

  showToast("Demo data reset.");

  currentUser?.role === "hr" ? renderHr() : renderStudent();
}

renderLogin();