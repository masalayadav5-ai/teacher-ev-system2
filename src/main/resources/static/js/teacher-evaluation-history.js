let teacherChart = null;
let currentEvalPage = 1;
const EVALS_PER_PAGE = 6;
let _latestSummaryData = null;
let _selectedWeek = null;
let _summaryLoading = false;


async function initTeacherEvaluationHistory() {
  const container = document.getElementById("teacherEvaluationHistoryContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading your evaluation history...</p>
    </div>
  `;

  try {
    // 1️⃣ Logged-in teacher info
    const userRes = await fetch("/admin/api/userinfo");
    const user = await userRes.json();

    if (!user.teacherId) {
      container.innerHTML = `<p class="no-data">Teacher data not found</p>`;
      return;
    }

    // 2️⃣ Load teacher + courses (READ JSON ONLY ONCE)
    const res = await fetch("/api/admin/evaluations/teachers");
    if (!res.ok) throw new Error("Failed to load teachers");

    const teachers = await res.json();   // ✅ only once

    const teacher = teachers.find(t => t.teacherId === user.teacherId);

    if (!teacher || !teacher.courses?.length) {
      container.innerHTML = `<p class="no-data">No assigned courses</p>`;
      return;
    }

    // 3️⃣ Render UI
    renderTeacherEvaluationUI(container, user.teacherId, teacher);

  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="no-data">Failed to load evaluation history</p>`;
  }
}

function renderTeacherEvaluationUI(container, teacherId, teacherData) {

  container.innerHTML = `
    <div class="analytics-card glass">

      <div class="form-group">
        <label>Select Course</label>
        <select id="teacherCourseSelect">
          <option value="">-- Select Course --</option>
          ${teacherData.courses.map(c =>
            `<option value="${c.courseId}">${c.courseName}</option>`
          ).join("")}
        </select>
      </div>

      <div class="form-group">
        <label>Select Week</label>
        <select id="teacherWeekSelect" disabled>
          <option value="">-- Select Week --</option>
        </select>
      </div>
<div class="teacher-top-actions">
  <button id="toggleSummaryBtn" class="summary-btn">
    View Overall Summary
  </button>
</div>

<h3 class="section-title">Student Evaluations</h3>
<div id="teacherIndividualList" class="individual-list"></div>

      <div id="teacherAnalyticsSummary" style="display:none">
        <div class="analytics-kpis">
          <div class="kpi-card">
            <span>Total Evaluations</span>
            <strong id="teacherTotalEval">0</strong>
          </div>
          <div class="kpi-card highlight">
            <span>Overall Avg Rating</span>
            <strong id="teacherOverallAvg">0</strong>
          </div>
        </div>

        <canvas id="teacherChart" height="120"></canvas>

        <table class="analytics-table">
          <thead>
            <tr><th>Question</th><th>Avg</th></tr>
          </thead>
          <tbody id="teacherParams"></tbody>
        </table>

      </div>

    </div>
  `;
document.getElementById("toggleSummaryBtn").onclick = () => {
  const summary = document.getElementById("teacherAnalyticsSummary");
  const btn = document.getElementById("toggleSummaryBtn");

 if (_summaryLoading) {
  alert("Summary is still loading. Please wait...");
  return;
}

if (!_selectedWeek || !_latestSummaryData) {
  alert("Please select a week first");
  return;
}

  if (summary.style.display === "none") {

renderSummaryUI(_latestSummaryData);
    summary.style.display = "block";
    btn.innerText = "Hide Overall Summary";

  } else {

    summary.style.display = "none";
    btn.innerText = "View Overall Summary";
  }
};


  document.getElementById("teacherCourseSelect").onchange = e => {
    const courseId = e.target.value;
    if (!courseId) return;

    loadTeacherWeeks(teacherId, courseId);
    // reset summary + UI state
_latestSummaryData = null;
_selectedWeek = null;
document.getElementById("teacherAnalyticsSummary").style.display = "none";
document.getElementById("toggleSummaryBtn").innerText = "View Overall Summary";
document.getElementById("toggleSummaryBtn").disabled = true;

  };
}

 
 
async function loadTeacherWeekSummary(teacherId, courseId, weekStart) {

  _summaryLoading = true;
  _latestSummaryData = null;
  _selectedWeek = weekStart;

  const btn = document.getElementById("toggleSummaryBtn");
  btn.innerText = "Loading Summary...";
  btn.disabled = true;

  const res = await fetch(
    `/api/admin/evaluations/teacher/${teacherId}/course/${courseId}/summary?weekStart=${weekStart}`
  );

  const data = await res.json();

  // 🔥 store only, don't show yet
  _latestSummaryData = data;
  _summaryLoading = false;

  btn.innerText = "View Overall Summary";
  btn.disabled = false;

  // still load individual student responses
  loadTeacherIndividualEvaluations(teacherId, courseId, weekStart);
}


