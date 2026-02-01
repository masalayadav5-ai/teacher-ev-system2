// ================= STUDENT PROFILE JAVASCRIPT =================
console.log("studentprofile.js loaded");

// Use existing STUDENT_API_BASE_URL or fallback
window.PROFILE_API_BASE_URL = window.STUDENT_API_BASE_URL || "http://localhost:8080/api";

// ================= INIT STUDENT PROFILE =================
function initStudentProfile() {
    const mode = sessionStorage.getItem("profileMode") || "SELF";
    console.log("Profile mode:", mode);

    if (mode === "SELF") {
        loadLoggedInUserProfile();
    } else{
        loadSelectedProfile();
    }
    setupTabs();          // ✅ ADD THIS
    setupEventListeners();
}

function loadSelectedProfile() {
  const selectedDataString = localStorage.getItem("currentSelectedProfile");
  if (!selectedDataString) {
    console.error("No selected profile in storage!");
    return;
  }

  const data = JSON.parse(selectedDataString);
  const role = sessionStorage.getItem("profileMode") || "STUDENT";

  const profile = {
    studentId: data.studentId || data.id || null,
    teacherId: data.teacherId || null,
    fullName: data.fullName || "-",
    email: data.email || "-",
    contact: data.contact || "-",
    address: data.address || "-",
    batch: data.batch || "-",

    // ✅ program object exists in student list
    program: data.program || null,
    semester: data.semester || null,

    status: data.status || "Active"
  };

  populateProfile(profile, role);
}




// ================= LOAD LOGGED-IN USER PROFILE =================
function loadLoggedInUserProfile() {
    fetch("/admin/api/userinfo")
        .then(res => res.ok ? res.json() : Promise.reject("Unauthorized"))
        .then(user => {
            const role = user.role || "STUDENT";

            const profile = {
  studentId: user.studentId || null,
  teacherId: user.teacherId || null,
  fullName: user.fullName || user.username,
  email: user.email || "-",
  contact: user.contact || "-",
  address: user.address || "-",

  // 🔥 NORMALIZE BACKEND DATA
  program: user.department
    ? { code: "", name: user.department }
    : null,

  semester: user.semester
    ? { name: user.semester }
    : null,

  batch: user.batch || "-",
  status: "Active"
};
 

            populateProfile(profile, role);
            loadAcademicData(profile);


            // Remove back button for self-profile
            document.querySelector(".btn-back")?.remove();
        })
        .catch(err => console.error(err));
}

function showTeacherAnalyticsInProfile() {
    const user = window.currentUser || JSON.parse(localStorage.getItem("currentUser"));
    if (!user || user.role !== "TEACHER" || !user.teacherId) return;

    // Open Overview tab
    document.getElementById("overviewTabBtn").style.display = "inline-flex";
    activateTab("overview");

    // Hide student overview
    document.getElementById("evaluation-overview-body").style.display = "none";

    const container = document.getElementById("teacherAnalyticsContainer");
    if (!container) return;

    container.style.display = "block";
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading your evaluation analytics...</p>
        </div>
    `;

    // ✅ USE EXISTING API (WORKING)
    fetch("/api/admin/evaluations/teachers")
        .then(res => res.json())
        .then(teachers => {
            const teacher = teachers.find(t => t.teacherId === user.teacherId);

            if (!teacher || !Array.isArray(teacher.courses)) {
                container.innerHTML = `<p class="no-data">No evaluation data found</p>`;
                return;
            }

            renderTeacherAnalyticsUI(container, teacher);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<p class="no-data">Failed to load analytics</p>`;
        });
}

function renderTeacherAnalyticsUI(container, teacher) {
    container.innerHTML = `
        <div class="analytics-inline">

            <div class="form-group">
                <label>Select Course</label>
                <select id="teacherCourseSelect">
                    <option value="">-- Select Course --</option>
                    ${teacher.courses.map(c =>
                        `<option value="${c.courseId}">${c.courseName}</option>`
                    ).join("")}
                </select>
            </div>

            <div class="form-group">
                <label>Select Week</label>
                <select id="teacherWeekSelect">
                    <option value="">-- Select Week --</option>
                </select>
            </div>

            <div id="teacherAnalyticsSummary" style="display:none">
                <div class="analytics-kpis">
                    <div class="kpi-card">
                        <span>Total Evaluations</span>
                        <strong id="teacherAnalyticsTotal">0</strong>
                    </div>
                    <div class="kpi-card highlight">
                        <span>Overall Avg Rating</span>
                        <strong id="teacherAnalyticsOverall">0</strong>
                    </div>
                </div>

                <canvas id="teacherAnalyticsChart" height="120"></canvas>

                <table class="analytics-table">
                    <thead>
                        <tr>
                            <th>Question</th>
                            <th>Avg</th>
                        </tr>
                    </thead>
                    <tbody id="teacherAnalyticsParams"></tbody>
                </table>
            </div>

        </div>
    `;

    // Hook course select
    document.getElementById("teacherCourseSelect").addEventListener("change", (e) => {
        loadTeacherWeeksForProfile(teacher.teacherId, e.target.value);
    });
}

