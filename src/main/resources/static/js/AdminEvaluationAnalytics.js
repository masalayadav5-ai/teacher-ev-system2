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

async function loadAnalyticsTeachers() {
    const container = document.getElementById("analyticsTeacherContainer");

    try {
        const res = await fetch("/api/admin/evaluations/teachers");
        const teachers = await res.json();

        container.innerHTML = teachers.map(t => `
            <div class="eval-card">
                <div class="aavatar">
                    <i class="fas fa-user"></i>
                </div>
                <h4>${t.teacherName}</h4>

                <button onclick='openAnalytics(
                    ${t.teacherId},
                    "${t.teacherName}",
                    ${JSON.stringify(t.courses)}
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
 /* ================= OPEN MODAL ================= */
function openAnalytics(teacherId, teacherName, courses) {
    analyticsTeacher = { teacherId, courses };

    document.getElementById("analyticsTeacherName").innerText =
        `Evaluation Analytics – ${teacherName}`;

    document.getElementById("analyticsModal").classList.add("show");

    const courseSelect = document.getElementById("analyticsCourseSelect");
    courseSelect.innerHTML = `<option value="">-- Select Course --</option>`;

    courses.forEach(c => {
        courseSelect.innerHTML += `
            <option value="${c.courseId}">
                ${c.courseName}
            </option>
        `;
    });

    document.getElementById("analyticsWeekSelect").innerHTML =
        `<option value="">-- Select Week --</option>`;

    document.getElementById("analyticsSummary").style.display = "none";
}

/* ================= CLOSE MODAL ================= */
function closeAnalyticsModal() {
    document.getElementById("analyticsModal").classList.remove("show");

    if (analyticsChart) {
        analyticsChart.destroy();
        analyticsChart = null;
    }
}

/* ================= LOAD WEEKS ================= */
async function loadAnalyticsWeeks() {
    const courseId = document.getElementById("analyticsCourseSelect").value;
    if (!courseId) return;

    const res = await fetch(
        `/api/admin/evaluations/teacher/${analyticsTeacher.teacherId}/course/${courseId}/weeks`
    );

    const weeks = await res.json();
    const weekSelect = document.getElementById("analyticsWeekSelect");

    weekSelect.innerHTML = `<option value="">-- Select Week --</option>`;
    weeks.forEach(w => {
        weekSelect.innerHTML += `<option value="${w}">${w}</option>`;
    });
}

/* ================= LOAD SUMMARY ================= */
async function loadAnalyticsSummary() {
    const courseId = document.getElementById("analyticsCourseSelect").value;
    const week = document.getElementById("analyticsWeekSelect").value;
    if (!week) return;

    const res = await fetch(
        `/api/admin/evaluations/teacher/${analyticsTeacher.teacherId}/course/${courseId}/summary?weekStart=${week}`
    );

    const data = await res.json();

    document.getElementById("analyticsSummary").style.display = "block";
    document.getElementById("analyticsTotal").innerText = data.totalEvaluations;
    document.getElementById("analyticsOverall").innerText = data.overallAverage;

    const ul = document.getElementById("analyticsParams");
    ul.innerHTML = "";

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

ul.innerHTML += `
    <tr>
        <td>${p.questionText}</td>
        <td class="${ratingClass}">${p.average}</td>
    </tr>
`;


    });

    renderAnalyticsChart(labels, values);
}

/* ================= CHART ================= */
function renderAnalyticsChart(labels, values) {
    const ctx = document.getElementById("analyticsChart");

    if (analyticsChart) analyticsChart.destroy();

    analyticsChart = new Chart(ctx, {
        type: "bar",
        data: {
            // 🔥 REMOVE long labels from axis
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
}]


        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        display: false   // 🔥 HIDE text under bars
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function (tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            return labels[index]; // 🔥 show full question on hover
                        }
                    }
                },
                legend: {
                    display: true
                }
            }
        }
    });
}

