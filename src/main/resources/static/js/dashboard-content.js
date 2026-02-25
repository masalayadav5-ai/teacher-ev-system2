
window.teacherChart = window.teacherChart || null;
window.adminChart = window.adminChart || null;
async function initDashboardContent() {
        console.log("initDashboardContent running");

  const user = await getCurrentUser();
  if (!user?.role) return;

  window._currentUser = user;

  if (!document.getElementById("summaryCards")) {
  console.warn("Dashboard DOM not ready yet");
  setTimeout(initDashboardContent, 100);
  return;
}

renderDashboard(user.role);

if (user.role === "ADMIN") {
  loadCommonCounts();
}


  if (user.role === "ADMIN") loadAdminData();
if (user.role === "TEACHER") {
  const teacherId = user.teacherDbId ?? user.teacherId; // fallback
  loadTeacherData(teacherId);
}
if (user.role === "STUDENT") loadStudentData(user.studentId);
}

window.initDashboardContent = initDashboardContent;


/* ================= UI RENDER ================= */

function renderDashboard(role) {
  const title = document.getElementById("dashTitle");
  const subtitle = document.getElementById("dashSubtitle");
  const cards = document.getElementById("summaryCards");
  const left = document.getElementById("leftPanel");
  const right = document.getElementById("rightPanel");

  if (role === "ADMIN") {
    title.textContent = "Admin Dashboard";
    subtitle.textContent = "System overview & analytics";

cards.innerHTML = `
  <div class="dash-kpi-card dash-kpi-blue">
    <div class="dash-kpi-icon">
      <i class="bi bi-person-badge"></i>
    </div>
    <div class="dash-kpi-content">
      <div class="dash-kpi-label">Total Teachers</div>
      <div class="dash-kpi-value" id="teachersCount">—</div>
    </div>
  </div>

  <div class="dash-kpi-card dash-kpi-green">
    <div class="dash-kpi-icon">
      <i class="bi bi-people"></i>
    </div>
    <div class="dash-kpi-content">
      <div class="dash-kpi-label">Total Students</div>
      <div class="dash-kpi-value" id="studentsCount">—</div>
    </div>
  </div>

  <div class="dash-kpi-card dash-kpi-purple">
    <div class="dash-kpi-icon">
      <i class="bi bi-calendar-check"></i>
    </div>
    <div class="dash-kpi-content">
      <div class="dash-kpi-label">Session Plans</div>
      <div class="dash-kpi-value" id="sessionsCount">—</div>
    </div>
  </div>

  <div class="dash-kpi-card dash-kpi-orange">
    <div class="dash-kpi-icon">
      <i class="bi bi-hourglass-split"></i>
    </div>
    <div class="dash-kpi-content">
      <div class="dash-kpi-label">Pending Evaluations</div>
      <div class="dash-kpi-value" id="pendingEvalCount">—</div>
    </div>
  </div>
`;



left.innerHTML = `
  <div class="dash-panel-header">
    <div class="dash-panel-icon blue">
      <i class="bi bi-graph-up"></i>
    </div>
    <span>Teacher Performance Trend</span>
  </div>

  <canvas id="adminLineChart"></canvas>
`;



    right.innerHTML = `
      <div class="panel">
<div class="dash-panel-header">
  <div class="dash-panel-icon purple">
    <i class="bi bi-activity"></i>
  </div>
  <span>Recent Teacher Activities</span>
</div>
        <table class="table">
          <thead>
            <tr><th>Teacher</th><th>Activity</th><th>Date</th></tr>
          </thead>
          <tbody id="activityTableBody"></tbody>
        </table>
      </div>
      <div class="panel">
<div class="dash-panel-header">
  <div class="dash-panel-icon green">
    <i class="bi bi-check-circle"></i>
  </div>
  <span>Recently Completed Sessions</span>
</div>
  <div class="upcoming-list" id="recentSessions"></div>
</div>
<div class="panel">
<div class="dash-panel-header">
  <div class="dash-panel-icon blue">
    <i class="bi bi-bar-chart"></i>
  </div>
  <span>Course Progress</span>
</div>
  <div id="courseProgressList"></div>
</div>

<div class="panel">
<div class="dash-panel-header">
  <div class="dash-panel-icon orange">
    <i class="bi bi-trophy"></i>
  </div>
  <span>Teacher Leaderboard</span>
</div>
  <div id="teacherLeaderboard"></div>
</div>

    `;
  }

  if (role === "TEACHER") {
    title.textContent = "Teacher Dashboard";
    subtitle.textContent = "Your teaching overview";

  cards.innerHTML = `
  <div class="dash-card dash-blue">
    <div class="dash-card-label">Assigned Courses</div>
    <div class="dash-card-value" id="teacherCoursesCount">—</div>
  </div>

  <div class="dash-card dash-green">
    <div class="dash-card-label">Session Plans</div>
    <div class="dash-card-value" id="teacherSessionsCount">—</div>
  </div>

  <div class="dash-card dash-orange">
    <div class="dash-card-label">Pending Evaluations</div>
    <div class="dash-card-value" id="teacherPendingCount">—</div>
  </div>

  <div class="dash-card dash-purple">
    <div class="dash-card-label">Avg Rating</div>
    <div class="dash-card-value" id="teacherRating">—</div>
  </div>
`;


   left.innerHTML = `
  <div class="dash-panel-header">
    <div class="dash-panel-icon purple">
      <i class="bi bi-star"></i>
    </div>
    <span>Your Rating Trend</span>
  </div>
  <canvas id="teacherLineChart"></canvas>
`;


   right.innerHTML = `
  <div class="panel">
    <div class="dash-panel-header">
      <div class="dash-panel-icon blue">
        <i class="bi bi-journal-text"></i>
      </div>
      <span>Your Session Plans</span>
    </div>
    <div class="list" id="teacherSessions"></div>
  </div>

  <div class="panel">
    <div class="dash-panel-header">
      <div class="dash-panel-icon orange">
        <i class="bi bi-chat-dots"></i>
      </div>
      <span>Recent Feedback</span>
    </div>
    <div class="list" id="teacherFeedback"></div>
  </div>
`;

  }

  if (role === "STUDENT") {
    title.textContent = "Student Dashboard";
    subtitle.textContent = "Your academic overview";

   cards.innerHTML = `
  <div class="dash-card dash-blue">
    <div class="dash-card-label">My Courses</div>
    <div class="dash-card-value" id="studentCoursesCount">—</div>
  </div>

  <div class="dash-card dash-orange">
    <div class="dash-card-label">Pending Evaluations</div>
    <div class="dash-card-value" id="studentPendingCount">—</div>
  </div>

  <div class="dash-card dash-green">
    <div class="dash-card-label">Completed Evaluations</div>
    <div class="dash-card-value" id="studentCompletedCount">—</div>
  </div>

  <div class="dash-card dash-purple">
    <div class="dash-card-label">Session Plans</div>
    <div class="dash-card-value" id="studentSessionsCount">—</div>
  </div>
`;
 

    left.innerHTML = `
  <div class="dash-panel-header">
    <div class="dash-panel-icon blue">
      <i class="bi bi-bar-chart-line"></i>
    </div>
    <span>My Evaluation History</span>
  </div>
  <canvas id="studentBarChart"></canvas>
`;

   right.innerHTML = `
  <div class="panel">
    <div class="dash-panel-header">
      <div class="dash-panel-icon green">
        <i class="bi bi-calendar-check"></i>
      </div>
      <span>My Session Plans</span>
    </div>
    <div class="list" id="studentSessions"></div>
  </div>

  <div class="panel">
    <div class="dash-panel-header">
      <div class="dash-panel-icon orange">
        <i class="bi bi-pencil-square"></i>
      </div>
      <span>Courses to Evaluate</span>
    </div>
    <div class="list" id="studentPendingTeachers"></div>
  </div>
`;

  }
}