async function loadTeacherWeeksForProfile(teacherId, courseId) {
    if (!courseId) return;

    const res = await fetch(
        `/api/admin/evaluations/teacher/${teacherId}/course/${courseId}/weeks`
    );

    const weeks = await res.json();
    const weekSelect = document.getElementById("teacherWeekSelect");

    weekSelect.innerHTML = `<option value="">-- Select Week --</option>`;
    weeks.forEach(w => {
        weekSelect.innerHTML += `<option value="${w}">${w}</option>`;
    });

    weekSelect.onchange = () =>
        loadTeacherAnalyticsSummary(teacherId, courseId, weekSelect.value);
}
async function loadTeacherAnalyticsSummary(teacherId, courseId, week) {
    if (!week) return;

    const res = await fetch(
        `/api/admin/evaluations/teacher/${teacherId}/course/${courseId}/summary?weekStart=${week}`
    );

    const data = await res.json();

    document.getElementById("teacherAnalyticsSummary").style.display = "block";
    document.getElementById("teacherAnalyticsTotal").innerText = data.totalEvaluations;
    document.getElementById("teacherAnalyticsOverall").innerText = data.overallAverage;

    const tbody = document.getElementById("teacherAnalyticsParams");
    tbody.innerHTML = "";

    const labels = [];
    const values = [];

    data.parameterAverages.forEach(p => {
    labels.push(p.questionText);
    values.push(p.average);

    const ratingClass =
        p.average === 0 ? "rating-zero" :
        p.average < 3 ? "rating-low" :
        p.average < 4 ? "rating-mid" :
        "rating-high";

    tbody.innerHTML += `
        <tr>
            <td>${p.questionText}</td>
            <td class="${ratingClass}">${p.average}</td>
        </tr>
    `;
});


   ensureChartJSLoaded(() => {
    renderTeacherAnalyticsChart(labels, values);
});

}
function ensureChartJSLoaded(callback) {
    if (window.Chart) {
        callback();
        return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js";
    script.onload = callback;
    document.head.appendChild(script);
}


let teacherAnalyticsChart = null;

function renderTeacherAnalyticsChart(labels, values) {
    const ctx = document.getElementById("teacherAnalyticsChart");

    if (teacherAnalyticsChart) teacherAnalyticsChart.destroy();

    teacherAnalyticsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: values.map((_, i) => i + 1),
           datasets: [{
    label: "Average Rating",
    data: values,
    backgroundColor: values.map(v =>
        v === 0 ? "#f87171" : "#93c5fd"
    ),
    borderRadius: 6,
    barPercentage: 0.6,
    minBarLength: 4
}] },
        options: {
            scales: {
                y: { beginAtZero: true, max: 5 }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: i => labels[i[0].dataIndex]
                    }
                }
            }
        }
    });
}

