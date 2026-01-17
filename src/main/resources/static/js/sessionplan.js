// sessionplan.js - CLEAN & MINIMAL VERSION
function initSessionPlan() {
    const sessionModal = document.getElementById("sessionModal");
    if (!sessionModal) return;

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

    if (!nextBtn || !prevBtn || !saveBtn || !dayLabel || !topicInput || !descInput || !methodSelect) return;

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

    // Teacher Info
    function getCurrentTeacher() {
        if (window.currentUser) {
            const user = { ...window.currentUser };
            if (!user.teacherId && user.userId && user.role === 'TEACHER') {
                user.teacherId = user.userId;
            }
            return user;
        }
        
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (!user.teacherId && user.userId && user.role === 'TEACHER') {
                user.teacherId = user.userId;
            }
            return user;
        }
        
        const topTitle = document.querySelector(".top-title");
        if (topTitle && topTitle.dataset.username) {
            return {
                username: topTitle.dataset.username,
                role: topTitle.dataset.role,
                userId: topTitle.dataset.userId || '0',
                teacherId: topTitle.dataset.teacherId || topTitle.dataset.userId || '0'
            };
        }
        
        return null;
    }

    // Fetch teacher courses
    async function fetchTeacherCourses(teacherId) {
        facultySelect.innerHTML = '<option value="">Loading your courses...</option>';
        facultySelect.disabled = true;
        
        try {
            const response = await fetch(`/api/admin/teachers/${teacherId}/courses-for-session`);
            if (!response.ok) throw new Error('Failed to fetch courses');
            const courses = await response.json();
            processCourses(courses);
        } catch (error) {
            console.error('Error fetching courses:', error);
            alert('Failed to load your assigned courses.');
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
                programsMap[programId] = { id: programId, name: programName, semesters: {} };
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
        facultySelect.addEventListener('change', function() {
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
        
        semesterSelect.addEventListener('change', function() {
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
        addSessionBtn.addEventListener('click', async function() {
            currentTeacher = getCurrentTeacher();
            if (!currentTeacher) {
                alert('Please login as a teacher to create session plans');
                return;
            }
            
            if (!currentTeacher.teacherId && currentTeacher.userId) {
                currentTeacher.teacherId = currentTeacher.userId;
            }
            
            resetForm();
            await fetchTeacherCourses(currentTeacher.teacherId);
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

    // Save Session Plan - SIMPLIFIED
    saveBtn.onclick = () => {
        saveCurrentDay();
        
        const courseElement = document.getElementById('course');
        if (courseElement !== courseSelect) {
            courseSelect = courseElement;
        }
        
        const facultyValue = facultySelect.value;
        const semesterValue = semesterSelect.value;
        const courseValue = courseSelect.value;
        
        if (!facultyValue || !semesterValue || !courseValue) {
            alert("Please select Program, Semester, and Course");
            return;
        }

        if (!currentTeacher) {
            alert("Unable to identify teacher. Please refresh the page.");
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
            alert("Please add at least one day with a topic");
            return;
        }
        
        days.sort((a, b) => a.day_number - b.day_number);

        // Create payload
        const payload = {
            teacherId: parseInt(currentTeacher.teacherId || currentTeacher.userId),
            programId: parseInt(facultyValue),
            semesterId: parseInt(semesterValue),
            courseId: parseInt(courseValue),
            days: days
        };

        console.log("Saving session plan:", payload);

        // Show loading
        const originalText = saveBtn.textContent;
        saveBtn.textContent = "Saving...";
        saveBtn.disabled = true;

        // Send to server
        fetch("/api/session-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            return response.json();
        })
        .then((data) => {
            if (data && data.id) {
                alert("Session Plan Saved Successfully!");
                modalOverlay.style.display = 'none';
                resetForm();
                loadPublishedPlans();
            } else {
                throw new Error("Invalid response from server");
            }
        })
        .catch(err => {
            console.error("Save error:", err);
            alert(`Failed to save session plan: ${err.message}`);
        })
        .finally(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        });
    };

    // Load Published Plans
    function loadPublishedPlans() {
        const tbody = document.querySelector(".session-table tbody");
        if (!tbody) return;

        if (!currentTeacher) currentTeacher = getCurrentTeacher();
        if (!currentTeacher) {
            tbody.innerHTML = `<tr><td colspan="4">Please login as a teacher</td></tr>`;
            return;
        }

        const teacherId = currentTeacher.teacherId || currentTeacher.userId;
        if (!teacherId) {
            tbody.innerHTML = `<tr><td colspan="4">Unable to identify teacher ID</td></tr>`;
            return;
        }

        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="loading-cell">
                    <div class="loading-spinner"></div>
                    Loading ${currentTeacher.username}'s session plans...
                </td>
            </tr>
        `;

        fetch(`/api/session-plans/teacher/${teacherId}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(plans => {
                displayPlans(plans);
            })
            .catch(err => {
                console.error('Error loading plans:', err);
                displayPlans([]);
            });

        function displayPlans(plans) {
            tbody.innerHTML = "";
            
            if (!plans || plans.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="empty-state">
                            <div class="empty-content">
                                <i class="fas fa-calendar-plus"></i>
                                <div>
                                    <h4>No Session Plans Yet</h4>
                                    <p><strong>${currentTeacher.username}</strong> hasn't created any session plans.</p>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            plans.forEach(plan => {
                const tr = document.createElement("tr");
                
                // Extract data
                const courseName = plan.course?.name || 'Unknown Course';
                const semesterName = plan.semester?.name || 'Unknown Semester';
                const date = plan.createdDate || '';
                const formattedDate = date ? new Date(date).toLocaleDateString() : '';
                const method = plan.days?.[0]?.method || "Lecture";
                
                tr.innerHTML = `
                    <td>${courseName}</td>
                    <td>${semesterName}</td>
                    <td>${formattedDate}</td>
                    <td><span class="method-badge">${method}</span></td>
                `;
                
                tr.style.cursor = "pointer";
                tr.title = "Click to view details";
                
                tr.addEventListener("click", () => {
                    if (plan.id) {
                        if (typeof loadPage === 'function') {
                            loadPage(`/pages/session-details.html?id=${plan.id}`);
                        } else {
                            window.location.href = `/pages/session-details.html?id=${plan.id}`;
                        }
                    }
                });
                
                tbody.appendChild(tr);
            });
        }
    }

    // Initialize
    loadDay(currentDay);
    currentTeacher = getCurrentTeacher();
    loadPublishedPlans();
}
document.addEventListener("DOMContentLoaded", () => {
    protectPage(["STUDENT", "TEACHER", "ADMIN"]);

    // Hide Add Session button for STUDENT + ADMIN
    if (window.currentUser?.role !== "TEACHER") {
        document.querySelector(".addsession")?.remove();
    }

    initSessionPlan();
});
window.initSessionPlan = initSessionPlan;