const STORAGE_KEY = "ResumeMatch Pro AI";
const MAX_RESUME_SIZE = 5 * 1024 * 1024;

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
let selectedApplicationFilter = "All";
let selectedCandidateSearch = "";

const app = document.querySelector("#app");


// LOAD AND SAVE DATA

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return structuredClone(starterData);

  try {
    const parsed = JSON.parse(saved);

    return {
      ...structuredClone(starterData),
      ...parsed,

      jobs: Array.isArray(parsed.jobs)
        ? parsed.jobs
        : structuredClone(starterData.jobs),

      applications: Array.isArray(parsed.applications)
        ? parsed.applications.map((item) => ({
            ...item,
            status: item.status || "Pending"
          }))
        : []
    };
  } catch {
    return structuredClone(starterData);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


// HELPER FUNCTIONS

function escapeHtml(value) {
  return String(value ?? "")
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

function showToast(message) {
  const existing = document.querySelector(".toast");

  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 2600);
}


// FILE SIZE FORMAT

function formatFileSize(bytes) {
  const size = Number(bytes);

  if (!Number.isFinite(size) || size < 0) {
    return "Not available";
  }

  if (size < 1024) {
    return `${size} bytes`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}


// SAFE DOWNLOAD LINK

function renderResumeDownload(application) {
  if (!application.resumeDownloadUrl) {
    return `
      <span class="meta">
        Original PDF download unavailable.
      </span>
    `;
  }

  return `
    <a
      class="btn secondary"
      href="${escapeHtml(application.resumeDownloadUrl)}"
      download
    >
      Download Original PDF
    </a>
  `;
}


// APPLICATION FILTER

function filterApplications(applications) {
  const searchTerm = selectedCandidateSearch.trim().toLowerCase();

  return applications.filter((application) => {
    const matchesStatus =
      selectedApplicationFilter === "All" ||
      (application.status || "Pending") === selectedApplicationFilter;

    const matchesSearch = [
      application.studentName,
      application.studentEmail
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchTerm)
    );

    return matchesStatus && matchesSearch;
  });
}


// --------------------------------------------------
// LOGIN AND CREATE ACCOUNT
// --------------------------------------------------

function renderLogin(showRegister = false) {
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

          <p>
            Students can discover jobs and apply with their skills.
            HR teams can post roles, review applicants and shortlist candidates.
          </p>
        </div>

      </div>

      <div class="login-panel-wrap">

        <form class="panel" id="loginForm">

          <h2>${showRegister ? "Create an Account" : "Sign in"}</h2>

          <p class="subtle">
            Choose your portal and enter your account details to continue.
          </p>

          <div class="role-tabs">

            <button
              type="button"
              class="${selectedRole === "student" ? "active" : ""}"
              data-role="student">
              Student
            </button>

            <button
              type="button"
              class="${selectedRole === "hr" ? "active" : ""}"
              data-role="hr">
              HR
            </button>

          </div>

          ${
            showRegister
              ? `
                <div class="field">
                  <label for="name">Full name</label>
                  <input
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              `
              : ""
          }

          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
            />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              minlength="8"
              required
            />
          </div>

          <button class="btn full" type="submit" id="authSubmit">
            ${
              showRegister
                ? "Create Account"
                : `Login as ${selectedRole === "student" ? "Student" : "HR"}`
            }
          </button>

          <p class="subtle" style="text-align:center; margin-top:18px;">

            ${
              showRegister
                ? `
                  Already have an account?
                  <button
                    type="button"
                    class="btn ghost"
                    id="showLogin">
                    Sign in
                  </button>
                `
                : `
                  Don't have an account?
                  <button
                    type="button"
                    class="btn ghost"
                    id="showRegister">
                    Create an Account
                  </button>
                `
            }

          </p>

        </form>

      </div>
    </section>
  `;


  // ROLE SELECTION

  document.querySelectorAll("[data-role]").forEach((button) => {

    button.addEventListener("click", () => {

      selectedRole = button.dataset.role;

      renderLogin(showRegister);

    });

  });


  // SWITCH TO CREATE ACCOUNT

  const showRegisterButton = document.querySelector("#showRegister");

  if (showRegisterButton) {

    showRegisterButton.addEventListener("click", () => {
      renderLogin(true);
    });

  }


  // SWITCH TO LOGIN

  const showLoginButton = document.querySelector("#showLogin");

  if (showLoginButton) {

    showLoginButton.addEventListener("click", () => {
      renderLogin(false);
    });

  }


  // LOGIN / REGISTER FORM SUBMISSION

  document.querySelector("#loginForm").addEventListener("submit", async (event) => {

    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const submitButton = document.querySelector("#authSubmit");

    const payload = {
      role: selectedRole,
      email: form.get("email").trim(),
      password: form.get("password")
    };

    if (showRegister) {
      payload.name = form.get("name").trim();
    }

    submitButton.disabled = true;

    submitButton.textContent = showRegister
      ? "Creating Account..."
      : "Signing in...";

    try {

      const response = await fetch(
        showRegister ? "/api/register" : "/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Something went wrong. Please try again."
        );
      }

      if (showRegister) {

        showToast("Account created successfully. Please sign in.");

        renderLogin(false);

        return;

      }

      currentUser = {
        role: result.role,
        name: result.name,
        email: result.email
      };

      showToast("Login successful.");

      currentUser.role === "student"
        ? renderStudent()
        : renderHr();

    } catch (error) {

      showToast(error.message || "Unable to connect to the server.");

      submitButton.disabled = false;

      submitButton.textContent = showRegister
        ? "Create Account"
        : `Login as ${selectedRole === "student" ? "Student" : "HR"}`;

    }

  });

}


// --------------------------------------------------
// TOP NAVIGATION
// --------------------------------------------------

function renderTopbar(roleLabel) {
  return `
    <header class="topbar">

      <div class="brand">
        <span class="brand-mark">RM</span>
        <span>ResumeMatch Pro AI</span>
      </div>

      <div class="user-chip">

        <span class="avatar">
          ${escapeHtml(currentUser.name.charAt(0).toUpperCase())}
        </span>

        <span>
          ${escapeHtml(currentUser.name)} · ${roleLabel}
        </span>

        <button class="btn ghost" id="logoutBtn">
          Logout
        </button>

      </div>

    </header>
  `;
}

function attachLogout() {
  document.querySelector("#logoutBtn").addEventListener("click", () => {
    renderLogin(false);
  });
}


// --------------------------------------------------
// STATUS BADGE
// --------------------------------------------------

function renderStatusBadge(status) {
  const safeStatus = ["Pending", "Shortlisted", "Rejected"].includes(status)
    ? status
    : "Pending";

  return `
    <span class="status-badge status-${safeStatus.toLowerCase()}">
      ${safeStatus}
    </span>
  `;
}


// --------------------------------------------------
// STUDENT DASHBOARD
// --------------------------------------------------

function renderStudent() {
  const myApplications = state.applications.filter(
    (application) =>
      application.studentEmail?.toLowerCase() === currentUser.email.toLowerCase()
  );

  const bestScore = myApplications.length
    ? Math.max(...myApplications.map((item) => Number(item.score || 0)))
    : 0;

  app.innerHTML = `
    <section class="shell">

      ${renderTopbar("Student")}

      <div class="page">

        <div class="page-head">

          <div>
            <h1>Student Dashboard</h1>
            <p>Browse available jobs and apply with your resume details.</p>
          </div>

          <button class="btn secondary" id="resetDemo">
            Reset demo data
          </button>

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
            <strong>${bestScore}%</strong>
          </div>

        </div>

        <h2 class="section-title">Available Jobs</h2>

        <div class="grid">
          ${state.jobs.map((job) =>
            renderJobCard(
              job,
              myApplications.some((item) => item.jobId === job.id)
            )
          ).join("")}
        </div>

        <section class="applications-section">

          <h2 class="section-title">
            My Applications & AI Analysis
          </h2>

          <div class="stack">

            ${
              myApplications.length
                ? myApplications.map((application) => {

                    const job = state.jobs.find(
                      (item) => item.id === application.jobId
                    );

                    const matchedSkills = application.matchedSkills || [];
                    const requiredSkills = job?.skills || [];

                    const missingSkills = requiredSkills.filter(
                      (skill) =>
                        !matchedSkills.some(
                          (matched) =>
                            matched.toLowerCase() === skill.toLowerCase()
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

                            <div style="margin-top:10px">
                              Application Status:
                              ${renderStatusBadge(application.status || "Pending")}
                            </div>
                          </div>

                          <div class="match">

                            <span class="pill ${
                              application.score >= 75
                                ? "green"
                                : application.score >= 50
                                  ? "amber"
                                  : ""
                            }">
                              ATS Match
                            </span>

                            <strong>${Number(application.score || 0)}%</strong>

                            <div class="meter">
                              <span style="width:${Math.max(0, Math.min(100, Number(application.score || 0)))}%"></span>
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

                        <div class="candidate-status">

                          <div>
                            <strong>Resume:</strong>
                            ${escapeHtml(application.resumeFileName || "Not available")}
                          </div>

                          <div>
                            <strong>File Size:</strong>
                            ${formatFileSize(application.resumeFileSizeBytes)}
                          </div>

                          ${renderResumeDownload(application)}

                        </div>

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
    button.addEventListener("click", () => {
      renderApplyForm(button.dataset.apply);
    });
  });
}
// JOB CARD

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

      <p class="description">
        ${escapeHtml(job.description)}
      </p>

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
          data-apply="${escapeHtml(job.id)}"
        >
          ${alreadyApplied ? "Applied" : "Apply Job"}
        </button>

      </div>

    </article>
  `;
}


// APPLY FORM

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
              Maximum file size: 5 MB. PDF only.
              Your original PDF will be available for download after applying.
            </small>

            <p class="meta" id="resumeFileInfo">
              No file selected.
            </p>

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

  const fileInput = document.querySelector("#resumeFile");
  const fileInfo = document.querySelector("#resumeFileInfo");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    if (!file) {
      fileInfo.textContent = "No file selected.";
      return;
    }

    fileInfo.textContent = `Selected: ${file.name} · ${formatFileSize(file.size)}`;

    if (file.size > MAX_RESUME_SIZE) {
      fileInfo.textContent += " · File exceeds 5 MB limit.";
      showToast("Resume must be 5 MB or smaller.");
      fileInput.value = "";
      fileInfo.textContent = "Please select a PDF up to 5 MB.";
    }
  });

  document.querySelector("#applyForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const resumeFile = fileInput.files[0];

    if (!resumeFile) {
      showToast("Please upload your resume PDF.");
      return;
    }

    if (!resumeFile.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please upload a PDF resume.");
      return;
    }

    if (resumeFile.type && resumeFile.type !== "application/pdf") {
      showToast("Please select a valid PDF file.");
      return;
    }

    if (resumeFile.size > MAX_RESUME_SIZE) {
      showToast("Resume must be 5 MB or smaller.");
      return;
    }

    if (resumeFile.size === 0) {
      showToast("The selected PDF is empty.");
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

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Invalid response from the server.");
      }

      if (!response.ok) {
        throw new Error(result.error || "Resume analysis failed.");
      }

      state.applications.push({

        id: `app-${slug()}`,

        jobId: job.id,

        studentName: currentUser.name,
        studentEmail: currentUser.email,

        status: "Pending",

        skills: result.matched_skills || [],
        resume: result.resume_text || "",

        resumeFileName: result.resume_file_name || resumeFile.name,

        resumeFileSizeBytes:
          result.resume_file_size_bytes ?? resumeFile.size,

        resumeDownloadUrl:
          result.resume_download_url || null,

        score: result.score ?? 0,
        matchedSkills: result.matched_skills || [],
        skillScore: result.skill_score ?? 0,

        nlpSimilarity: result.nlp_similarity ?? 0,

        semanticSimilarity:
          result.semantic_similarity ?? result.nlp_similarity ?? 0,

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


// CANDIDATE RANKINGS

function renderCandidateRankings(applications) {
  const groupedJobs = new Map();

  applications.forEach((application) => {
    if (!groupedJobs.has(application.jobId)) {
      groupedJobs.set(application.jobId, {
        job: application.job,
        candidates: []
      });
    }

    groupedJobs.get(application.jobId).candidates.push(application);
  });

  if (groupedJobs.size === 0) {
    return `
      <section class="ranking-section">
        <h2 class="section-title">Top Candidate Rankings</h2>
        <div class="empty">No candidates available for ranking yet.</div>
      </section>
    `;
  }

  return `
    <section class="ranking-section">

      <h2 class="section-title">🏆 Top Candidate Rankings</h2>

      <p class="meta">
        Candidates are ranked separately for each job using ATS score,
        semantic similarity and skill coverage.
      </p>

      <div class="ranking-grid">

        ${Array.from(groupedJobs.values()).map((group) => {

          const rankedCandidates = [...group.candidates].sort(
            (a, b) =>
              Number(b.score || 0) - Number(a.score || 0) ||
              Number(b.nlpSimilarity || 0) - Number(a.nlpSimilarity || 0) ||
              Number(b.skillScore || 0) - Number(a.skillScore || 0)
          );

          return `
            <article class="ranking-card">

              <h3>${escapeHtml(group.job?.title || "Job")}</h3>

              <p class="meta">
                ${rankedCandidates.length} candidate(s)
              </p>

              <div class="ranking-list">

                ${rankedCandidates.map((candidate, index) => `
                  <div class="ranking-item">

                    <div class="ranking-candidate">

                      <strong>
                        ${index === 0 ? "🏆 Rank 1" : `Rank ${index + 1}`}
                      </strong>

                      <div>${escapeHtml(candidate.studentName || "Student")}</div>

                      <p class="meta">
                        ${escapeHtml(candidate.studentEmail || "")}
                      </p>

                      ${renderStatusBadge(candidate.status || "Pending")}

                    </div>

                    <div class="ranking-metrics">

                      <strong class="ranking-score">
                        ${Number(candidate.score || 0)}%
                      </strong>

                      <span class="meta">ATS Match</span>

                      <span class="meta">
                        NLP: ${Number(candidate.nlpSimilarity || 0)}%
                      </span>

                    </div>

                  </div>
                `).join("")}

              </div>

            </article>
          `;

        }).join("")}

      </div>
    </section>
  `;
}


// CANDIDATE PROFILE VIEW

function renderCandidateProfile(applicationId) {
  const application = state.applications.find(
    (item) => item.id === applicationId
  );

  if (!application) {
    showToast("Candidate profile not found.");
    return;
  }

  const job = state.jobs.find(
    (item) => item.id === application.jobId
  );

  const matchedSkills =
    application.matchedSkills || application.skills || [];

  const requiredSkills = job?.skills || [];

  const missingSkills = requiredSkills.filter(
    (skill) =>
      !matchedSkills.some(
        (matched) =>
          String(matched).toLowerCase() === skill.toLowerCase()
      )
  );

  const oldModal = document.querySelector("#candidateProfileModal");

  if (oldModal) oldModal.remove();

  const modal = document.createElement("div");

  modal.id = "candidateProfileModal";

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--card, #fff);
      color: var(--text, #222);
      width: 100%;
      max-width: 750px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 25px;
      border-radius: 16px;
      box-shadow: 0 15px 50px rgba(0,0,0,0.25);
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:20px;
      ">

        <div>
          <h2 style="margin:0;">Candidate Profile</h2>
          <p class="meta">Complete candidate information</p>
        </div>

        <button class="btn secondary" id="closeProfile">
          Close ✕
        </button>

      </div>

      <hr />

      <h3>Personal Information</h3>

      <p>
        <strong>Name:</strong>
        ${escapeHtml(application.studentName || "Not available")}
      </p>

      <p>
        <strong>Email:</strong>
        ${escapeHtml(application.studentEmail || "Not available")}
      </p>

      <h3>Job Information</h3>

      <p>
        <strong>Job Title:</strong>
        ${escapeHtml(job?.title || "Not available")}
      </p>

      <p>
        <strong>Company:</strong>
        ${escapeHtml(job?.company || "Not available")}
      </p>

      <p>
        <strong>Location:</strong>
        ${escapeHtml(job?.location || "Not available")}
      </p>

      <p>
        <strong>Applied Date:</strong>
        ${escapeHtml(application.appliedAt || "-")}
      </p>

      <h3>AI Resume Analysis</h3>

      <div class="stats">

        <div class="stat">
          <span>ATS Score</span>
          <strong>${Number(application.score || 0)}%</strong>
        </div>

        <div class="stat">
          <span>NLP Similarity</span>
          <strong>${Number(application.nlpSimilarity || 0)}%</strong>
        </div>

        <div class="stat">
          <span>Skill Coverage</span>
          <strong>${Number(application.skillScore || 0)}%</strong>
        </div>

      </div>

      <p>
        <strong>Recommendation:</strong>
        ${escapeHtml(application.recommendation || "Needs Review")}
      </p>

      <p>
        <strong>Matching Method:</strong>
        ${escapeHtml(application.matchingMethod || "AI/NLP")}
      </p>

      <h3>Matched Skills</h3>

      <div class="skills">
        ${
          matchedSkills.length
            ? matchedSkills.map((skill) =>
                `<span class="skill">${escapeHtml(skill)}</span>`
              ).join("")
            : "No matched skills"
        }
      </div>

      <h3>Missing Skills</h3>

      <div class="skills">
        ${
          missingSkills.length
            ? missingSkills.map((skill) =>
                `<span class="skill">${escapeHtml(skill)}</span>`
              ).join("")
            : "No missing skills"
        }
      </div>

      <h3>Application Status</h3>

      ${renderStatusBadge(application.status || "Pending")}

      <h3>Resume Information</h3>

      <p>
        <strong>File Name:</strong>
        ${escapeHtml(application.resumeFileName || "Not available")}
      </p>

      <p>
        <strong>File Size:</strong>
        ${formatFileSize(application.resumeFileSizeBytes)}
      </p>

      <div style="margin:15px 0">
        ${renderResumeDownload(application)}
      </div>

      <details>
        <summary>View Full Resume Text</summary>

        <p style="
          white-space:pre-wrap;
          overflow-wrap:anywhere;
          line-height:1.6;
          padding:12px;
        ">
          ${escapeHtml(application.resume || "Resume text unavailable.")}
        </p>

      </details>

    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector("#closeProfile").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}
// HR APPLICATION CARD

function renderApplicationCard(application) {
  const score = Number(application.score ?? 0);

  const scoreClass =
    score >= 75 ? "green" : score >= 50 ? "amber" : "";

  const status = application.status || "Pending";

  const matchedSkills =
    application.matchedSkills || application.skills || [];

  const requiredSkills =
    application.job?.skills || [];

  const missingSkills = requiredSkills.filter(
    (skill) =>
      !matchedSkills.some(
        (matched) =>
          String(matched).toLowerCase() === String(skill).toLowerCase()
      )
  );

  return `
    <article class="application-card">

      <header>

        <div>

          <h3>${escapeHtml(application.studentName || "Student")}</h3>

          <div class="meta">
            ${escapeHtml(application.studentEmail || "")}
            · Applied for ${escapeHtml(application.job?.title || "Job")}
          </div>

          <div style="margin-top:10px">
            Application Status:
            ${renderStatusBadge(status)}
          </div>

        </div>

        <div class="match">

          <span class="pill ${scoreClass}">ATS Match</span>

          <strong>${score}%</strong>

          <div class="meter">
            <span style="width:${Math.max(0, Math.min(100, score))}%"></span>
          </div>

        </div>

      </header>

      <section class="analysis-section">

        <h4>Matched Skills</h4>

        <div class="skills">
          ${
            matchedSkills.length
              ? matchedSkills.map((skill) =>
                  `<span class="skill">${escapeHtml(skill)}</span>`
                ).join("")
              : `<span class="meta">No direct skill match</span>`
          }
        </div>

        <h4>Missing Skills</h4>

        <div class="skills">
          ${
            missingSkills.length
              ? missingSkills.map((skill) =>
                  `<span class="skill">${escapeHtml(skill)}</span>`
                ).join("")
              : `<span class="meta">No missing skills</span>`
          }
        </div>

      </section>

      <section class="analysis-metrics">

        <div class="stat">
          <span>AI/NLP Similarity</span>
          <strong>${application.nlpSimilarity ?? "-"}%</strong>
        </div>

        <div class="stat">
          <span>Skill Coverage</span>
          <strong>${application.skillScore ?? "-"}%</strong>
        </div>

        <div class="stat">
          <span>Recommendation</span>
          <strong>${escapeHtml(application.recommendation || "Needs Review")}</strong>
        </div>

      </section>

      <ul class="muted-list">

        <li>
          Applied on: ${escapeHtml(application.appliedAt || "-")}
        </li>

        <li>
          Resume file: ${escapeHtml(application.resumeFileName || "-")}
        </li>

        <li>
          Resume size: ${formatFileSize(application.resumeFileSizeBytes)}
        </li>

      </ul>

      <div class="candidate-status">

        <div>
          <strong>Manage Candidate:</strong>
          ${renderStatusBadge(status)}
        </div>

        <div class="candidate-actions">

          <button
            class="btn secondary"
            data-view-profile="${escapeHtml(application.id)}"
          >
            View Profile
          </button>

          <button
            class="btn shortlist-btn"
            data-status-action="Shortlisted"
            data-application-id="${escapeHtml(application.id)}"
            ${status === "Shortlisted" ? "disabled" : ""}
          >
            ✓ Shortlist
          </button>

          <button
            class="btn reject-btn"
            data-status-action="Rejected"
            data-application-id="${escapeHtml(application.id)}"
            ${status === "Rejected" ? "disabled" : ""}
          >
            ✕ Reject
          </button>

          <button
            class="btn secondary"
            data-status-action="Pending"
            data-application-id="${escapeHtml(application.id)}"
            ${status === "Pending" ? "disabled" : ""}
          >
            Reset to Pending
          </button>

        </div>

      </div>

    </article>
  `;
}


// UPDATE APPLICATION STATUS

function updateApplicationStatus(applicationId, newStatus) {
  const allowedStatuses = ["Pending", "Shortlisted", "Rejected"];

  if (!allowedStatuses.includes(newStatus)) return;

  const application = state.applications.find(
    (item) => item.id === applicationId
  );

  if (!application) {
    showToast("Application not found.");
    return;
  }

  application.status = newStatus;

  saveState();

  showToast(`Candidate status updated: ${newStatus}`);

  renderHr();
}


// HR DASHBOARD

function renderHr() {
  const applications = state.applications
    .map((application) => ({
      ...application,
      status: application.status || "Pending",
      job: state.jobs.find((job) => job.id === application.jobId)
    }))
    .filter((application) => application.job);

  const pendingCount = applications.filter(
    (item) => item.status === "Pending"
  ).length;

  const shortlistedCount = applications.filter(
    (item) => item.status === "Shortlisted"
  ).length;

  const rejectedCount = applications.filter(
    (item) => item.status === "Rejected"
  ).length;

  const averageScore = applications.length
    ? Math.round(
        applications.reduce(
          (sum, item) => sum + Number(item.score || 0),
          0
        ) / applications.length
      )
    : 0;

  const filteredApplications = filterApplications(applications);

  app.innerHTML = `
    <section class="shell">

      ${renderTopbar("HR")}

      <div class="page">

        <div class="page-head">

          <div>
            <h1>HR Dashboard</h1>

            <p>
              Post jobs, review applicants, compare ATS scores
              and manage candidate applications.
            </p>
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
            <strong>${averageScore}%</strong>
          </div>

          <div class="stat">
            <span>Pending</span>
            <strong>${pendingCount}</strong>
          </div>

          <div class="stat">
            <span>Shortlisted</span>
            <strong>${shortlistedCount}</strong>
          </div>

          <div class="stat">
            <span>Rejected</span>
            <strong>${rejectedCount}</strong>
          </div>

        </div>

        ${renderCandidateRankings(applications)}

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
              <input
                id="salary"
                name="salary"
                placeholder="Rs. 5 LPA"
                required
              />
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
              <textarea
                id="description"
                name="description"
                required
              ></textarea>
            </div>

            <button class="btn full" type="submit">
              Post Job
            </button>

          </form>

          <section>

            <h2 class="section-title">
              Applied Jobs & ATS Score
            </h2>

            <div class="field">

              <label for="candidateSearch">
                Search Candidate
              </label>

              <input
                type="search"
                id="candidateSearch"
                placeholder="Search by candidate name or email..."
                value="${escapeHtml(selectedCandidateSearch)}"
              />

            </div>

            <div class="field">

              <label for="applicationFilter">
                Filter Candidates by Status
              </label>

              <select id="applicationFilter">

                <option
                  value="All"
                  ${selectedApplicationFilter === "All" ? "selected" : ""}
                >
                  All Candidates
                </option>

                <option
                  value="Pending"
                  ${selectedApplicationFilter === "Pending" ? "selected" : ""}
                >
                  Pending
                </option>

                <option
                  value="Shortlisted"
                  ${selectedApplicationFilter === "Shortlisted" ? "selected" : ""}
                >
                  Shortlisted
                </option>

                <option
                  value="Rejected"
                  ${selectedApplicationFilter === "Rejected" ? "selected" : ""}
                >
                  Rejected
                </option>

              </select>

            </div>

            <div class="stack" id="candidateList">

              ${
                filteredApplications.length
                  ? filteredApplications.map(renderApplicationCard).join("")
                  : `<div class="empty">No candidates found.</div>`
              }

            </div>

          </section>

        </div>

      </div>

    </section>
  `;

  attachLogout();

  document.querySelector("#resetDemo").addEventListener("click", resetDemo);

  // STATUS FILTER

  document
    .querySelector("#applicationFilter")
    .addEventListener("change", (event) => {

      selectedApplicationFilter = event.target.value;

      renderHr();

    });

  // CANDIDATE SEARCH

  document
    .querySelector("#candidateSearch")
    .addEventListener("input", (event) => {

      selectedCandidateSearch = event.target.value;

      const filtered = filterApplications(applications);

      document.querySelector("#candidateList").innerHTML =
        filtered.length
          ? filtered.map(renderApplicationCard).join("")
          : `<div class="empty">No candidates found.</div>`;

    });

  // VIEW CANDIDATE PROFILE

  document
    .querySelector("#candidateList")
    .addEventListener("click", (event) => {

      const button = event.target.closest("[data-view-profile]");

      if (!button) return;

      renderCandidateProfile(button.dataset.viewProfile);

    });

  // SHORTLIST / REJECT / RESET STATUS

  document.querySelectorAll("[data-status-action]").forEach((button) => {

    button.addEventListener("click", () => {

      const applicationId = button.dataset.applicationId;
      const newStatus = button.dataset.statusAction;

      updateApplicationStatus(applicationId, newStatus);

    });

  });

  // POST JOB

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


// RESET DEMO DATA

function resetDemo() {
  const confirmed = confirm(
    "Are you sure? This will clear all demo applications and posted jobs from this browser."
  );

  if (!confirmed) return;

  state = structuredClone(starterData);

  saveState();

  selectedApplicationFilter = "All";
  selectedCandidateSearch = "";

  showToast("Demo data reset.");

  currentUser?.role === "hr"
    ? renderHr()
    : renderStudent();
}


// START APPLICATION

renderLogin();