// ================= POPULATE STUDENT DATA =================
function populateProfile(user, role) {
    console.log("Populating profile for:", user, role);

    // Main fields
    const studentIdElem = document.getElementById("student-id");
    const nameElem = document.querySelector(".student-name");
    const deptElem = document.getElementById("department");
    const semesterElem = document.getElementById("semester");
    const batchElem = document.getElementById("batch");
    const emailElem = document.getElementById("student-email");
    const phoneElem = document.getElementById("student-phone");
    const addressElem = document.getElementById("student-address");
    const statusBadge = document.querySelector(".badge-status");

    if (studentIdElem) studentIdElem.textContent = user.studentId || user.teacherId || "-";
    if (nameElem) nameElem.textContent = user.fullName || "-";
    if (deptElem) {
  if (user.program?.name) {
    deptElem.textContent =
      (user.program.code ? user.program.code + " - " : "") + user.program.name;
  } else if (user.department) {
    deptElem.textContent = user.department;
  } else {
    deptElem.textContent = "-";
  }
}

if (semesterElem) {
  semesterElem.textContent =
    typeof user.semester === "string"
      ? user.semester
      : user.semester?.name || "-";
}
    if (batchElem) batchElem.textContent = user.batch || "-";
    if (emailElem) emailElem.textContent = user.email || "-";
    if (phoneElem) phoneElem.textContent = user.contact || "-";
    if (addressElem) addressElem.textContent = user.address || "-";

    if (statusBadge) {
        statusBadge.textContent = user.status || "-";
        statusBadge.className = `badge badge-status ${user.status === "Active" ? "active" : "inactive"}`;
    }

    // Hide student-only tabs for teacher/admin
    if (role !== "STUDENT") {
        document.querySelectorAll(".info-card, .tab-btn, .tab-pane").forEach(el => {
            if (el.dataset?.tab && ["academic","performance","attendance","documents"].includes(el.dataset.tab)) {
                el.style.display = "none";
            }
        });
    }
    const profileView = sessionStorage.getItem("profileView");

if (role === "TEACHER" && profileView === "TEACHER_ANALYTICS") {
    showTeacherAnalyticsInProfile();
}

}
 
// ================= SETUP EVENT LISTENERS =================
function setupEventListeners() {
    const backButton = document.querySelector(".btn-back");
    if (backButton) {
        backButton.addEventListener("click", loadStudentProfilePage);
    }

    const editButton = document.querySelector(".btn-edit");
    if (editButton) {
        editButton.addEventListener("click", () => {
            const studentData = JSON.parse(localStorage.getItem('currentStudentProfile'));
            if (studentData && studentData.id && window.editStudent) {
                window.editStudent(studentData.id);
            }
        });
    }
}

// ================= LOAD STUDENT LIST PAGE =================
function loadStudentProfilePage() {
    loadPage("/pages/StudentProfile.html"); // ✅ IMPORTANT
}


// ================= SETUP TABS =================
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (!tabButtons.length) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            const targetPane = document.getElementById(targetTab + '-tab');
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // Activate first tab if none active
    const active = document.querySelector('.tab-btn.active');
    if (!active && tabButtons.length) {
        tabButtons[0].classList.add('active');
        const firstPane = document.getElementById(tabButtons[0].getAttribute('data-tab') + '-tab');
        if (firstPane) firstPane.classList.add('active');
    }
}

// ================= SHOW PROFILE MESSAGE =================
function showProfileMessage(msg, type) {
    let messageBox = document.getElementById("profileMessage");
    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "profileMessage";
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            min-width: 200px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(messageBox);
    }
    messageBox.textContent = msg;
    messageBox.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

// ================= MAKE FUNCTIONS GLOBALLY AVAILABLE =================
window.initStudentProfile = initStudentProfile;
window.loadStudentProfilePage = loadStudentProfilePage;
window.showProfileMessage = showProfileMessage;

 
function loadAcademicData(profile) {
    if (!profile.studentId) return;

    window.currentStudentId = profile.studentId;

    loadCurrentCourses(profile.studentId);
    loadEvaluationWeeks(profile.studentId); // ✅ ADD THIS
}

function loadCurrentCourses(studentId) {
    const holder = document.getElementById("current-courses");
    if (!holder) return;

    fetch(`/api/students/${studentId}/teacher-courses`)
        .then(res => res.json())
        .then(data => {
            if (!data || data.length === 0) {
                holder.innerHTML = `<p class="no-data">No courses enrolled</p>`;
                return;
            }

            holder.innerHTML = data.map(item => `
                <div class="course-item">
                    <div class="course-name">
                       COURSE : ${item.courseCode} - ${item.courseName}
                    </div>
                    <div class="course-instructor">
                        ${item.teacherName}
                    </div>
                 
                </div>
            `).join("");
        })
        .catch(err => {
            console.error(err);
            holder.innerHTML = `<p class="no-data">Failed to load courses</p>`;
        });
}


