let analyticsTeacher = null;
let analyticsChart = null;

/* ================= LOAD TEACHERS ================= */


function initAdminEvaluationAnalytics() {
    console.log("Initializing Admin Evaluation Analytics page");

    const container = document.getElementById("analyticsTeacherContainer");
    if (!container) return;

    // Reset UI
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading teachers...</p>
        </div>
    `;

    loadAnalyticsTeachers();
}
function viewTeacherHistoryDashboard(teacherId, teacherName) {
  // Save context for history page
  sessionStorage.setItem("adminViewingTeacherId", teacherId);
  sessionStorage.setItem("adminViewingTeacherName", teacherName);

  // Load history page dynamically into dashboard
  if (typeof loadPage === "function") {
    loadPage("/pages/teacher-evaluation-history.html");
  } else {
    console.error("loadPage() not found");
  }
}

async function loadAnalyticsTeachers() {
    const container = document.getElementById("analyticsTeacherContainer");

    try {
        const res = await fetch("/api/admin/evaluations/teachers?mode=both");

        const teachers = await res.json();

        container.innerHTML = teachers.map(t => `
            <div class="eval-card">
                <div class="aavatar">
                    <i class="fas fa-user"></i>
                </div>
                <h4>${t.teacherName}</h4>

               <button onclick='viewTeacherHistoryDashboard(
  ${t.teacherId},
  "${t.teacherName.replace(/"/g, '&quot;')}"
)'>
  View Evaluation
</button>

            </div>
        `).join("");

    } catch (e) {
        console.error(e);
        container.innerHTML = `<p>Error loading teachers</p>`;
    }
}


window.initAdminEvaluationAnalytics = initAdminEvaluationAnalytics;