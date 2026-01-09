// sessionplan.js
function initSessionPlan() {
    // Check if session modal exists on this page
    const sessionModal = document.getElementById("sessionModal");
    if (!sessionModal) return; // Not on session plan page, exit

    /** -------------------------
     * ELEMENTS
     * ------------------------- */
    const nextBtn = document.getElementById("addDayBtn");
    const prevBtn = document.getElementById("prevDayBtn");
    const saveBtn = document.getElementById("savePlanBtn");

    const dayLabel = sessionModal.querySelector(".day-label");
    const topicInput = sessionModal.querySelector(".day-topic");
    const descInput = sessionModal.querySelector(".day-desc");
    const methodSelect = sessionModal.querySelector(".day-method"); // NEW

    const facultyInput = document.getElementById("faculty");
    const courseInput = document.getElementById("course");
    const semesterInput = document.getElementById("semester");

    // If any key element is missing, stop execution
    if (!nextBtn || !prevBtn || !saveBtn || !dayLabel || !topicInput || !descInput || !methodSelect) return;

    /** -------------------------
     * DAY DATA
     * ------------------------- */
    let currentDay = 1;
    const maxDays = 30;
    const dayData = {}; // store topic + description + method per day

    /** -------------------------
     * SAVE AND LOAD DAYS
     * ------------------------- */
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

    /** -------------------------
     * DAY NAVIGATION
     * ------------------------- */
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

    /** -------------------------
     * SAVE SESSION PLAN
     * ------------------------- */
   saveBtn.onclick = () => {
    saveCurrentDay();

    const faculty = facultyInput?.value.trim();
    const course = courseInput?.value.trim();
    const semester = semesterInput?.value.trim();

    if (!faculty || !course || !semester) {
        alert("Please fill Faculty, Course, and Semester");
        return;
    }

    // Create days array with proper field name "day" (not "dayNumber")
    const days = [];
    for (const dayKey in dayData) {
        if (dayData.hasOwnProperty(dayKey)) {
            const dayNum = parseInt(dayKey, 10);
            if (!isNaN(dayNum)) {
  // In sessionplan.js - Find the saveBtn.onclick function and UPDATE this part:
days.push({
    day_number: dayNum,  // Change this to day_number to match database column
    topic: dayData[dayKey].topic,
    description: dayData[dayKey].description,
    method: dayData[dayKey].method
});
            }
        }
    }

    // Sort days by day number to maintain order
    days.sort((a, b) => a.day - b.day);

    const payload = {
        faculty,
        course,
        semester,
        days: days
    };

    console.log("Payload to send:", payload);

    fetch("/api/session-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then((data) => {
        console.log("Response from server:", data);
        alert("Session Plan Saved Successfully");
        loadPublishedPlans();
    })
    .catch(err => {
        console.error(err);
        alert("Failed to save session plan");
    });
};

    /** -------------------------
     * LOAD PUBLISHED PLANS
     * ------------------------- */
// In sessionplan.js - update ONLY the click handler in loadPublishedPlans()
function loadPublishedPlans() {
    const tbody = document.querySelector(".session-table tbody");
    if (!tbody) return;

    fetch("/api/session-plans")
        .then(res => res.json())
        .then(data => {
            tbody.innerHTML = "";

            data.forEach(plan => {
                const tr = document.createElement("tr");
                const date = plan.createdDate ? new Date(plan.createdDate).toLocaleDateString() : '';
                const method = plan.days && plan.days.length ? plan.days[0].method : "Lecture";

                tr.innerHTML = `
                    <td>${plan.course}</td>
                    <td>${plan.semester}</td>
                    <td>${date}</td>
                    <td>${method}</td>
                `;

                tr.style.cursor = "pointer";
                tr.title = "Click to view details";
                
                // FIX: Just one line change here
                tr.addEventListener("click", () => {
                    // Load session-details page with ID
                    loadPage(`/pages/session-details.html?id=${plan.id}`);
                });

                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error(err);
        });
}

    /** -------------------------
     * INITIALIZE
     * ------------------------- */
    loadDay(currentDay);
    loadPublishedPlans();
}
