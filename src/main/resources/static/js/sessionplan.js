async function getCurrentUser() {
  try {
    const res = await fetch("/admin/api/userinfo");
    if (!res.ok) throw new Error("Failed to load user info");

    const user = await res.json();
    if (!user.role) return null;

    return {
      role: user.role,
      username: user.username || user.fullName || "User",

      // teacher
      teacherId: user.teacherDbId || null,

      // student
      studentId: user.studentId || null,
      programId: user.programId || null,
      semesterId: user.semesterId || null
    };
  } catch (e) {
    console.error("Failed to fetch user info:", e);
    return null;
  }
}

function initSessionPlan() {
    const sessionModal = document.getElementById("sessionModal");
    if (!sessionModal)
        return;

    // Elements
    const nextBtn = document.getElementById("addDayBtn");
    const prevBtn = document.getElementById("prevDayBtn");
    const saveBtn = document.getElementById("savePlanBtn");
    const dayLabel = sessionModal.querySelector(".day-label");
    const topicInput = sessionModal.querySelector(".day-topic");
    const descInput = sessionModal.querySelector(".day-desc");
    const methodSelect = sessionModal.querySelector(".day-method");
    const facultySelect = document.getElementById("faculty");
    const semesterSelect = document.getElementById("semester");
    let courseSelect = document.getElementById("course");

    if (!nextBtn || !prevBtn || !saveBtn || !dayLabel || !topicInput || !descInput || !methodSelect)
        return;

    // State
    let currentDay = 1;
    const maxDays = 30;
    let dayData = {};
    let currentTeacher = null;

    // Day Management
    function saveCurrentDay() {
        dayData[currentDay] = {
            topic: topicInput.value,
            description: descInput.value,
            method: methodSelect.value
        };
    }

    function loadDay(day) {
        dayLabel.innerText = `Day ${day}`;
        topicInput.value = dayData[day]?.topic || "";
        descInput.value = dayData[day]?.description || "";
        methodSelect.value = dayData[day]?.method || "Lecture";
        descInput.placeholder = `Session description for Day ${day}`;
        prevBtn.disabled = day === 1;
    }

    nextBtn.onclick = () => {
        saveCurrentDay();
        if (currentDay < maxDays) {
            currentDay++;
            loadDay(currentDay);
        }
    };

    prevBtn.onclick = () => {
        saveCurrentDay();
        if (currentDay > 1) {
            currentDay--;
            loadDay(currentDay);
        }
    };

   


    // Fetch teacher courses
    async function fetchTeacherCourses(teacherId) {
        facultySelect.innerHTML = '<option value="">Loading your courses...</option>';
        facultySelect.disabled = true;

        try {
            const response = await fetch(`/api/admin/teachers/${teacherId}/courses-for-session`);
            if (!response.ok)
                throw new Error('Failed to fetch courses');
            const courses = await response.json();
            processCourses(courses);
        } catch (error) {
            console.error('Error fetching courses:', error);
            showMesssage("Failed to load your assigned courses.", "error");
            setupStaticOptions();
        }
    }

    function processCourses(courses) {
        if (courses && courses.length > 0) {
            organizeAndPopulateCourses(courses);
        } else {
            showNoCoursesMessage();
        }
    }

    function organizeAndPopulateCourses(courses) {
        const programsMap = {};

        courses.forEach((course) => {
            let semesterId = 1, semesterName = 'Unknown Semester';
            let programId = 1, programName = 'Unknown Program';

            if (course.semester) {
                semesterId = course.semester.id || semesterId;
                semesterName = course.semester.name || semesterName;

                if (course.semester.program) {
                    programId = course.semester.program.id || programId;
                    programName = course.semester.program.name || programName;
                }
            }

            if (!programsMap[programId]) {
                programsMap[programId] = {id: programId, name: programName, semesters: {}};
            }

            if (!programsMap[programId].semesters[semesterId]) {
                programsMap[programId].semesters[semesterId] = {
                    id: semesterId,
                    name: semesterName,
                    courses: []
                };
            }

            programsMap[programId].semesters[semesterId].courses.push({
                id: course.id,
                code: course.code,
                name: course.name,
                fullName: `${course.code} - ${course.name}`
            });
        });

        window.teacherCoursesGrouped = programsMap;
        populateFacultyDropdown(programsMap);
    }

    function populateFacultyDropdown(programsMap) {
        facultySelect.innerHTML = '<option value="">-- Select Your Program --</option>';
        semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';

        resetCourseSelect();

        Object.keys(programsMap).forEach(programId => {
            const program = programsMap[programId];
            const option = document.createElement('option');
            option.value = program.id;
            option.textContent = program.name;
            facultySelect.appendChild(option);
        });

        facultySelect.disabled = false;
        setupCascadingDropdowns();
    }

    function resetCourseSelect() {
        const parent = courseSelect.parentElement;
        if (courseSelect.tagName === 'SELECT') {
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.id = 'course';
            newInput.className = 'form-control';
            newInput.placeholder = 'Select Program and Semester first';
            newInput.disabled = true;
            parent.replaceChild(newInput, courseSelect);
            courseSelect = newInput;
        } else {
            courseSelect.value = '';
            courseSelect.placeholder = 'Select Program and Semester first';
            courseSelect.disabled = true;
        }
    }

    function setupCascadingDropdowns() {
        facultySelect.addEventListener('change', function () {
            const programId = this.value;
            semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
            semesterSelect.disabled = !programId;
            resetCourseSelect();

            if (programId && window.teacherCoursesGrouped[programId]) {
                const program = window.teacherCoursesGrouped[programId];
                Object.values(program.semesters).forEach(semester => {
                    const option = document.createElement('option');
                    option.value = semester.id;
                    option.textContent = semester.name;
                    semesterSelect.appendChild(option);
                });
            }
        });

        semesterSelect.addEventListener('change', function () {
            const programId = facultySelect.value;
            const semesterId = this.value;

            if (programId && semesterId && window.teacherCoursesGrouped[programId]?.semesters[semesterId]) {
                const semester = window.teacherCoursesGrouped[programId].semesters[semesterId];
                const parent = courseSelect.parentElement;
                const newSelect = document.createElement('select');
                newSelect.id = 'course';
                newSelect.className = 'form-control';
                newSelect.innerHTML = '<option value="">-- Select Course --</option>';

                semester.courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.fullName;
                    newSelect.appendChild(option);
                });

                parent.replaceChild(newSelect, courseSelect);
                courseSelect = newSelect;
                courseSelect.disabled = false;
            } else {
                resetCourseSelect();
            }
        });
    }

    function showNoCoursesMessage() {
        facultySelect.innerHTML = '<option value="">No courses assigned</option>';
        facultySelect.disabled = true;
        semesterSelect.disabled = true;
        courseSelect.disabled = true;
    }

    function setupStaticOptions() {
        facultySelect.disabled = false;
        semesterSelect.disabled = false;
        facultySelect.innerHTML = `
            <option value="">-- Select Faculty --</option>
            <option value="1">BE Computer</option>
            <option value="2">BE Civil</option>
        `;
        semesterSelect.innerHTML = `
            <option value="">Select Semester</option>
            <option value="1">Semester I</option>
            <option value="2">Semester II</option>
        `;
        resetCourseSelect();
        courseSelect.placeholder = 'Enter Course';
        courseSelect.disabled = false;
    }

    // Modal Handling
    const addSessionBtn = document.querySelector('.addsession');
    const modalOverlay = document.getElementById('sessionModal');
    const modalClose = document.querySelector('.modal-close');

    if (addSessionBtn) {
        addSessionBtn.addEventListener('click', async function () {

           const user = await getCurrentUser();

if (user?.role !== "TEACHER" || !user.teacherId) {
  showMessage("Please login as a teacher to create session plans.", "error");
  return;
}

currentTeacher = user;


            if (!currentTeacher) {
                showMessage("Please login as a teacher to create session plans.", "error");
                return;
            }

            resetForm();
            await fetchTeacherCourses(currentTeacher.teacherId);   // 🔥 now correct ID
            modalOverlay.style.display = 'flex';
        });

    }

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            resetForm();
        });
    }

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
            resetForm();
        }
    });

    function resetForm() {
        facultySelect.innerHTML = '<option value="">-- Select Program --</option>';
        semesterSelect.innerHTML = '<option value="">-- Select Program First --</option>';
        semesterSelect.disabled = true;
        resetCourseSelect();
        currentDay = 1;
        dayData = {};
        loadDay(currentDay);
    }
    async function checkSessionPlanExists(programId, semesterId, courseId) {
        const res = await fetch(
                `/api/session-plans/exists?programId=${programId}&semesterId=${semesterId}&courseId=${courseId}`
                );
        return res.ok ? await res.json() : false;
    }


    // Save Session Plan - SIMPLIFIED
    saveBtn.onclick = async () => {
        saveCurrentDay();

        const courseElement = document.getElementById('course');
        if (courseElement !== courseSelect) {
            courseSelect = courseElement;
        }

        const facultyValue = facultySelect.value;
        const semesterValue = semesterSelect.value;
        const courseValue = courseSelect.value;

        if (!facultyValue || !semesterValue || !courseValue) {
            showMessage("Please fill all required fields!", "error");

            return;
        }

        if (!currentTeacher) {
            showMessage("Unable to identify teacher. Please refresh the page.", "error");

            return;
        }

        // Create days array
        const days = [];
        for (const [dayKey, data] of Object.entries(dayData)) {
            const dayNum = parseInt(dayKey);
            if (!isNaN(dayNum) && data.topic) {
                days.push({
                    day_number: dayNum,
                    topic: data.topic || '',
                    description: data.description || '',
                    method: data.method || 'Lecture'
                });
            }
        }

        if (days.length === 0) {
            showMessage("Please add at least one session day with a topic.", "error");

            return;
        }

        days.sort((a, b) => a.day_number - b.day_number);

        // Create payload
        const teacherId = parseInt(currentTeacher.teacherId || currentTeacher.userId);
        const programId = parseInt(facultyValue);
        const semesterId = parseInt(semesterValue);

// 🔒 CHECK BEFORE SAVE
        const exists = await checkSessionPlanExists(
                programId,
                semesterId,
                parseInt(courseValue)
                );

        if (exists) {
            showMessage(
                    "Session plan already exists for this Program, Semester and Course.",
                    "error"
                    );
            return;
        }



// ✅ SAFE TO SAVE
        const payload = {
            teacherId,
            programId,
            semesterId,
            courseId: parseInt(courseValue),
            days
        };


        console.log("Saving session plan:", payload);

        // Show loading
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;

        // Send to server
        fetch("/api/session-plans", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        })
                .then(response => {
                    if (!response.ok)
                        throw new Error(`Server error: ${response.status}`);
                    return response.json();
                })
                .then((data) => {
                    if (data && data.id) {
                        showMessage("Session Plan Saved Successfully!", "success");

                        modalOverlay.style.display = 'none';
                        resetForm();
                        loadPublishedPlans();
                    } else {
                        throw new Error("Invalid response from server");
                    }
                })
                .catch(err => {
                    console.error("Save error:", err);
//                    alert(`Failed to save session plan: ${err.message}`);
                    showMessage("Failed to save session plan. Please try again.", "error");

                })
                .finally(() => {
                    saveBtn.textContent = originalText;
                    saveBtn.disabled = false;
                });
    };