async function loadTeacherWeeks(teacherId, courseId) {

  const res = await fetch(
    `/api/admin/evaluations/teacher/${teacherId}/course/${courseId}/weeks`
  );

  const weeks = await res.json();

  const weekSelect = document.getElementById("teacherWeekSelect");
  weekSelect.innerHTML = `<option value="">-- Select Week --</option>`;

  weeks.forEach(w => {
    weekSelect.innerHTML += `<option value="${w}">${w}</option>`;
  });

  weekSelect.disabled = false;

  weekSelect.onchange = () => {
  const week = weekSelect.value;

  if (!week) {
    // 🔥 User selected "-- Select Week --"
    _latestSummaryData = null;
    _selectedWeek = null;
    document.getElementById("teacherAnalyticsSummary").style.display = "none";
    document.getElementById("toggleSummaryBtn").innerText = "View Overall Summary";
    document.getElementById("toggleSummaryBtn").disabled = true;

    document.getElementById("teacherIndividualList").innerHTML =
      `<p class="no-data">Please select a week to view evaluations</p>`;

    return;
  }

  loadTeacherWeekSummary(teacherId, courseId, week);
};

}
async function loadTeacherIndividualEvaluations(teacherId, courseId, weekStart) {

  const res = await fetch(
    `/api/admin/evaluations/teacher/${teacherId}/course/${courseId}/week/${weekStart}/responses`
  );

  const allData = await res.json();

  // 🔥 store globally for pagination
  window._allEvalData = allData;

  renderEvalPage(allData, 1);
}
function renderEvalPage(allData, page) {
  currentEvalPage = page;

  const container = document.getElementById("teacherIndividualList");
  container.innerHTML = "";

  const start = (page - 1) * EVALS_PER_PAGE;
  const end = start + EVALS_PER_PAGE;
  const pageData = allData.slice(start, end);

  if (!pageData.length) {
    container.innerHTML = `<p class="no-data">No evaluations yet</p>`;
    return;
  }

  pageData.forEach((evalItem, index) => {
    const card = document.createElement("div");
    card.className = "individual-card";
    card.innerHTML = `
      <div class="individual-header">
        <strong>Student #${start + index + 1}</strong>
        <span>${new Date(evalItem.submittedAt).toLocaleString()}</span>
        <span class="badge">Overall: ${evalItem.overallRating ?? "N/A"}</span>
        <button class="view-btn">View</button>
      </div>

      <div class="individual-body" style="display:none">
        ${evalItem.responses.map(r => `
          <div class="response-row">
            <span class="q">${r.questionText}</span>
            <span class="a">${r.value}</span>
          </div>
        `).join("")}
      </div>
    `;
    container.appendChild(card);

    card.querySelector(".view-btn").onclick = () => {
      const body = card.querySelector(".individual-body");
      body.style.display =
        body.style.display === "none" ? "block" : "none";
    };
  });

  renderPagination(allData.length);
}

function renderPagination(total) {
  const pages = Math.ceil(total / EVALS_PER_PAGE);
  if (pages <= 1) return;

  const container = document.getElementById("teacherIndividualList");
  const pager = document.createElement("div");
  pager.className = "pagination";

  for (let i = 1; i <= pages; i++) {
    const btn = document.createElement("button");
    btn.className = i === currentEvalPage ? "page-btn active" : "page-btn";
    btn.innerText = i;
    btn.onclick = () => renderEvalPage(window._allEvalData, i);
    pager.appendChild(btn);
  }

  container.appendChild(pager);
}

function renderSummaryUI(data) {
    if (!data) {
  console.warn("renderSummaryUI called with null data");
  return;
}


  document.getElementById("teacherTotalEval").innerText =
    data.totalEvaluations;

  document.getElementById("teacherOverallAvg").innerText =
    data.overallAverage;

  const tbody = document.getElementById("teacherParams");
  tbody.innerHTML = "";

  const labels = [];
  const values = [];

  data.parameterAverages.forEach(p => {
    labels.push(p.questionText);
    values.push(p.average);

    const cls =
      p.average < 3 ? "rating-low" :
      p.average < 4 ? "rating-mid" :
      "rating-high";

    tbody.innerHTML += `
      <tr>
        <td>${p.questionText}</td>
        <td class="${cls}">${p.average}</td>
      </tr>
    `;
  });

  renderTeacherChart(labels, values);
}

 function renderTeacherChart(labels, values) {
  const ctx = document.getElementById("teacherChart");

  if (teacherChart) teacherChart.destroy();

  // 🔹 Create visual-safe values (0 → 0.2 so bar is visible)
  const visualValues = values.map(v => v === 0 ? 0.1 : v);

  // 🔹 Color bars (zero = red, others = blue)
  const barColors = values.map(v =>
    v === 0 ? "#ff5c5c" : "#4c6fff"
  );

  teacherChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.map(() => ""), // ❌ hide question text under bars
      datasets: [{
        label: "Average Rating",
        data: visualValues,
        backgroundColor: barColors,
        borderRadius: 8,
        barThickness: 48
      }]
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
              title: ctx => {
              // 🔥 Show question on hover
              return labels[ctx[0].dataIndex];
            },
            label: ctx => {
                
              const realValue = values[ctx.dataIndex];
              return `Average: ${realValue}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { display: false },   // ❌ hide x labels
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          max: 5,
          ticks: { stepSize: 1 },
          grid: { color: "rgba(76,111,255,0.15)" }
        }
      }
    }
  });
}


window.initTeacherEvaluationHistory = initTeacherEvaluationHistory;
 