/* ================= COMMON COUNTS ================= */

async function loadCommonCounts() {
  try {
    const [tRes, sRes, pRes] = await Promise.all([
      fetch("/api/admin/teachers"),
      fetch("/api/admin/students"),
      fetch("/api/session-plans")
    ]);

    if (tRes.ok) {
      const el = document.getElementById("teachersCount");
      if (el) el.textContent = (await tRes.json()).length;
    }

    if (sRes.ok) {
      const el = document.getElementById("studentsCount");
      if (el) el.textContent = (await sRes.json()).length;
    }

    if (pRes.ok) {
      const el = document.getElementById("sessionsCount");
      if (el) el.textContent = (await pRes.json()).length;
    }

  } catch (e) {
    console.warn("Counts load failed", e);
  }
}


/* ================= ADMIN ================= */

async function loadAdminTrendChart() {
  try {
    const res = await fetch("/api/admin/evaluations/trend", { credentials: "include" });
    if (!res.ok) throw new Error("trend fetch failed");

    const list = await res.json();
    if (!Array.isArray(list) || !list.length) {
      if (window.adminChart) window.adminChart.destroy();
      window.adminChart = renderLineChart("adminLineChart", ["No data"], [0]);
      return;
    }

    const labels = list.map(x => {
      const d = new Date(x.weekStart);
      return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    });

const data = list.map(x => +(Number(x.average || 0)).toFixed(2));
    if (window.adminChart) window.adminChart.destroy();
    window.adminChart = renderLineChart("adminLineChart", labels, data);

  } catch (e) {
    console.error("loadAdminTrendChart failed:", e);
    if (window.adminChart) window.adminChart.destroy();
    window.adminChart = renderLineChart("adminLineChart", ["Error"], [0]);
  }
}
async function loadAdminData() {
  // 1) Trend chart (async)
  await loadAdminTrendChart();

  // 2) Other admin widgets
  loadAdminPendingCount();
  loadRecentActivities();
  loadRecentCompletedSessions();
  loadCourseProgress();
  loadTeacherLeaderboard();
}

