

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
loadCommonCounts();


  if (user.role === "ADMIN") loadAdminData();
  if (user.role === "TEACHER") loadTeacherData(user.teacherId);
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

async function loadAdminData() {
  renderLineChart("adminLineChart", ["Jan","Feb","Mar"], [3.5, 4.1, 4.4]);

  // 🔥 NEW
  loadAdminPendingCount();
  loadRecentActivities();
  loadRecentCompletedSessions();
loadCourseProgress();

loadTeacherLeaderboard();

}


/* ================= TEACHER ================= */

async function loadTeacherData(teacherId) {
  const plans = await fetch(`/api/session-plans/teacher/${teacherId}/visible`).then(r => r.json());

  const tCount = document.getElementById("teacherSessionsCount");
  if (tCount) tCount.textContent = plans.length;

  const list = document.getElementById("teacherSessions");
  if (list) {
    list.innerHTML = plans
      .map(p => `<div class="list-item">${p.course?.name || "-"}</div>`)
      .join("");
  }

  // ✅ ADD FEEDBACK BLOCK HERE
  const feedback = document.getElementById("teacherFeedback");
  if (feedback) {
    feedback.innerHTML = `
      <div class="list-item muted">
        No feedback yet
      </div>
    `;
  }

  renderLineChart("teacherLineChart", ["Week 1","Week 2","Week 3"], [4.0, 4.3, 4.1]);
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
  const ctx = document.getElementById(id);
  if (!ctx) return;

  new Chart(ctx, {
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