function attachSearchFilter(plans) {
  const input = document.getElementById("sessionSearch");
  if (!input) return;

  input.oninput = () => {
    const term = input.value.toLowerCase();

    const filtered = plans.filter(p =>
      (p.program?.name || "").toLowerCase().includes(term) ||
      (p.course?.name || "").toLowerCase().includes(term) ||
      (p.semester?.name || "").toLowerCase().includes(term) ||
      (p.teacher?.fullName || "").toLowerCase().includes(term)
    );

    renderSessionPlans(filtered);
  };
}


async function loadPublishedPlans() {

  const tbody = document.querySelector(".session-table tbody");
  if (!tbody) return;

  const currentUser = await getCurrentUser();
window._currentUser = currentUser;   // 🔥 REQUIRED

  if (!currentUser) {
    tbody.innerHTML = `<tr><td colspan="5">Unauthorized</td></tr>`;
    return;
  }

  let apiUrl = "";

  if (currentUser.role === "TEACHER") {
    apiUrl = `/api/session-plans/teacher/${currentUser.teacherId}/visible`;
  }

  else if (currentUser.role === "ADMIN") {
    apiUrl = `/api/session-plans`;
  }

  else if (currentUser.role === "STUDENT") {
    if (!currentUser.programId || !currentUser.semesterId) {
      tbody.innerHTML = `<tr><td colspan="5">Student profile incomplete</td></tr>`;
      return;
    }

    apiUrl = `/api/session-plans/program/${currentUser.programId}/semester/${currentUser.semesterId}`;
  }

  else {
    tbody.innerHTML = `<tr><td colspan="5">Unauthorized</td></tr>`;
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="5" class="loading-cell">
        Loading session plans...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const plans = await res.json();
    window._allSessionPlans = plans;

    displayPlans(plans);

    attachSearchFilter(plans); // 🔥 ALL ROLES

  } catch (err) {
    console.error("Error loading plans:", err);
    displayPlans([]);
  }

  function displayPlans(plans) {
    tbody.innerHTML = "";

    if (!plans || plans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            No Session Plans Found
          </td>
        </tr>
      `;
      return;
    }

    plans.forEach(plan => {

      const programName  = plan.program?.name || "—";
      const semesterName = plan.semester?.name || "—";
      const courseName   = plan.course?.name || "—";
      const teacherName  = plan.teacher?.fullName || "—";
      const date         = plan.createdDate
        ? new Date(plan.createdDate).toLocaleDateString()
        : "—";

      const showTeacherCol = currentUser.role !== "TEACHER";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${programName}</td>
        <td>${semesterName}</td>
        <td>${courseName}</td>
        ${showTeacherCol ? `<td>${teacherName}</td>` : ``}
        <td>${date}</td>
      `;

      tr.onclick = () => {
        loadPage(`/pages/session-details.html?id=${plan.id}`);
      };

      tbody.appendChild(tr);
    });
  }
}
function renderSessionPlans(plans) {

  const tbody = document.querySelector(".session-table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!plans || plans.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          No Session Plans Found
        </td>
      </tr>
    `;
    return;
  }

  plans.forEach(plan => {

    const programName  = plan.program?.name || "—";
    const semesterName = plan.semester?.name || "—";
    const courseName   = plan.course?.name || "—";
    const teacherName  = plan.teacher?.fullName || "—";
    const date         = plan.createdDate
      ? new Date(plan.createdDate).toLocaleDateString()
      : "—";

    const showTeacherCol = window._currentUser?.role !== "TEACHER";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${programName}</td>
      <td>${semesterName}</td>
      <td>${courseName}</td>
      ${showTeacherCol ? `<td>${teacherName}</td>` : ``}
      <td>${date}</td>
    `;

    tr.onclick = () => {
      loadPage(`/pages/session-details.html?id=${plan.id}`);
    };

    tbody.appendChild(tr);
  });
}


  // Initialize
loadDay(currentDay);

(async () => {
  const user = await getCurrentUser();
  window._currentUser = user;

  await loadPublishedPlans();

  // 🔥 HIDE teacher column ONLY for TEACHER
  if (window._currentUser?.role === "TEACHER") {
    document.querySelectorAll(".teacher-col").forEach(el => el.remove());
  }

  // 🔍 Search box ONLY for ADMIN
  if (window._currentUser?.role !== "ADMIN") {
    document.getElementById("sessionSearchWrap")?.remove();
  }

})();



}
document.addEventListener("DOMContentLoaded", async () => {

  protectPage(["STUDENT", "TEACHER", "ADMIN"]);

  const user = await getCurrentUser();

  if (user?.role !== "TEACHER") {
    document.querySelector(".addsession")?.remove();
  }

  initSessionPlan();
});


window.initSessionPlan = initSessionPlan;

function showMessage(msg, type) {
    const box = document.getElementById("formMessage");
    box.textContent = msg;
    box.className = `message-container ${type}`;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 3000);
}