/* ================= TEACHER ================= */
async function loadTeacherFeedback(teacherId) {
  const box = document.getElementById("teacherFeedback");
  if (!box) return;

  try {
    // 🔥 You must have this API in backend
    const res = await fetch(`/api/teachers/recent-feedback?limit=5`, {
      credentials: "include"
    });

    if (!res.ok) {
      box.innerHTML = `<div class="list-item muted">No feedback yet</div>`;
      return;
    }

    const list = await res.json();

    if (!Array.isArray(list) || list.length === 0) {
      box.innerHTML = `<div class="list-item muted">No feedback yet</div>`;
      return;
    }

    box.innerHTML = list.map(f => `
      <div class="list-item">
        <strong>${f.courseName || "Course"}</strong><br>
        ⭐ ${f.overallRating ?? "-"} <br>
        <small>${f.submittedAt ? new Date(f.submittedAt).toLocaleString() : ""}</small>
      </div>
    `).join("");

  } catch (err) {
    console.error("loadTeacherFeedback failed:", err);
    box.innerHTML = `<div class="list-item muted">No feedback yet</div>`;
  }
}
async function loadTeacherData(teacherId) {
  if (!teacherId) {
    console.error("❌ teacherId missing in loadTeacherData:", teacherId, window._currentUser);
    return;
  }

  // 1) session plans
  const plansRes = await fetch(`/api/session-plans/teacher/${teacherId}/visible`);
  const plans = plansRes.ok ? await plansRes.json() : [];

  const tCount = document.getElementById("teacherSessionsCount");
  if (tCount) tCount.textContent = plans.length;

  const list = document.getElementById("teacherSessions");
  if (list) {
    list.innerHTML = plans.map(p =>
      `<div class="list-item">${p.course?.name || "-"}</div>`
    ).join("");
  }

  // 2) assigned courses count
  try {
    const res = await fetch(`/api/admin/evaluations/teachers?mode=current`);
    const teachers = res.ok ? await res.json() : [];
    const me = teachers.find(t => Number(t.teacherId) === Number(teacherId));
    const assignedCount = me?.courses?.length ?? 0;

    const el = document.getElementById("teacherCoursesCount");
    if (el) el.textContent = assignedCount;
  } catch (e) {
    console.warn("Assigned courses load failed", e);
  }

  // 3) pending + avg rating
  try {
    const res = await fetch(`/api/evaluation/teacher/${teacherId}`);
    const evals = res.ok ? await res.json() : [];

    const pending = evals.filter(e => e.isSubmitted === false).length;

    const submitted = evals.filter(e =>
      e.isSubmitted === true && e.overallRating != null
    );

    const avg = submitted.length
      ? submitted.reduce((s, e) => s + Number(e.overallRating), 0) / submitted.length
      : 0;

    const pendingEl = document.getElementById("teacherPendingCount");
    if (pendingEl) pendingEl.textContent = pending;

    const ratingEl = document.getElementById("teacherRating");
    if (ratingEl) ratingEl.textContent = submitted.length ? avg.toFixed(1) : "0.0";
  } catch (e) {
    console.warn("Teacher stats load failed", e);
  }

  await loadTeacherFeedback(teacherId);

  // (chart later we’ll make real)
await loadTeacherRatingTrend(teacherId);
}