async function loadEvaluationWeeks(studentId) {
  const holder = document.getElementById("evaluation-history");
  if (!holder) return;

  try {
    const res = await fetch(`/api/student-profile/${studentId}/evaluation-weeks`, {
      credentials: "same-origin"
    });
    if (!res.ok) throw new Error("Failed to load evaluation history");

    const data = await res.json();
    if (!data.success || !data.weeks?.length) {
      holder.innerHTML = `<p class="no-data">No evaluations submitted yet</p>`;
      return;
    }

    holder.innerHTML = data.weeks.map(w => `
      <details class="week-tree" data-week="${w.weekStart}">
        <summary><strong>Week ${w.weekNo}</strong> <span style="opacity:.7">(${w.weekStart})</span></summary>
        <div class="week-teachers" id="week-${w.weekNo}">
          <p class="no-data">Click to load teachers...</p>
        </div>
      </details>
    `).join("");

    // attach listeners for each <details>
    holder.querySelectorAll("details.week-tree").forEach(d => {
      d.addEventListener("toggle", () => {
        if (d.open) loadWeekTeachers(studentId, d.dataset.week, d.querySelector(".week-teachers"));
      });
    });

  } catch (e) {
    console.error(e);
    holder.innerHTML = `<p class="no-data">Failed to load evaluation history</p>`;
  }
}

async function loadWeekTeachers(studentId, weekStart, container) {
  if (!container) return;

  try {
    const res = await fetch(`/api/student-profile/${studentId}/evaluations?weekStart=${encodeURIComponent(weekStart)}`, {
      credentials: "same-origin"
    });
    if (!res.ok) throw new Error("Failed to load week evaluations");
    const data = await res.json();

    if (!data.success || !data.evaluations?.length) {
      container.innerHTML = `<p class="no-data">No evaluations in this week</p>`;
      return;
    }

    container.innerHTML = data.evaluations.map(ev => `
  <div class="course-item"
       style="cursor:pointer"
       data-evalid="${ev.evaluationId}"
       data-teacher="${ev.teacherName}"
       data-course="${ev.courseName || ''}"
       data-submitted="${ev.submittedAt || '-'}">
    <div>
      <div class="course-name"><strong>${ev.teacherName}</strong></div>
      <div class="course-instructor">${ev.courseName || ""}</div>
    </div>
  </div>
`).join("");


    container.querySelectorAll("[data-evalid]").forEach(card => {
card.addEventListener("click", () => {
  openOverview(
    card.dataset.evalid,
    card.dataset.teacher,
    card.dataset.course,
    card.dataset.submitted
  );
});

    });

  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="no-data">Failed to load teachers</p>`;
  }
}
function openOverview(evaluationId, teacherName, courseName, submittedAt) {
    if (!evaluationId) return;

    document.getElementById("overviewTabBtn").style.display = "inline-flex";
    activateTab("overview");

    const body = document.getElementById("evaluation-overview-body");
    body.innerHTML = `<p class="no-data">Loading...</p>`;

    fetch(`/api/evaluation/responses/evaluation/${evaluationId}`)
        .then(res => res.json())
       .then(list => {
  if (!list || list.length === 0) {
    body.innerHTML = `<p class="no-data">No responses found</p>`;
    return;
  }

  body.innerHTML = `
    <div style="margin-bottom:12px;">
      <div><strong>Teacher:</strong> ${teacherName}</div>
      <div><strong>Course:</strong> ${courseName}</div>
      <div><strong>Submitted At:</strong> ${submittedAt}</div>
    </div>

    ${list.map(r => `
      <div style="padding:8px 0;border-bottom:1px solid #eee;">
        <strong>${r.questionText ?? "Question"}</strong><br/>
        Answer: ${r.responseValue ?? "-"}
      </div>
    `).join("")}
  `;
})

        .catch(err => {
            console.error(err);
            body.innerHTML = `<p class="no-data">Failed to load overview</p>`;
        });
}

// helper: activate tab programmatically
function activateTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

    document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add("active");
    document.getElementById(`${tabName}-tab`)?.classList.add("active");
}


function renderEvaluationHistory(data, courseName, teacherName) {
    const holder = document.getElementById("evaluation-history");
    if (!holder) return;

    const submittedAt = data.submittedAt
        ? new Date(data.submittedAt).toLocaleString()
        : "Not Submitted";

    holder.innerHTML = `
        <div class="course-item" style="cursor:pointer"
             onclick="openOverview(${data.evaluationId || 0}, '${teacherName}', '${courseName}', '${submittedAt}')">
            <div><strong>${teacherName}</strong></div>
            <div>${courseName}</div>
            <div>Status: ${data.isSubmitted ? "Submitted" : "Not Submitted"}</div>
            <div>Submitted At: ${submittedAt}</div>
        </div>
    `;
}
