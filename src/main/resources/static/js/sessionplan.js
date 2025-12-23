function initSessionPlan() {

    let currentDay = 1;
    const maxDays = 30;
    const dayData = {}; // store all days

    const nextBtn = document.getElementById("addDayBtn");
    const prevBtn = document.getElementById("prevDayBtn");
    const saveBtn = document.getElementById("savePlanBtn");

    const dayLabel = document.getElementById("dayLabel");
    const topicInput = document.getElementById("dayTopic");
    const descInput = document.getElementById("dayDesc");
    
//    topicInput.addEventListener("input", saveCurrentDay);  // save field data locally
//    descInput.addEventListener("input", saveCurrentDay);

    if (!nextBtn) return;

    function saveCurrentDay() {
        dayData[currentDay] = {
            topic: topicInput.value,
            description: descInput.value
        };
    }

    function loadDay(day) {
        dayLabel.innerText = `Day ${day}`;
        topicInput.value = dayData[day]?.topic || "";
        descInput.value = dayData[day]?.description || "";
        descInput.placeholder = `Session description for Day ${day}`;
        prevBtn.disabled = day === 1;
    }

    nextBtn.onclick = function () {
        saveCurrentDay();

        if (currentDay < maxDays) {
            currentDay++;
            loadDay(currentDay);
        }
    };

    prevBtn.onclick = function () {
        saveCurrentDay();
        if (currentDay > 1) {
            currentDay--;
            loadDay(currentDay);
        }
    };

    saveBtn.onclick = function () {
        saveCurrentDay();

        const faculty = document.getElementById("faculty").value;
        const course = document.getElementById("course").value;
        const semester = document.getElementById("semester").value;

        if (!faculty || !course || !semester) {
            alert("Please fill Faculty, Course, and Semester");
            return;
        }

        const days = Object.keys(dayData).map(day => ({
            day: Number(day),
            topic: dayData[day].topic,
            description: dayData[day].description
        }));

        console.log({
            faculty,
            course,
            semester,
            days
        });

        alert("Session Plan saved (check console)");
    };
}