/* ================= STUDENT ================= */

async function loadStudentData(studentId) {

  await Promise.all([
    loadStudentStats(studentId),
    loadStudentSessions(studentId),
    loadStudentPendingTeachers(studentId),
    loadStudentEvaluationChart(studentId)
  ]);

}



/* ================= CHART HELPERS ================= */

function renderLineChart(id, labels, data) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;

  return new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{ label: "Rating", data, tension: 0.3 }]
    }
  });
}

function renderBarChart(id, labels, data) {
  const ctx = document.getElementById(id);
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Score", data }]
    }
  });
}
async function loadAdminPendingCount() {
  try {
    const res = await fetch("/api/evaluation/evaluations");

    if (!res.ok) {
      console.warn("Failed to load evaluations:", res.status);
      document.getElementById("pendingEvalCount").textContent = "—";
      return;
    }

    const all = await res.json();

    if (!Array.isArray(all)) {
      console.warn("Invalid evaluations payload", all);
      document.getElementById("pendingEvalCount").textContent = "—";
      return;
    }

    const pending = all.filter(e => !e.isSubmitted);

    const el = document.getElementById("pendingEvalCount");
    if (el) el.textContent = pending.length;

  } catch (err) {
    console.error("Error loading pending eval count:", err);
    document.getElementById("pendingEvalCount").textContent = "—";
  }
}


