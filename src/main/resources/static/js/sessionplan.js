// sessionplan.js - COMPLETE FIXED VERSION

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
    const methodSelect = sessionModal.querySelector(".day-method");

    const facultySelect = document.getElementById("faculty");
    const courseSelect = document.getElementById("course");
    const semesterSelect = document.getElementById("semester");

    // If any key element is missing, stop execution
    if (!nextBtn || !prevBtn || !saveBtn || !dayLabel || !topicInput || !descInput || !methodSelect) return;

    /** -------------------------
     * DAY DATA
     * ------------------------- */
    let currentDay = 1;
    const maxDays = 30;
    let dayData = {}; // store topic + description + method per day

    /** -------------------------
     * TEACHER DATA
     * ------------------------- */
    let currentTeacher = null;

    /** -------------------------
     * DAY MANAGEMENT FUNCTIONS
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
     * GET TEACHER INFO
     * ------------------------- */
    function getCurrentTeacher() {
        console.log('=== DEBUG: Getting teacher info ===');
        
        // Priority 1: Check window.currentUser from topbar.js
        if (window.currentUser) {
            console.log('Found in window.currentUser:', window.currentUser);
            
            // IMPORTANT: If teacherId is missing but userId exists, use userId as teacherId
            const user = { ...window.currentUser };
            if (!user.teacherId && user.userId && user.role === 'TEACHER') {
                user.teacherId = user.userId;
                console.log('Using userId as teacherId:', user.teacherId);
            }
            
            return user;
        }
        
        // Priority 2: Check localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            console.log('Found in localStorage:', user);
            
            // Same fix for localStorage data
            if (!user.teacherId && user.userId && user.role === 'TEACHER') {
                user.teacherId = user.userId;
            }
            
            return user;
        }
        
        // Priority 3: Extract from topbar
        const topTitle = document.querySelector(".top-title");
        if (topTitle && topTitle.dataset.username) {
            const user = {
                username: topTitle.dataset.username,
                role: topTitle.dataset.role,
                userId: topTitle.dataset.userId || '0',
                teacherId: topTitle.dataset.teacherId || topTitle.dataset.userId || '0'
            };
            
            console.log('Extracted from topbar dataset:', user);
            return user;
        }
        
        console.warn('No teacher info found');
        return null;
    }

    /** -------------------------
     * FETCH TEACHER'S ASSIGNED COURSES
     * ------------------------- */
    async function fetchTeacherCourses(teacherId) {
        console.log(`Fetching courses for teacher ID: ${teacherId}`);
        
        try {
            facultySelect.innerHTML = '<option value="">Loading your courses...</option>';
            facultySelect.disabled = true;
            semesterSelect.disabled = true;
            courseSelect.disabled = true;
            
            // Use userId as teacherId for the API call
            const response = await fetch(`/api/admin/teachers/${teacherId}/courses`);
            
            console.log('API Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.status}`);
            }
            
            const courses = await response.json();
            console.log('Teacher assigned courses:', courses);
            
            if (courses && courses.length > 0) {
                // Process and organize the courses
                organizeAndPopulateCourses(courses);
                
                // Update modal with teacher info
                updateModalWithTeacherInfo(currentTeacher.username, courses.length);
            } else {
                console.log('No courses found for teacher');
                showNoCoursesMessage();
            }
            
        } catch (error) {
            console.error('Error fetching teacher courses:', error);
            showErrorMessage('Failed to load your assigned courses. Please try again.');
            setupStaticOptions(); // Fallback to static options
        }
    }

    /** -------------------------
     * ORGANIZE AND POPULATE COURSES
     * ------------------------- */
    function organizeAndPopulateCourses(courses) {
        // Group courses by program and semester
        const programsMap = {};
        
        courses.forEach(course => {
            // Ensure course has semester and program data
            if (course.semester && course.semester.program) {
                const program = course.semester.program;
                const semester = course.semester;
                
                // Create program entry if not exists
                if (!programsMap[program.id]) {
                    programsMap[program.id] = {
                        id: program.id,
                        name: program.name,
                        semesters: {}
                    };
                }
                
                // Create semester entry if not exists
                if (!programsMap[program.id].semesters[semester.id]) {
                    programsMap[program.id].semesters[semester.id] = {
                        id: semester.id,
                        name: semester.name,
                        courses: []
                    };
                }
                
                // Add course to semester
                programsMap[program.id].semesters[semester.id].courses.push({
                    id: course.id,
                    code: course.code,
                    name: course.name,
                    credits: course.credits,
                    fullName: `${course.code} - ${course.name}`
                });
            }
        });
        
        // Store globally for cascading dropdown
        window.teacherCoursesGrouped = programsMap;
        
        // Populate faculty/program dropdown
        populateFacultyDropdown(programsMap);
    }

    function populateFacultyDropdown(programsMap) {
        // Clear existing options
        facultySelect.innerHTML = '<option value="">-- Select Your Program --</option>';
        semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
        
        // Check if we have programs
        const programIds = Object.keys(programsMap);
        
        if (programIds.length === 0) {
            showNoCoursesMessage();
            return;
        }
        
        // Add program options
        programIds.forEach(programId => {
            const program = programsMap[programId];
            const option = document.createElement('option');
            option.value = program.id;
            option.textContent = program.name;
            facultySelect.appendChild(option);
        });
        
        // Reset course select
        resetCourseSelect();
        
        // Enable faculty select
        facultySelect.disabled = false;
        
        // Setup cascading dropdown events
        setupCascadingDropdowns();
    }

    function resetCourseSelect() {
        // If course is currently a select, reset it to an input
        if (courseSelect.tagName === 'SELECT') {
            const parent = courseSelect.parentElement;
            const newInput = document.createElement('input');
            newInput.type = 'text';
            newInput.id = 'course';
            newInput.className = 'form-control';
            newInput.placeholder = 'Select Program and Semester first';
            newInput.disabled = true;
            parent.replaceChild(newInput, courseSelect);
        } else {
            courseSelect.value = '';
            courseSelect.placeholder = 'Select Program and Semester first';
            courseSelect.disabled = true;
        }
    }

    function setupCascadingDropdowns() {
        // Faculty/Program change
        facultySelect.addEventListener('change', function() {
            const programId = this.value;
            
            // Reset semester and course
            semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
            semesterSelect.disabled = !programId;
            resetCourseSelect();
            
            if (programId && window.teacherCoursesGrouped[programId]) {
                const program = window.teacherCoursesGrouped[programId];
                const semesters = Object.values(program.semesters);
                
                // Populate semesters
                semesters.forEach(semester => {
                    const option = document.createElement('option');
                    option.value = semester.id;
                    option.textContent = semester.name;
                    semesterSelect.appendChild(option);
                });
            }
        });
        
        // Semester change
        semesterSelect.addEventListener('change', function() {
            const programId = facultySelect.value;
            const semesterId = this.value;
            
            if (programId && semesterId && 
                window.teacherCoursesGrouped[programId] && 
                window.teacherCoursesGrouped[programId].semesters[semesterId]) {
                
                const semester = window.teacherCoursesGrouped[programId].semesters[semesterId];
                
                // Change course input to select
                const parent = courseSelect.parentElement;
                const newSelect = document.createElement('select');
                newSelect.id = 'course';
                newSelect.className = 'form-control';
                newSelect.innerHTML = '<option value="">-- Select Course --</option>';
                
                // Add course options
                semester.courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.fullName;
                    option.dataset.courseName = course.name;
                    option.dataset.courseCode = course.code;
                    newSelect.appendChild(option);
                });
                
                // Replace input with select
                parent.replaceChild(newSelect, courseSelect);
                newSelect.disabled = false;
                
            } else {
                resetCourseSelect();
            }
        });
    }

  function updateModalWithTeacherInfo(teacherName, courseCount) {
    // Update modal title
    const modalTitle = document.querySelector('.modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = `Add Session Plan - ${teacherName}`;
    }
    
    // Add teacher info badge
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) {
        console.error('Modal body not found');
        return;
    }
    
    // Remove existing badge
    const existingBadge = modalBody.querySelector('.teacher-info-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    const badge = document.createElement('div');
    badge.className = 'teacher-info-badge';
    badge.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    badge.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">👨‍🏫</div>
            <div>
                <div style="font-weight: bold; font-size: 16px;">${teacherName}</div>
                <div style="font-size: 14px; opacity: 0.9;">${courseCount} courses assigned</div>
            </div>
        </div>
    `;
    
    // Insert at the beginning of modal body, before the form
    const sessionForm = modalBody.querySelector('#sessionForm');
    if (sessionForm) {
        modalBody.insertBefore(badge, sessionForm);
    } else {
        modalBody.insertBefore(badge, modalBody.firstChild);
    }
}

function showNoCoursesMessage() {
    facultySelect.innerHTML = '<option value="">No courses assigned to you</option>';
    facultySelect.disabled = false; // Allow them to see the message
    
    const modalBody = document.querySelector('.modal-body');
    if (!modalBody) {
        console.error('Modal body not found');
        return;
    }
    
    // Remove any existing warning messages first
    const existingWarnings = modalBody.querySelectorAll('.alert.alert-warning, .no-courses-message');
    existingWarnings.forEach(el => el.remove());
    
    const warning = document.createElement('div');
    warning.className = 'alert alert-warning no-courses-message';
    warning.style.margin = '10px 0';
    warning.style.padding = '10px';
    warning.style.backgroundColor = '#fff3cd';
    warning.style.border = '1px solid #ffeaa7';
    warning.style.borderRadius = '4px';
    warning.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>You don't have any courses assigned yet. Please contact administrator.</span>
    `;
    
    // Find the form-row element in your specific HTML structure
    const formRow = modalBody.querySelector('.form-row');
    console.log('Form row found:', formRow);
    
    if (formRow && formRow.parentNode === modalBody) {
        // Insert before the form-row
        modalBody.insertBefore(warning, formRow);
    } else if (formRow) {
        // Form row exists but might be in a different parent
        formRow.parentNode.insertBefore(warning, formRow);
    } else {
        // Fallback: Insert at the beginning of modal body
        modalBody.insertBefore(warning, modalBody.firstChild);
    }
}
    function showErrorMessage(message) {
        console.error(message);
        alert(message);
    }

    function setupStaticOptions() {
        console.log('Setting up static options as fallback');
        
        // Enable static options as fallback
        facultySelect.disabled = false;
        semesterSelect.disabled = false;
        
        // Reset to original static options
        facultySelect.innerHTML = `
            <option value="">-- Select Faculty --</option>
            <option value="BE Computer">BE Computer</option>
            <option value="BE Civil">BE Civil</option>
            <option value="BBA">BBA</option>
            <option value="BCA">BCA</option>
        `;
        
        semesterSelect.innerHTML = `
            <option value="">Select Semester</option>
            <option>Semester I</option>
            <option>Semester II</option>
            <option>Semester III</option>
            <option>Semester IV</option>
            <option>Semester V</option>
            <option>Semester VI</option>
            <option>Semester VII</option>
            <option>Semester VIII</option>
        `;
        
        // Ensure course is input field
        resetCourseSelect();
        courseSelect.placeholder = 'Enter Course';
        courseSelect.disabled = false;
    }

    /** -------------------------
     * MODAL HANDLING
     * ------------------------- */
    const addSessionBtn = document.querySelector('.addsession');
    const modalOverlay = document.getElementById('sessionModal');
    const modalClose = document.querySelector('.modal-close');
    
    if (addSessionBtn) {
        addSessionBtn.addEventListener('click', async function() {
            console.log('Add Session button clicked');
            
            // Get teacher info
            currentTeacher = getCurrentTeacher();
            
            if (!currentTeacher) {
                alert('Please login as a teacher to create session plans');
                return;
            }
            
            // FIX: Check for teacherId or userId
            if (!currentTeacher.teacherId && !currentTeacher.userId) {
                alert('Unable to identify teacher. Please refresh the page.');
                return;
            }
            
            // Ensure teacherId exists for API calls
            if (!currentTeacher.teacherId && currentTeacher.userId) {
                currentTeacher.teacherId = currentTeacher.userId;
                console.log('Set teacherId from userId:', currentTeacher.teacherId);
            }
            
            // Reset form
            resetForm();
            
            // Personalize UI
            const pageSubtitle = document.querySelector('.page-subtitle');
            if (pageSubtitle) {
                pageSubtitle.textContent = `Teacher lesson planning for ${currentTeacher.username}'s students`;
            }
            
            console.log('Fetching courses for teacher ID:', currentTeacher.teacherId);
            
            // Fetch teacher's courses
            await fetchTeacherCourses(currentTeacher.teacherId);
            
            // Show modal
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
        console.log('Resetting form');
        
        // Reset dropdowns
        facultySelect.innerHTML = '<option value="">-- Select Program --</option>';
        semesterSelect.innerHTML = '<option value="">-- Select Program First --</option>';
        semesterSelect.disabled = true;
        
        // Reset course field
        resetCourseSelect();
        courseSelect.disabled = true;
        
        // Reset day data
        currentDay = 1;
        dayData = {};
        loadDay(currentDay);
        
        // Remove teacher badge and messages
        const modalBody = document.querySelector('.modal-body');
        if (modalBody) {
            const elementsToRemove = modalBody.querySelectorAll(
                '.teacher-info-badge, .alert, .no-courses-message'
            );
            elementsToRemove.forEach(el => el.remove());
        }
    }

    /** -------------------------
     * SAVE SESSION PLAN
     * ------------------------- */
    saveBtn.onclick = () => {
        saveCurrentDay();

        const facultyValue = facultySelect?.value.trim();
        const courseValue = courseSelect?.value.trim();
        const semesterValue = semesterSelect?.value.trim();

        if (!facultyValue || !courseValue || !semesterValue) {
            alert("Please select Program, Semester, and Course");
            return;
        }

        if (!currentTeacher) {
            alert("Unable to identify teacher. Please refresh the page.");
            return;
        }

        // Get course name
        let courseName = courseValue;
        let courseId = courseValue;
        let courseCode = '';
        
        if (courseSelect.tagName === 'SELECT') {
            const courseOption = courseSelect.options[courseSelect.selectedIndex];
            courseName = courseOption?.dataset.courseName || courseValue;
            courseCode = courseOption?.dataset.courseCode || '';
            courseId = courseSelect.value;
        }

        // Get program name
        let programName = facultyValue;
        let programId = facultyValue;
        if (facultySelect.tagName === 'SELECT') {
            const programOption = facultySelect.options[facultySelect.selectedIndex];
            programName = programOption?.textContent || facultyValue;
            programId = facultySelect.value;
        }

        // Get semester name
        let semesterName = semesterValue;
        let semesterId = semesterValue;
        if (semesterSelect.tagName === 'SELECT') {
            const semesterOption = semesterSelect.options[semesterSelect.selectedIndex];
            semesterName = semesterOption?.textContent || semesterValue;
            semesterId = semesterSelect.value;
        }

        // Create days array
        const days = [];
        for (const dayKey in dayData) {
            if (dayData.hasOwnProperty(dayKey)) {
                const dayNum = parseInt(dayKey, 10);
                if (!isNaN(dayNum)) {
                    days.push({
                        day_number: dayNum,
                        topic: dayData[dayKey].topic,
                        description: dayData[dayKey].description,
                        method: dayData[dayKey].method
                    });
                }
            }
        }

        days.sort((a, b) => a.day_number - b.day_number);

        const payload = {
            teacher_id: currentTeacher.teacherId || currentTeacher.userId,
            teacher_name: currentTeacher.username,
            program_id: programId,
            program_name: programName,
            semester_id: semesterId,
            semester_name: semesterName,
            course_id: courseId,
            course_name: courseName,
            course_code: courseCode,
            days: days
        };

        console.log("Saving session plan:", payload);

        fetch("/api/session-plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then((data) => {
            console.log("Response:", data);
            alert("Session Plan Saved Successfully");
            modalOverlay.style.display = 'none';
            resetForm();
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
    function loadPublishedPlans() {
        const tbody = document.querySelector(".session-table tbody");
        if (!tbody) return;

        // Get current teacher
        if (!currentTeacher) {
            currentTeacher = getCurrentTeacher();
        }

        if (!currentTeacher) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        Please login as a teacher to view session plans
                    </td>
                </tr>
            `;
            return;
        }

        // Ensure teacherId exists for API call
        const teacherId = currentTeacher.teacherId || currentTeacher.userId;
        if (!teacherId) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        Unable to identify teacher ID
                    </td>
                </tr>
            `;
            return;
        }

        // Show personalized loading
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="loading-cell">
                    <div class="loading-spinner"></div>
                    Loading ${currentTeacher.username}'s session plans...
                </td>
            </tr>
        `;

        // Fetch only this teacher's plans using the API
        fetch(`/api/session-plans/teacher/${teacherId}`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(teacherPlans => {
                tbody.innerHTML = "";

                if (!teacherPlans || teacherPlans.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="4" class="empty-state">
                                <div class="empty-content">
                                    <i class="fas fa-calendar-plus"></i>
                                    <div>
                                        <h4>No Session Plans Yet</h4>
                                        <p><strong>${currentTeacher.username}</strong> hasn't created any session plans.</p>
                                        <button class="btn-add-first" onclick="document.querySelector('.addsession')?.click()">
                                            <i class="fas fa-plus"></i> Create First Plan
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                    return;
                }

                teacherPlans.forEach(plan => {
                    const tr = document.createElement("tr");
                    const date = plan.createdDate ? new Date(plan.createdDate).toLocaleDateString() : '';
                    const method = plan.days && plan.days.length ? plan.days[0].method : "Lecture";

                    tr.innerHTML = `
                        <td>${plan.course_name || plan.course}</td>
                        <td>${plan.semester_name || plan.semester}</td>
                        <td>${date}</td>
                        <td><span class="method-badge">${method}</span></td>
                    `;

                    tr.style.cursor = "pointer";
                    tr.title = "Click to view details";
                    
                    tr.addEventListener("click", () => {
                        // Load session-details page with ID
                        if (typeof loadPage === 'function') {
                            loadPage(`/pages/session-details.html?id=${plan.id}`);
                        } else {
                            window.location.href = `/pages/session-details.html?id=${plan.id}`;
                        }
                    });

                    tbody.appendChild(tr);
                });
            })
            .catch(err => {
                console.error('Error loading session plans:', err);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="4" class="error-cell">
                            Failed to load session plans
                        </td>
                    </tr>
                `;
            });
    }

    /** -------------------------
     * INITIALIZE
     * ------------------------- */
    // Initialize day navigation
    loadDay(currentDay);
    
    // Load teacher's published plans on page load
    currentTeacher = getCurrentTeacher();
    loadPublishedPlans();
}