console.log("student-evaluation-history.js loaded");

function initStudentEvaluationHistory() {

    const weeksBox = document.getElementById("evaluationWeeks");
    const detailsBox = document.getElementById("evaluationDetails");

    if (weeksBox) {
        weeksBox.innerHTML = `<p class="no-data">Loading evaluation history...</p>`;
    }

    if (detailsBox) {
        detailsBox.innerHTML = `
            <p class="no-data">
                Select a week and teacher to view evaluation details
            </p>
        `;
    }

    fetch("/admin/api/userinfo")
        .then(res => res.json())
        .then(user => {
            if (!user?.studentId) {
                console.warn("Student ID not found");
                return;
            }
            loadEvaluationWeeksStandalone(user.studentId);
        })
        .catch(err => {
            console.error(err);
            if (weeksBox) {
                weeksBox.innerHTML = `<p class="no-data">Failed to load evaluation history</p>`;
            }
        });
}


/* ================= LOAD WEEKS ================= */

async function loadEvaluationWeeksStandalone(studentId) {
  const holder = document.getElementById("evaluationWeeks");

  try {
    const res = await fetch(
      `/api/student-profile/${studentId}/evaluation-weeks`
    );
    const data = await res.json();

    if (!data.success || !data.weeks?.length) {
      holder.innerHTML = `<p class="no-data">No evaluations found</p>`;
      return;
    }

    holder.innerHTML = data.weeks.map(w => `
      <details class="week-tree">
        <summary>
          <strong>Week ${w.weekNo}</strong>
          <span>${w.weekStart}</span>
        </summary>
        <div class="week-teachers"
             data-week="${w.weekStart}">
          <p class="no-data">Click to load teachers...</p>
        </div>
      </details>
    `).join("");

    holder.querySelectorAll("details").forEach(d => {
      d.addEventListener("toggle", () => {
        if (d.open) {
          const box = d.querySelector(".week-teachers");
          loadWeekTeachersStandalone(studentId, box.dataset.week, box);
        }
      });
    });

  } catch (e) {
    console.error(e);
    holder.innerHTML = `<p class="no-data">Failed to load history</p>`;
  }
}

/* ================= LOAD TEACHERS ================= */

async function loadWeekTeachersStandalone(studentId, weekStart, container) {
  try {
    const res = await fetch(
      `/api/student-profile/${studentId}/evaluations?weekStart=${weekStart}`
    );
    const data = await res.json();

    if (!data.success || !data.evaluations?.length) {
      container.innerHTML = `<p class="no-data">No evaluations</p>`;
      return;
    }

    container.innerHTML = data.evaluations.map(ev => `
      <div class="course-item"
           onclick="loadEvaluationDetails(${ev.evaluationId},
                    '${ev.teacherName}',
                    '${ev.courseName}',
                    '${ev.submittedAt || '-'}')">
        <strong>${ev.teacherName}</strong>
        <div>${ev.courseName || ''}</div>
      </div>
    `).join("");

  } catch (e) {
    console.error(e);
    container.innerHTML = `<p class="no-data">Failed to load teachers</p>`;
  }
}

/* ================= LOAD DETAILS ================= */

function loadEvaluationDetails(evaluationId, teacher, course, submittedAt) {
  const box = document.getElementById("evaluationDetails");

  box.innerHTML = `<p class="no-data">Loading...</p>`;

  fetch(`/api/evaluation/responses/evaluation/${evaluationId}`)
    .then(res => res.json())
    .then(list => {
      if (!list || !list.length) {
        box.innerHTML = `<p class="no-data">No responses found</p>`;
        return;
      }

      box.innerHTML = `
        <div class="evaluation-meta">
          <div><strong>Teacher:</strong> ${teacher}</div>
          <div><strong>Course:</strong> ${course}</div>
          <div><strong>Submitted:</strong> ${submittedAt}</div>
        </div>

        ${list.map(r => `
          <div class="response-item">
            <strong>${r.questionText}</strong>
            <div>Answer: ${r.responseValue}</div>
          </div>
        `).join("")}
      `;
    })
    .catch(() => {
      box.innerHTML = `<p class="no-data">Failed to load details</p>`;
    });
}

/* AUTO INIT */
window.initStudentEvaluationHistory = initStudentEvaluationHistory;