async function loadRecentActivities() {
  try {
    const res = await fetch("/api/admin/activity/recent");
    if (!res.ok) {
      console.warn("Failed to load recent activities");
      return;
    }

    const list = await res.json();
    const body = document.getElementById("activityTableBody");

    if (!body) {
      console.warn("activityTableBody not found");
      return;
    }

    if (!list.length) {
      body.innerHTML = `
        <tr>
          <td colspan="3" style="text-align:center;color:#888;">
            No recent activity
          </td>
        </tr>
      `;
      return;
    }

    body.innerHTML = list.map(a => `
      <tr>
        <td>${a.teacher}</td>
        <td>${a.action} ${a.course}</td>
        <td>${new Date(a.date).toLocaleString()}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading recent activities:", err);
  }
}
async function loadRecentCompletedSessions() {
  try {
    const res = await fetch("/api/session-plans/admin/sessions/recent-completed");
    if (!res.ok) {
      console.warn("Failed to load recent completed sessions");
      return;
    }

    const list = await res.json();
    const box = document.getElementById("recentSessions");

    if (!box) return;

    if (!list.length) {
      box.innerHTML = `
        <div class="list-item muted">
          No completed sessions yet
        </div>
      `;
      return;
    }

    box.innerHTML = list.map(s => `
      <div class="list-item">
        <strong>${s.course}</strong><br>
        ${s.teacher}<br>
        ${s.day}: ${s.topic}<br>
        <small>${new Date(s.date).toLocaleDateString()}</small>
      </div>
    `).join("");

  } catch (err) {
    console.error("Error loading recent completed sessions:", err);
  }
}
async function loadCourseProgress() {
  const res = await fetch("/api/session-plans/admin/course-progress");
  if (!res.ok) return;

  const list = await res.json();
  const box = document.getElementById("courseProgressList");

  if (!box || !list.length) {
    box.innerHTML = `<div class="list-item muted">No data yet</div>`;
    return;
  }

  box.innerHTML = list.map(c => `
    <div class="list-item">
      <strong>${c.course}</strong><br>
      <div class="progress-track">
  <div class="progress-fill" style="width:${c.progress}%">
    ${c.progress}%
  </div>
</div>

      </div>
    </div>
  `).join("");
}

async function loadTeacherLeaderboard() {
  const res = await fetch("/api/admin/teachers/leaderboard");
  if (!res.ok) return;

  const list = await res.json();
  const box = document.getElementById("teacherLeaderboard");

  if (!box || !list.length) {
    box.innerHTML = `<div class="list-item muted">No leaderboard yet</div>`;
    return;
  }

  box.innerHTML = list.map(t => `
    <div class="list-item">
      🥇 ${t.rank}. ${t.teacher}
      <span style="float:right;font-weight:700">
        ⭐ ${t.avg}
      </span>
    </div>
  `).join("");
}
async function loadStudentStats(studentId) {
  try {
    const res = await fetch(
      `/api/evaluation/student/${studentId}/weekly-stats`
    );

    if (!res.ok) throw new Error("Stats fetch failed");

    const data = await res.json();

    document.getElementById("studentPendingCount").textContent =
      data.pending;

    document.getElementById("studentCompletedCount").textContent =
      data.completed;

    document.getElementById("studentCoursesCount").textContent =
      data.coursesCount;

    document.getElementById("studentSessionsCount").textContent =
      data.sessionPlans;

  } catch (e) {
    console.error("Student weekly stats failed", e);
  }
}

async function loadStudentSessions(studentId) {
  try {
    const res = await fetch(`/api/session-plans/student/${studentId}`);
    if (!res.ok) return;

    const list = await res.json();
    const box = document.getElementById("studentSessions");

    if (!box || !list.length) {
      box.innerHTML = `<div class="list-item muted">No session plans yet</div>`;
      return;
    }

    box.innerHTML = list.map(p => `
      <div class="list-item">
        <strong>${p.course?.name || "Course"}</strong><br>
        ${p.teacher?.fullName || "Teacher"}<br>
        <small>${p.days?.length || 0} days planned</small>
      </div>
    `).join("");

  } catch (e) {
    console.error("Student sessions load failed", e);
  }
}
async function loadStudentPendingTeachers(studentId) {
  try {
    const res = await fetch(
      `/api/evaluation/student/${studentId}/weekly-pending-courses`
    );

    if (!res.ok) return;

    const list = await res.json();
    const box = document.getElementById("studentPendingTeachers");

    if (!box || !list.length) {
      box.innerHTML =
        `<div class="list-item muted">
          No pending evaluations 🎉
        </div>`;
      return;
    }

    box.innerHTML = list.map(c => `
      <div class="list-item">
        <strong>${c.courseName}</strong><br>
        <button class="btn btn-sm btn-primary"
          onclick="openEvaluationFormByCourse(${c.courseId})">
          Evaluate Now
        </button>
      </div>
    `).join("");

  } catch (e) {
    console.error("Pending courses load failed", e);
  }
}

async function loadStudentEvaluationChart(studentId) {
  const res = await fetch(`/api/evaluation/student/${studentId}`);
  if (!res.ok) return;

  const list = await res.json();
  const completed = list.filter(e => e.isSubmitted && e.overallRating != null);

  if (!completed.length) return;

  const labels = completed.map(e => e.courseName || "Course");
  const data = completed.map(e => e.overallRating);

  renderBarChart("studentBarChart", labels, data);
}
//        ................evaluate now......................
window.openEvaluationFormByCourse = async function (courseId) {
  try {
    const user = window._currentUser || await getCurrentUser();
    if (!user || user.role !== "STUDENT") return;

    let courseName = "";
    let courseCode = "";
    let teacherId = null;
    let teacherName = "";

    // 1) Try your pending-courses API first (it has courseName)
    try {
      const res = await fetch(
        `/api/evaluation/student/${user.studentId}/weekly-pending-courses`,
        { credentials: "include" }
      );
      if (res.ok) {
        const list = await res.json();
        const c = list.find(x => String(x.courseId) === String(courseId));
        if (c) {
          courseName = c.courseName || "";
          courseCode = c.courseCode || "";
          teacherId = c.teacherId || null;
          teacherName = c.teacherName || "";
        }
      }
    } catch (e) {
      console.warn("pending-courses api failed", e);
    }

    // 2) If teacherId missing, FALLBACK to session plans API (it includes teacher)
    if (!teacherId) {
      const plansRes = await fetch(`/api/session-plans/student/${user.studentId}`, {
        credentials: "include"
      });

      if (!plansRes.ok) throw new Error("Cannot load session plans to find teacher.");

      const plans = await plansRes.json();

      // find plan by courseId
      const plan = plans.find(p => String(p.course?.id) === String(courseId));

      if (!plan) {
        console.error("No matching session plan found for courseId:", courseId, plans);
        throw new Error("Teacher not found for this course. Assign teacher to course.");
      }

      teacherId = plan.teacher?.id || plan.teacherId || null;
      teacherName = plan.teacher?.fullName || plan.teacher?.name || "";
      courseName = courseName || plan.course?.name || "";
      courseCode = courseCode || plan.course?.code || "";
    }

    if (!teacherId) {
      throw new Error("teacherId still missing. Please return teacherId from API.");
    }

    // 3) Store evaluation context (EvaluationForm.js reads this)
    const context = {
      teacherId,
      studentId: user.studentId,
      courseId,
      teacherName,
      courseCode,
      courseName
    };

    sessionStorage.setItem("evaluationContext", JSON.stringify(context));

    // 4) Open evaluation form page (use your real path)
    // This should be the same page used when clicking "Evaluate Course" in sidebar
    loadPage("/pages/EvaluationForm.html");  // ✅ change to your form page if different

    // 5) Init form after page loads
    setTimeout(() => window.initEvaluationForm && window.initEvaluationForm(), 50);

  } catch (err) {
    console.error("openEvaluationFormByCourse error:", err);
    alert(err.message || "Unable to open evaluation form.");
  }
};
async function loadTeacherRatingTrend(teacherId) {
  const canvas = document.getElementById("teacherLineChart");
  if (!canvas) return;

  try {
    const res = await fetch(`/api/evaluation/teacher/${teacherId}`);
    if (!res.ok) throw new Error("Failed to load teacher evaluations");

    const evals = await res.json();

    // ✅ only submitted with numeric rating and date
    const submitted = (Array.isArray(evals) ? evals : [])
      .filter(e =>
        e.isSubmitted === true &&
        e.overallRating != null &&
        !isNaN(Number(e.overallRating)) &&
        e.submittedAt
      )
      .map(e => ({
        rating: Number(e.overallRating),
        date: new Date(e.submittedAt)
      }))
      .sort((a, b) => a.date - b.date);

    if (!submitted.length) {
      // show empty state
      if (window.teacherChart) window.teacherChart.destroy();
      window.teacherChart = new Chart(canvas, {
        type: "line",
        data: { labels: ["No data"], datasets: [{ label: "Avg Rating", data: [0] }] }
      });
      return;
    }

    // Group by week (Sun-sat)
   const weekKey = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const day = d.getDay(); // 0 = Sunday
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day); // move back to Sunday

  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, "0");
  const dd = String(sunday.getDate()).padStart(2, "0");

  return `${y}-${m}-${dd}`; // week start (Sunday)
};

    const buckets = new Map(); // weekStart -> {sum,count}
    for (const item of submitted) {
      const key = weekKey(item.date);
      const b = buckets.get(key) || { sum: 0, count: 0 };
      b.sum += item.rating;
      b.count += 1;
      buckets.set(key, b);
    }

    // Prepare chart data (sorted by weekStart)
    const labels = Array.from(buckets.keys()).sort();
    const data = labels.map(k => {
      const b = buckets.get(k);
      return b.count ? +(b.sum / b.count).toFixed(2) : 0;
    });

    // Friendly labels like "Feb 05"
    const prettyLabels = labels.map(k => {
      const d = new Date(k);
      return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    });

    // Destroy old chart to avoid duplicates
    if (window.teacherChart) window.teacherChart.destroy();

    window.teacherChart = new Chart(canvas, {
      type: "line",
      data: {
        labels: prettyLabels,
        datasets: [{
          label: "Avg Rating (weekly)",
          data,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 5
          }
        }
      }
    });

  } catch (err) {
    console.error("loadTeacherRatingTrend failed:", err);
  }
}