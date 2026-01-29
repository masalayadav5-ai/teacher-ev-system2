// Global variables
let selectedTeacherId = null;
let currentProgramId = null;
let currentSemesterId = null;
let editingQualificationId = null;
window.preventAutoLoad = false;

// Initialize Admin Management Page
function isAdminManagementPageLoaded() {
    return document.getElementById("programsTable") !== null;
}
function setTextSafe(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    } else {
        console.warn(`Element #${id} not found (overview not loaded yet)`);
    }
}

function initAdminManagement() {
    console.log('Initializing Admin Management...');

    // ✅ STOP if page HTML is not loaded yet
    if (!isAdminManagementPageLoaded()) {
        console.warn("Admin Management DOM not ready, retrying...");
        setTimeout(initAdminManagement, 100);
        return;
    }
    protectAdminPage();
    // ✅ NOW SAFE TO ACCESS DOM
    loadAllPrograms();
    loadProgramsForFilter();
    loadOverviewStats();
    loadBatches();
    setupEventListeners();
}

function protectAdminPage() {
    if (!window.currentUser)
        return;
    if (window.currentUser.role !== "ADMIN") {
        Swal.fire("Access Denied", "Admins only", "error");
        if (typeof loadPage === "function") {
            loadPage("/pages/dashboard-content.html");
        }
    }
}

/* 🌍 REGISTER GLOBALLY */
window.initAdminManagement = initAdminManagement;
function confirmAction(title, text, onConfirm) {
    Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            onConfirm();
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Close modals when clicking outside
    document.addEventListener('click', function (e) {
       const modals = [
  'programModal',
  'semesterModal',
  'courseModal',
  'batchModal',
  'qualificationModal'
];

        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && e.target === modal && modal.classList.contains('show')) {
    modal.classList.remove('show');
}

        });
    });
}

// Tab Management
// Tab Management
function showTab(tabName, event) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (event) {
        event.currentTarget.classList.add('active');
    }

    // Add a flag to prevent auto-loading when coming from assignTeachersToCourse
    if (window.preventAutoLoad) {
        window.preventAutoLoad = false;
        return;
    }

    switch (tabName) {
        case 'programs':
            loadAllPrograms();
            break;
        case 'semesters':
            loadSemestersByProgram();
            break;
        case 'courses':
            loadCoursesBySemester();
            break;
        case 'batches':
            loadBatches();
            break;

        case 'qualifications':
            loadQualifications();
            break;

        case 'teacher-assignments':
            // Only load teachers if teacherProgramFilter is not already set
            if (!document.getElementById('teacherProgramFilter').value) {
                loadTeachersByProgram();
            }
            // Initialize course program filter with programs
            loadProgramsForTeacherAssignmentFilter();
            break;
        case 'overview':
            loadOverviewStats();
            loadStructureTree();
            break;
    }
}

// ================= PROGRAMS MANAGEMENT =================

// Load all programs
async function loadAllPrograms() {
    try {
        showLoading('programsTable');

        const response = await fetch('/api/admin/programs/overview');
        if (!response.ok)
            throw new Error('Failed to load programs');

        const programs = await response.json();
        // ✅ FILTER ONLY ACTIVE PROGRAMS
        const activePrograms = programs.filter(p => p.active === true);

        renderProgramsTable(activePrograms);
    } catch (error) {
        console.error('Error loading programs:', error);
        showError('programsTable', 'Failed to load programs');
    }
}

// Render programs table
function renderProgramsTable(programs) {
    const tableBody = document.getElementById('programsTable');

    if (!tableBody) {
        console.warn("programsTable not found (page not loaded yet)");
        return;
    }
    if (!programs || programs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-graduation-cap"></i>
                    <p>No programs found. Add your first program!</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = programs.map(program => `
        <tr>
            <td>${program.id}</td>
            <td><strong>${program.code || 'N/A'}</strong></td>
            <td>${program.name}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${program.description || ''}">
                ${program.description || 'No description'}
            </td>
            <td><span class="badge bg-info">${program.totalSemesters}</span></td>
            <td><span class="badge bg-primary">${program.totalStudents || 0}</span></td>
            <td><span class="badge bg-warning">${program.activeTeachers || 0}</span></td>
            <td>
                <span class="status-badge ${program.active ? 'status-active' : 'status-inactive'}">
                    ${program.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editProgram(${program.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-assign" onclick="viewSemesters(${program.id})" title="View Semesters">
                        <i class="fas fa-list"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="confirmDeleteProgram(${program.id}, '${program.name}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Open Add Program Modal
function openAddProgramModal(program = null) {
    const modal = document.getElementById('programModal');
    const title = document.getElementById("programModalTitle");
    if (!title) {
        console.error("programModalTitle not found in DOM");
        return;
    }
    title.textContent = "Add Program";

    if (program) {
        // Edit mode
        title.textContent = 'Edit Program';
        document.getElementById('programId').value = program.id;
        document.getElementById('programCode').value = program.code || '';
        document.getElementById('programName').value = program.name;
        document.getElementById('programDescription').value = program.description || '';
        document.getElementById('programStatus').value = program.active ? 'true' : 'false';
    } else {
        // Add mode
        title.textContent = 'Add New Program';
        document.getElementById('programForm').reset();
        document.getElementById('programId').value = '';
    }
const err = document.getElementById("programModalError");
if (err) err.classList.add("hidden");

    // USE THIS:
    modal.classList.add('show');
}

// Close Program Modal
function closeProgramModal() {
    document.getElementById('programModal').classList.remove('show');
    const toast = document.getElementById("modalToast");
if (toast) toast.style.display = "none";

}
// 🔍 Check if program already exists (frontend pre-check)
async function programExists(name, excludeId = null) {
  const res = await fetch('/api/admin/programs');
  if (!res.ok) return false;

  const programs = await res.json();

  return programs.some(p =>
    p.name.toLowerCase() === name.toLowerCase() &&
    (!excludeId || p.id != excludeId)
  );
}



// Save Program
async function saveProgram() {
  const programId = document.getElementById('programId').value;

  const programData = {
    code: document.getElementById('programCode').value.trim(),
    name: document.getElementById('programName').value.trim(),
    description: document.getElementById('programDescription').value.trim(),
    active: document.getElementById('programStatus').value === 'true'
  };

  // Validation
  if (!programData.code || !programData.name) {
    showModalToast("Please fill in all required fields", "error");
    return;
  }

  // 🔍 FRONTEND DUPLICATE CHECK (WORKS FOR EDIT TOO)
const exists = await programExists(
  programData.name,
  programId
);


  if (exists) {
    showModalToast("Program with same code or name already exists", "error");
    return; // ❌ STOP → no request → no red console error
  }

  // ⬇️ Only send request if unique
  try {
    const url = programId
      ? `/api/admin/programs/${programId}`
      : `/api/admin/programs`;

    const method = programId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(programData)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 400 && result.message) {
        showModalToast(result.message, "error");
        return;
      }
      throw new Error("Unexpected server error");
    }

    showSuccess(programId
      ? 'Program updated successfully!'
      : 'Program added successfully!');

    closeProgramModal();
    loadAllPrograms();
    loadProgramsForFilter();
    loadOverviewStats();

  } catch (error) {
    showModalToast("Server error while saving program", "error");
  }
}



// Edit Program
// Quick test function
function testModal() {
    console.log('Testing modal...');
    const modal = document.getElementById('programModal');
    console.log('Modal element:', modal);
    console.log('Has hidden class:', modal.classList.contains('hidden'));

    // Try to show it
    modal.classList.remove('hidden');
    console.log('After removing hidden, has hidden class:', modal.classList.contains('hidden'));

    // Check computed style
    const computedStyle = window.getComputedStyle(modal);
    console.log('Computed display:', computedStyle.display);
}

// Test on edit click
async function editProgram(programId) {
  try {
    // Hide old modal error
    const err = document.getElementById("programModalError");
    if (err) err.classList.add("hidden");

    // 🎯 Use single-program endpoint (now exists in backend)
    const response = await fetch(`/api/admin/programs/${programId}`);

    if (!response.ok) {
      showModalToast("Failed to load program details", "error");
      return;
    }

    const program = await response.json();

    // ✅ Open modal with real data
    openAddProgramModal(program);

  } catch (error) {
    showModalToast("Network error while loading program", "error");
  }
}



// Confirm Delete Program
function confirmDeleteProgram(programId, programName) {
    confirmAction(
            'Delete Program?',
            `Are you sure you want to delete program "${programName}"?`,
            () => deleteProgram(programId)
    );
}

// Delete Program
async function deleteProgram(programId) {
    try {
        const response = await fetch(`/api/admin/programs/${programId}`, {
            method: 'DELETE'
        });

        if (!response.ok)
            throw new Error('Failed to delete program');

        showSuccess('Program deleted successfully!');
        loadAllPrograms();
        loadProgramsForFilter();
        loadOverviewStats();

    } catch (error) {
        console.error('Error deleting program:', error);
        showError('confirmModal', 'Failed to delete program');
    }
}

// View Semesters of a Program
function viewSemesters(programId) {
    // Switch to semesters tab and filter by this program
    showTab('semesters');
    document.getElementById('programFilter').value = programId;
    loadSemestersByProgram();
}

// ================= SEMESTERS MANAGEMENT =================

// Load programs for filter dropdown
async function loadProgramsForFilter() {
    try {
        const response = await fetch('/api/admin/programs');
        if (!response.ok)
            throw new Error('Failed to load programs');

        const programs = await response.json();
        renderProgramFilterOptions(programs);
    } catch (error) {
        console.error('Error loading programs for filter:', error);
    }
}

// Load programs for teacher assignment filter
// Load programs for teacher assignment filter
async function loadProgramsForTeacherAssignmentFilter() {
    console.log('loadProgramsForTeacherAssignmentFilter called');
    try {
        const response = await fetch('/api/admin/programs');
        if (!response.ok) {
            console.error('Failed to load programs for teacher assignment filter');
            throw new Error('Failed to load programs');
        }

        const programs = await response.json();
        console.log('Programs loaded for teacher assignment filter:', programs.length, 'programs');
        const courseProgramForAssignFilter = document.getElementById('courseProgramForAssignFilter');

        if (courseProgramForAssignFilter) {
            console.log('Found courseProgramForAssignFilter, current options:', courseProgramForAssignFilter.options.length);

            // Save current value if set
            const currentValue = courseProgramForAssignFilter.value;

            // Clear existing options except the first one
            while (courseProgramForAssignFilter.options.length > 1) {
                courseProgramForAssignFilter.remove(1);
            }

            console.log('Adding program options...');
            // Add program options
            programs.forEach(program => {
                const option = document.createElement('option');
                option.value = program.id;
                option.textContent = `${program.code} - ${program.name}`;
                courseProgramForAssignFilter.appendChild(option);
            });

            // Restore value if it still exists
            if (currentValue) {
                courseProgramForAssignFilter.value = currentValue;
            }

            console.log('Total options after adding:', courseProgramForAssignFilter.options.length);
        } else {
            console.error('courseProgramForAssignFilter not found in DOM');
        }
    } catch (error) {
        console.error('Error loading programs for teacher assignment filter:', error);
    }
}

function renderProgramFilterOptions(programs) {
    const programFilter = document.getElementById('programFilter');
    const semesterProgram = document.getElementById('semesterProgram');
    const courseProgramFilter = document.getElementById('courseProgramFilter');
    const teacherProgramFilter = document.getElementById('teacherProgramFilter');
    const courseProgram = document.getElementById('courseProgram');
    const courseProgramForAssignFilter = document.getElementById('courseProgramForAssignFilter');

    const filters = [programFilter, semesterProgram, courseProgramFilter,
        teacherProgramFilter, courseProgram, courseProgramForAssignFilter];

    filters.forEach(filter => {
        if (filter) {
            // Clear existing options except the first one
            while (filter.options.length > 1) {
                filter.remove(1);
            }

            // Add program options
            programs.forEach(program => {
                const option = document.createElement('option');
                option.value = program.id;
                option.textContent = `${program.code} - ${program.name}`;
                filter.appendChild(option);
            });
        }
    });
}

// Load semesters by program
async function loadSemestersByProgram() {
    const programId = document.getElementById('programFilter').value;

    if (!programId) {
        document.getElementById('semestersTable').innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Please select a program to view semesters</p>
                </td>
            </tr>
        `;
        return;
    }

    try {
        showLoading('semestersTable');

        const response = await fetch(`/api/admin/programs/${programId}/semesters/stats`);
        if (!response.ok)
            throw new Error('Failed to load semesters');

        const semesters = await response.json();

        // DEBUG: Log what's actually in the response
        console.log('API Response:', semesters);
        if (semesters.length > 0) {
            console.log('First semester data:', semesters[0]);
            console.log('Available keys:', Object.keys(semesters[0]));
        }

        renderSemestersTableFromStats(semesters);

    } catch (error) {
        console.error('Error loading semesters:', error);
        // Fall back to regular endpoint
        try {
            const fallbackResponse = await fetch(`/api/admin/programs/${programId}/semesters`);
            if (!fallbackResponse.ok)
                throw new Error('Failed to load semesters');

            const semesters = await fallbackResponse.json();
            renderSemestersTable(semesters);
        } catch (fallbackError) {
            showError('semestersTable', 'Failed to load semesters');
        }
    }
}

// Render semesters table from stats data
function renderSemestersTableFromStats(semesters) {
    const tableBody = document.getElementById('semestersTable');

    if (!semesters || semesters.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No semesters found for this program. Add your first semester!</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = semesters.map(semester => `
        <tr>
            <td>${semester.id}</td>
            <td><strong>${semester.name}</strong></td>
            <td>${semester.programName || 'N/A'}</td>
            <td><span class="badge bg-info">${semester.courseCount || 0}</span></td>
            <td><span class="badge bg-primary">${semester.studentCount || 0}</span></td> <!-- Changed from activeStudentCount to studentCount -->
            <td>
                <span class="status-badge ${semester.active ? 'status-active' : 'status-inactive'}">
                    ${semester.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editSemester(${semester.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-assign" onclick="viewCourses(${semester.id})" title="View Courses">
                        <i class="fas fa-book"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="confirmDeleteSemester(${semester.id}, '${semester.name}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render semesters table
function renderSemestersTable(semesters) {
    const tableBody = document.getElementById('semestersTable');

    if (!semesters || semesters.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <p>No semesters found for this program. Add your first semester!</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = semesters.map(semester => {
        // Filter active students (status = 'Active')
        const activeStudents = semester.students ?
                semester.students.filter(student => student.status === 'Active') :
                [];

        return `
        <tr>
            <td>${semester.id}</td>
            <td><strong>${semester.name}</strong></td>
            <td>${semester.program ? semester.program.name : 'N/A'}</td>
            <td><span class="badge bg-info">${semester.courses ? semester.courses.length : 0}</span></td>
            <td><span class="badge bg-primary">${activeStudents.length}</span></td>
            <td>
                <span class="status-badge ${semester.active ? 'status-active' : 'status-inactive'}">
                    ${semester.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editSemester(${semester.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-assign" onclick="viewCourses(${semester.id})" title="View Courses">
                        <i class="fas fa-book"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="confirmDeleteSemester(${semester.id}, '${semester.name}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Open Add Semester Modal
function openAddSemesterModal(semester = null) {
    const modal = document.getElementById('semesterModal');
    const title = document.getElementById('semesterModalTitle');

    if (semester) {
        // Edit mode
        title.textContent = 'Edit Semester';
        document.getElementById('semesterId').value = semester.id;
        document.getElementById('semesterProgram').value = semester.program ? semester.program.id : '';
        document.getElementById('semesterName').value = semester.name;
        document.getElementById('semesterStatus').value = semester.active ? 'true' : 'false';
    } else {
        // Add mode
        title.textContent = 'Add New Semester';
        document.getElementById('semesterForm').reset();
        document.getElementById('semesterId').value = '';
    }

    // USE THIS:
    modal.classList.add('show');
}

// Close Semester Modal
function closeSemesterModal() {
    document.getElementById('semesterModal').classList.remove('show');
}

// Save Semester
async function saveSemester() {
  const semesterId = document.getElementById('semesterId').value;
  const name = document.getElementById('semesterName').value.trim();
  const programId = parseInt(document.getElementById('semesterProgram').value);
  const active = document.getElementById('semesterStatus').value === 'true';

  if (!name || !programId) {
    showModalToast("Please fill in all required fields", "error");
    return;
  }

  // 🔍 FRONTEND DUPLICATE CHECK
  const exists = await semesterExists(name, programId, semesterId);
  if (exists) {
    showModalToast("Semester already exists in this program", "error");
    return;
  }

  const payload = {
    name,
    active,
    program: { id: programId }
  };

  try {
    const url = semesterId
      ? `/api/admin/semesters/${semesterId}`
      : '/api/admin/semesters';

    const method = semesterId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      showModalToast(result.message || "Server error", "error");
      return;
    }

    showSuccess(semesterId
      ? 'Semester updated successfully!'
      : 'Semester added successfully!');

    closeSemesterModal();
    loadSemestersByProgram();
    loadOverviewStats();

  } catch (error) {
    console.error(error);
    showModalToast("Server error while saving semester", "error");
  }
}


// Edit Semester
async function editSemester(semesterId) {
    try {
        const response = await fetch(`/api/admin/semesters/${semesterId}`);
        if (!response.ok)
            throw new Error('Failed to load semester');

        const semester = await response.json();
        openAddSemesterModal(semester);
    } catch (error) {
        console.error('Error loading semester:', error);
        alert('Failed to load semester details');
    }
}

// Delete Semester
async function deleteSemester(semesterId) {
    try {
        const response = await fetch(`/api/admin/semesters/${semesterId}`, {
            method: 'DELETE'
        });

        if (!response.ok)
            throw new Error('Failed to delete semester');

        showSuccess('Semester deleted successfully!');
        loadSemestersByProgram();
        loadOverviewStats();

    } catch (error) {
        console.error('Error deleting semester:', error);
        showError('confirmModal', 'Failed to delete semester');
    }
}

function confirmDeleteSemester(semesterId, semesterName) {
    confirmAction(
            'Delete Semester?',
            `Are you sure you want to delete semester "${semesterName}"?`,
            () => deleteSemester(semesterId)
    );
}

// View Courses of a Semester
function viewCourses(semesterId) {
    // Store the current semester ID for later use
    currentSemesterId = semesterId;

    // Switch to courses tab and filter by this semester
    showTab('courses');

    // Find the program for this semester
    const row = event.target.closest('tr');
    const programName = row.cells[2].textContent;
    const programSelect = document.getElementById('courseProgramFilter');

    // Store the current program and semester in sessionStorage for later use
    for (let option of programSelect.options) {
        if (option.textContent.includes(programName)) {
            currentProgramId = option.value;
            programSelect.value = currentProgramId;

            // Store in sessionStorage so assignTeachersToCourse can access it
            sessionStorage.setItem('lastSelectedProgram', currentProgramId);
            sessionStorage.setItem('lastSelectedSemester', semesterId);
            console.log('Stored in sessionStorage - program:', currentProgramId, 'semester:', semesterId);

            loadSemestersForCourses();

            // After loading semesters, select the semester
            setTimeout(() => {
                document.getElementById('courseSemesterFilter').value = semesterId;
                loadCoursesBySemester();
            }, 500);
            break;
        }
    }
}
// ================= COURSES MANAGEMENT =================

// Load semesters for course filter
async function loadSemestersForCourses() {
    const programId = document.getElementById('courseProgramFilter').value;

    if (!programId) {
        document.getElementById('courseSemesterFilter').innerHTML = '<option value="">Select Semester</option>';
        return;
    }

    try {
        const response = await fetch(`/api/admin/programs/${programId}/semesters`);
        if (!response.ok)
            throw new Error('Failed to load semesters');

        const semesters = await response.json();
        const semesterSelect = document.getElementById('courseSemesterFilter');

        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        semesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.id;
            option.textContent = semester.name;
            semesterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading semesters for courses:', error);
    }
}

// Load courses by semester
// Load courses by semester
async function loadCoursesBySemester() {
    const semesterId = document.getElementById('courseSemesterFilter').value;
    const programId = document.getElementById('courseProgramFilter').value;

    if (!semesterId) {
        document.getElementById('coursesTable').innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>Please select a semester to view courses</p>
                </td>
            </tr>
        `;
        return;
    }

    // ✅ STORE CURRENT PROGRAM AND SEMESTER FOR TEACHER ASSIGNMENTS
    if (programId && semesterId) {
        sessionStorage.setItem('lastSelectedProgram', programId);
        sessionStorage.setItem('lastSelectedSemester', semesterId);
        console.log('Stored current filters for teacher assignments - Program:', programId, 'Semester:', semesterId);

        // Also store in global variables for immediate access
        currentProgramId = programId;
        currentSemesterId = semesterId;
    }

    try {
        showLoading('coursesTable');

        const response = await fetch(`/api/admin/semesters/${semesterId}/courses`);
        if (!response.ok)
            throw new Error('Failed to load courses');

        const courses = await response.json();
        // ✅ FILTER ACTIVE COURSES
        const activeCourses = courses.filter(c => c.active === true);

        renderCoursesTable(activeCourses);
    } catch (error) {
        console.error('Error loading courses:', error);
        showError('coursesTable', 'Failed to load courses');
    }
}

// Render courses table
function renderCoursesTable(courses) {
    const tableBody = document.getElementById('coursesTable');

    if (!courses || courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <i class="fas fa-book"></i>
                    <p>No courses found for this semester. Add your first course!</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = courses.map(course => `
        <tr>
            <td>${course.id}</td>
            <td><strong>${course.code}</strong></td>
            <td>${course.name}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${course.description || ''}">
                ${course.description || 'No description'}
            </td>
            <td>${course.credits || 3}</td>
            <td>${course.semester ? course.semester.name : 'N/A'}</td>
            <td><span class="badge bg-warning">${course.teachers ? course.teachers.length : 0}</span></td>
            <td>
                <span class="status-badge ${course.active ? 'status-active' : 'status-inactive'}">
                    ${course.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn btn-edit" onclick="editCourse(${course.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn btn-assign" onclick="assignTeachersToCourse(${course.id})" title="Assign Teachers">
                        <i class="fas fa-user-plus"></i>
                    </button>
                    <button class="action-btn btn-delete" onclick="confirmDeleteCourse(${course.id}, '${course.code}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load semesters for course modal
async function loadSemestersForCourseModal() {
    const programId = document.getElementById('courseProgram').value;

    if (!programId) {
        document.getElementById('courseSemester').innerHTML = '<option value="">Select Semester</option>';
        return;
    }

    try {
        const response = await fetch(`/api/admin/programs/${programId}/semesters`);
        if (!response.ok)
            throw new Error('Failed to load semesters');

        const semesters = await response.json();
        const semesterSelect = document.getElementById('courseSemester');

        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        semesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.id;
            option.textContent = semester.name;
            semesterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading semesters for course modal:', error);
    }
}

// Open Add Course Modal
function openAddCourseModal(course = null) {
    const modal = document.getElementById('courseModal');
    const title = document.getElementById('courseModalTitle');

    if (course) {
        // Edit mode
        title.textContent = 'Edit Course';
        document.getElementById('courseId').value = course.id;
        document.getElementById('courseProgram').value = course.semester ? course.semester.program.id : '';

        // Load semesters for the program first
        loadSemestersForCourseModal().then(() => {
            document.getElementById('courseSemester').value = course.semester ? course.semester.id : '';
        });

        document.getElementById('courseCode').value = course.code || '';
        document.getElementById('courseName').value = course.name;
        document.getElementById('courseDescription').value = course.description || '';
        document.getElementById('courseCredits').value = course.credits || 3;
        document.getElementById('courseStatus').value = course.active ? 'true' : 'false';
    } else {
        // Add mode
        title.textContent = 'Add New Course';
        document.getElementById('courseForm').reset();
        document.getElementById('courseId').value = '';
        document.getElementById('courseSemester').innerHTML = '<option value="">Select Semester</option>';
    }

    // USE THIS:
    modal.classList.add('show');
}

// Close Course Modal
function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('show');
}

// Save Course
async function saveCourse() {
  const courseId = document.getElementById('courseId').value;

  const code = document.getElementById('courseCode').value.trim();
  const name = document.getElementById('courseName').value.trim();
  const description = document.getElementById('courseDescription').value.trim();
  const credits = parseInt(document.getElementById('courseCredits').value) || 3;
  const semesterId = parseInt(document.getElementById('courseSemester').value);
  const active = document.getElementById('courseStatus').value === 'true';

  if (!code || !name || !semesterId) {
    showModalToast("Please fill in all required fields", "error");
    return;
  }

  // 🔍 FRONTEND DUPLICATE CHECK
  const exists = await courseExists(code, name, semesterId, courseId);
  if (exists) {
    showModalToast("Course with same code or name already exists in this semester", "error");
    return;
  }

  const payload = {
    code,
    name,
    description,
    credits,
    active,
    semester: { id: semesterId }
  };

  try {
    const url = courseId
      ? `/api/admin/courses/${courseId}`
      : `/api/admin/courses`;

    const method = courseId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      showModalToast(result.message || "Server error", "error");
      return;
    }

    showSuccess(courseId
      ? 'Course updated successfully!'
      : 'Course added successfully!');

    closeCourseModal();
    loadCoursesBySemester();
    loadOverviewStats();

  } catch (error) {
    console.error(error);
    showModalToast("Server error while saving course", "error");
  }
}


// Edit Course
async function editCourse(courseId) {
    try {
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok)
            throw new Error('Failed to load course');

        const course = await response.json();
        openAddCourseModal(course);
    } catch (error) {
        console.error('Error loading course:', error);
        alert('Failed to load course details');
    }
}

// Assign Teachers to Course
// Assign Teachers to Course
async function assignTeachersToCourse(courseId) {
    console.log('assignTeachersToCourse called with courseId:', courseId);

    try {
        // First, get the course details to know its program and semester
        const response = await fetch(`/api/admin/courses/${courseId}`);

        let programId, semesterId;

        if (response.ok) {
            const course = await response.json();
            console.log('Course data from API:', course);

            // DEBUG: Check the actual structure of the course object
            console.log('Course object keys:', Object.keys(course));
            console.log('Course semester property:', course.semester);

            // Try different ways to get program and semester
            // Option 1: Check if semester is directly on course
            if (course.semester) {
                semesterId = course.semester.id || course.semester;
                console.log('Found semesterId from course.semester:', semesterId);

                // Check if semester has program property
                if (course.semester.program) {
                    programId = course.semester.program.id || course.semester.program;
                    console.log('Found programId from course.semester.program:', programId);
                }
            }

            // Option 2: Check if there's a programId directly on course
            if (!programId && course.programId) {
                programId = course.programId;
                console.log('Found programId from course.programId:', programId);
            }

            // Option 3: Check if there's a program object on course
            if (!programId && course.program) {
                programId = course.program.id || course.program;
                console.log('Found programId from course.program:', programId);
            }

            console.log('Final extracted programId:', programId, 'semesterId:', semesterId);
        } else {
            // If API fails, use stored values from sessionStorage
            console.log('API failed, trying sessionStorage');
            programId = sessionStorage.getItem('lastSelectedProgram');
            semesterId = sessionStorage.getItem('lastSelectedSemester');
            console.log('From sessionStorage - programId:', programId, 'semesterId:', semesterId);
        }

        // If still no programId/semesterId, get from current filters
        if (!programId || !semesterId) {
            console.log('Getting program/semester from current filters');
            programId = programId || document.getElementById('courseProgramFilter').value;
            semesterId = semesterId || document.getElementById('courseSemesterFilter').value;
            console.log('From filters - programId:', programId, 'semesterId:', semesterId);
        }

        if (!programId || !semesterId) {
            console.error('Could not determine program and semester for course');
            alert('Could not determine program and semester information. Please select program and semester in the courses tab first.');
            return;
        }

        // Set a flag to prevent auto-loading in showTab
        window.preventAutoLoad = true;

        // Switch to teacher assignments tab
        console.log('Switching to teacher-assignments tab');
        showTab('teacher-assignments');

        // Set the teacher's program filter
        const teacherProgramFilter = document.getElementById('teacherProgramFilter');
        console.log('teacherProgramFilter element:', teacherProgramFilter);
        if (teacherProgramFilter && programId) {
            teacherProgramFilter.value = programId;
            console.log('Set teacherProgramFilter value to:', programId);
            // Manually load teachers for this program
            setTimeout(() => {
                loadTeachersByProgram();
            }, 100);
        }

        // Set the course program filter
        const courseProgramForAssignFilter = document.getElementById('courseProgramForAssignFilter');
        console.log('courseProgramForAssignFilter element:', courseProgramForAssignFilter);
        console.log('courseProgramForAssignFilter options before:', courseProgramForAssignFilter ? courseProgramForAssignFilter.options.length : 'null');

        if (courseProgramForAssignFilter && programId) {
            // Check if the option exists in the dropdown
            let optionExists = false;
            for (let i = 0; i < courseProgramForAssignFilter.options.length; i++) {
                if (courseProgramForAssignFilter.options[i].value == programId) {
                    optionExists = true;
                    break;
                }
            }

            if (!optionExists) {
                console.log('Program option not found, reloading programs...');
                await loadProgramsForTeacherAssignmentFilter();
            }

            console.log('Setting courseProgramForAssignFilter value to:', programId);
            courseProgramForAssignFilter.value = programId;
            console.log('Current value after setting:', courseProgramForAssignFilter.value);

            // Trigger change event to load semesters
            console.log('Triggering change event on courseProgramForAssignFilter');
            courseProgramForAssignFilter.dispatchEvent(new Event('change'));

            // Wait for semesters to load, then set semester
            setTimeout(() => {
                const courseSemesterForAssignFilter = document.getElementById('courseSemesterForAssignFilter');
                console.log('courseSemesterForAssignFilter element:', courseSemesterForAssignFilter);
                if (courseSemesterForAssignFilter && semesterId) {
                    console.log('Setting semester filter to:', semesterId);
                    courseSemesterForAssignFilter.value = semesterId;
                    console.log('Current semester filter value:', courseSemesterForAssignFilter.value);

                    // Trigger change to load available courses
                    setTimeout(() => {
                        courseSemesterForAssignFilter.dispatchEvent(new Event('change'));
                    }, 200);
                }
            }, 500);
        } else {
            console.log('courseProgramForAssignFilter not found or programId not available');
        }

    } catch (error) {
        console.error('Error assigning teachers to course:', error);
        // Fallback: just switch to teacher assignments tab
        window.preventAutoLoad = true;
        showTab('teacher-assignments');
    }
}

function checkElements() {
    console.log('Checking if teacher assignment elements exist:');
    console.log('teacherProgramFilter:', document.getElementById('teacherProgramFilter'));
    console.log('courseProgramForAssignFilter:', document.getElementById('courseProgramForAssignFilter'));
    console.log('courseSemesterForAssignFilter:', document.getElementById('courseSemesterForAssignFilter'));
    console.log('teachersList:', document.getElementById('teachersList'));
}
// Delete Course
async function deleteCourse(courseId) {
    try {
        const response = await fetch(`/api/admin/courses/${courseId}`, {
            method: 'DELETE'
        });

        if (!response.ok)
            throw new Error('Failed to delete course');

        showSuccess('Course deleted successfully!');
        loadCoursesBySemester();
        loadOverviewStats();

    } catch (error) {
        console.error('Error deleting course:', error);
        showError('confirmModal', 'Failed to delete course');
    }
}

function confirmDeleteCourse(courseId, courseCode) {
    confirmAction(
            'Delete Course?',
            `Are you sure you want to delete course "${courseCode}"?`,
            () => deleteCourse(courseId)
    );
}

// ================= TEACHER ASSIGNMENTS =================

// Load teachers by program
async function loadTeachersByProgram() {
    const programId = document.getElementById('teacherProgramFilter').value;

    if (!programId) {
        document.getElementById('teachersList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chalkboard-teacher"></i>
                <p>Please select a program to view teachers</p>
            </div>
        `;
        // Clear teacher selection
        selectedTeacherId = null;
        document.getElementById('selectedTeacherName').textContent = 'Select Teacher';
        document.getElementById('assignedCourses').innerHTML = `
            <div class="empty-state">
                <p>No assigned courses</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`/api/admin/programs/${programId}/teachers`);
        if (!response.ok)
            throw new Error('Failed to load teachers');

        const teachers = await response.json();
        renderTeachersList(teachers);

        // Clear teacher selection when loading new teachers
        selectedTeacherId = null;
        document.getElementById('selectedTeacherName').textContent = 'Select Teacher';
        document.getElementById('assignedCourses').innerHTML = `
            <div class="empty-state">
                <p>No assigned courses</p>
            </div>
        `;

    } catch (error) {
        console.error('Error loading teachers:', error);
        showError('teachersList', 'Failed to load teachers');
    }
}

// Render teachers list
function renderTeachersList(teachers) {
    const teachersList = document.getElementById('teachersList');

    if (!teachers || teachers.length === 0) {
        teachersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chalkboard-teacher"></i>
                <p>No teachers found in this program</p>
            </div>
        `;
        return;
    }

    teachersList.innerHTML = teachers.map(teacher => `
        <div class="teacher-item ${selectedTeacherId === teacher.id ? 'active' : ''}" 
             onclick="selectTeacher(this, ${teacher.id}, '${teacher.fullName}')">
            <h5>${teacher.fullName}</h5>
            <p>${teacher.teacherId || 'No ID'}</p>
            <small>${teacher.qualification || 'No qualification'}</small>
        </div>
    `).join('');
}

// Load teacher filter options
function loadTeacherFilterOptions(teachers) {
    const teacherFilter = document.getElementById('teacherFilter');

    teacherFilter.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = `${teacher.fullName} (${teacher.teacherId || 'No ID'})`;
        teacherFilter.appendChild(option);
    });
}

// Select teacher
function selectTeacher(el, teacherId, teacherName) {
    selectedTeacherId = teacherId;

    document.querySelectorAll('.teacher-item').forEach(item => {
        item.classList.remove('active');
    });

    el.classList.add('active');
    document.getElementById('selectedTeacherName').textContent = teacherName;

    // Load assigned courses for this teacher
    loadAssignedCourses();
}

// Load semesters for course assignment filter
async function loadSemestersForCourseAssignments() {
    const programId = document.getElementById('courseProgramForAssignFilter').value;

    if (!programId) {
        document.getElementById('courseSemesterForAssignFilter').innerHTML = '<option value="">Select Semester</option>';
        document.getElementById('availableCourses').innerHTML = `
            <div class="empty-state">
                <p>Please select a program to view courses</p>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch(`/api/admin/programs/${programId}/semesters`);
        if (!response.ok)
            throw new Error('Failed to load semesters');

        const semesters = await response.json();
        const semesterSelect = document.getElementById('courseSemesterForAssignFilter');

        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
        semesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.id;
            option.textContent = semester.name;
            semesterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading semesters for course assignments:', error);
    }
}
function onSemesterChanged() {
    selectedTeacherId = null;
    document.getElementById('selectedTeacherName').textContent = 'Select Teacher';

    loadAvailableCourses();   // global unassigned
    loadAssignedCourses();    // global assigned w/ teacher names
}

// Load available courses based on selected program and semester
async function loadAvailableCourses() {
    const semesterId = document.getElementById('courseSemesterForAssignFilter').value;

    if (!semesterId) {
        document.getElementById('availableCourses').innerHTML = `
            <div class="empty-state">
                <p>Please select semester</p>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch(`/api/admin/semesters/${semesterId}/unassigned-courses`);
        if (!res.ok)
            throw new Error();

        const courses = await res.json();
        renderAvailableCourses(courses);

    } catch (e) {
        console.error(e);
        showError('availableCourses', 'Failed to load courses');
    }
}


// Load assigned courses for selected teacher
async function loadAssignedCourses() {
    const semesterId = document.getElementById('courseSemesterForAssignFilter').value;
    if (!semesterId)
        return;

    try {

        // MODE 1: Teacher selected → teacher-only
        if (selectedTeacherId) {
            const res = await fetch(`/api/admin/teachers/${selectedTeacherId}/courses`);
            if (!res.ok)
                throw new Error();

            const courses = await res.json();
            renderAssignedCoursesTeacherOnly(courses);
        }

        // MODE 2: No teacher selected → global assigned list
        else {
            const res = await fetch(`/api/admin/semesters/${semesterId}/assigned-courses`);
            if (!res.ok)
                throw new Error();

            const courses = await res.json();
            renderAssignedCoursesGlobal(courses);
        }

    } catch (e) {
        console.error(e);
        showError('assignedCourses', 'Failed to load assigned courses');
    }
}


// Render available courses
function renderAvailableCourses(courses) {
    const container = document.getElementById('availableCourses');

    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No available courses</p>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="course-item">
            <h6>${course.code} - ${course.name}</h6>
            <p>${course.description || 'No description'}</p>
            <div class="course-actions">
                <small>${course.semester ? course.semester.name : 'N/A'} • ${course.credits || 3} credits</small>
                <button class="btn-sm btn-primary" onclick="assignCourseToTeacher(${course.id})">
                    <i class="fas fa-plus"></i> Assign
                </button>
            </div>
        </div>
    `).join('');
}

// Render assigned courses
function renderAssignedCourses(courses) {
    const container = document.getElementById('assignedCourses');

    if (!courses || courses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No assigned courses</p>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="course-item">
            <h6>${course.code} - ${course.name}</h6>
            <p>${course.description || 'No description'}</p>
            <div class="course-actions">
                <small>${course.semester ? course.semester.name : 'N/A'} • ${course.credits || 3} credits</small>
                <button class="btn-sm btn-danger" onclick="removeCourseFromTeacher(${course.id})">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}
function renderAssignedCoursesGlobal(courses) {
    const container = document.getElementById('assignedCourses');

    if (!courses.length) {
        container.innerHTML = `<div class="empty-state"><p>No assigned courses</p></div>`;
        return;
    }

    container.innerHTML = courses.map(c => `
        <div class="course-item">
            <h6>${c.code} - ${c.name}</h6>
            <p>${c.description || 'No description'}</p>
            <div class="course-actions">
                <small>${c.semester} • ${c.credits} credits</small><br>
                <span class="badge bg-info mt-1">Teacher: ${c.teacherName}</span>
            </div>
        </div>
    `).join('');
}


function renderAssignedCoursesTeacherOnly(courses) {
    const container = document.getElementById('assignedCourses');

    if (!courses.length) {
        container.innerHTML = `<div class="empty-state"><p>No assigned courses</p></div>`;
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="course-item">
            <h6>${course.code} - ${course.name}</h6>
            <p>${course.description || 'No description'}</p>
            <div class="course-actions">
                <small>${course.semester?.name || 'N/A'} • ${course.credits || 3} credits</small>
                <button class="btn-sm btn-danger"
                        onclick="removeCourseFromTeacher(${course.id})">
                    <i class="fas fa-times"></i> Remove
                </button>
            </div>
        </div>
    `).join('');
}

// Assign course to teacher
async function assignCourseToTeacher(courseId) {
    if (!selectedTeacherId) {
        alert('Please select a teacher from the list first');
        return;
    }

    try {
        const response = await fetch(`/api/admin/teachers/${selectedTeacherId}/courses/${courseId}/assign`, {
            method: 'POST'
        });

        if (!response.ok)
            throw new Error('Failed to assign course');

        showSuccess('Course assigned successfully!');

        // Reload both assigned and available courses
        loadAssignedCourses();
        loadAvailableCourses();
        loadOverviewStats();

    } catch (error) {
        console.error('Error assigning course:', error);
        alert('Failed to assign course');
    }
}

// Remove course from teacher
async function removeCourseFromTeacher(courseId) {
    if (!selectedTeacherId) {
        alert('Please select a teacher from the list first');
        return;
    }

    try {
        const response = await fetch(`/api/admin/teachers/${selectedTeacherId}/courses/${courseId}/remove`, {
            method: 'POST'
        });

        if (!response.ok)
            throw new Error('Failed to remove course');

        showSuccess('Course removed successfully!');

        // Reload both assigned and available courses
        loadAssignedCourses();
        loadAvailableCourses();
        loadOverviewStats();

    } catch (error) {
        console.error('Error removing course:', error);
        alert('Failed to remove course');
    }
}

// ================= OVERVIEW =================

// Load overview stats

async function loadOverviewStats() {
    // ✅ STOP if overview DOM is not ready
    if (!document.getElementById("totalPrograms")) {
        console.warn("Overview DOM not ready, skipping stats load");
        return;
    }

    try {
        const [
            programsRes,
            semestersRes,
            coursesRes,
            assignmentsRes
        ] = await Promise.all([
            fetch('/api/admin/programs'),
            fetch('/api/admin/semesters'),
            fetch('/api/admin/courses'),
            fetch('/api/admin/assignments/count')
        ]);

        let programs = [];
        let semesters = [];
        let courses = [];
        let assignmentsCount = 0;

        if (programsRes.ok)
            programs = await programsRes.json();
        if (semestersRes.ok)
            semesters = await semestersRes.json();
        if (coursesRes.ok)
            courses = await coursesRes.json();
        if (assignmentsRes.ok) {
            const data = await assignmentsRes.json();
            assignmentsCount = data.count || 0;
        }

        const activePrograms = programs.filter(p => p.active);
        const activeSemesters = semesters.filter(s => s.active);
        const activeCourses = courses.filter(c => c.active);

        // ✅ SAFE DOM UPDATES
        setTextSafe('totalPrograms', activePrograms.length);
        setTextSafe('totalSemesters', activeSemesters.length);
        setTextSafe('totalCourses', activeCourses.length);
        setTextSafe('totalAssignments', assignmentsCount);

    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}


// Load structure tree
async function loadStructureTree() {
    const treeContainer = document.getElementById('structureTree');

    if (!treeContainer) {
        console.warn("structureTree not found (overview not loaded)");
        return;
    }

    try {
        const response = await fetch('/api/admin/structure-tree');
        if (!response.ok)
            throw new Error('Failed to load structure tree');

        const structure = await response.json();
        renderStructureTree(structure);

    } catch (error) {
        console.error('Error loading structure tree:', error);
        treeContainer.innerHTML = `
            <div class="empty-state">
                <p>Failed to load academic structure</p>
            </div>
        `;
    }
}


function renderStructureTree(structure) {
    const treeContainer = document.getElementById('structureTree');

    if (!structure || structure.length === 0) {
        treeContainer.innerHTML = `
            <div class="empty-state">
                <p>No academic structure defined</p>
            </div>
        `;
        return;
    }

    const treeHtml = structure.map(program => `
        <div class="tree-node">
            <div class="tree-header" onclick="toggleTreeChildren(this)">
                <i class="fas fa-caret-right"></i>
                <i class="fas fa-graduation-cap"></i>
                <strong>${program.name}</strong>
                <span class="badge bg-secondary ms-2">${program.semesters ? program.semesters.length : 0} semesters</span>
            </div>
            <div class="tree-children" style="display: none;">
                ${program.semesters && program.semesters.length > 0 ?
                program.semesters.map(semester => `
                        <div class="tree-node">
                            <div class="tree-header" onclick="toggleTreeChildren(this)">
                                <i class="fas fa-caret-right"></i>
                                <i class="fas fa-calendar-alt"></i>
                                <span>${semester.name}</span>
                                <span class="badge bg-info ms-2">${semester.courses ? semester.courses.length : 0} courses</span>
                            </div>
                            <div class="tree-children" style="display: none;">
                                ${semester.courses && semester.courses.length > 0 ?
                            semester.courses.map(course => `
                                        <div class="tree-node">
                                            <div class="tree-header">
                                                <i class="fas fa-book"></i>
                                                <span>${course.code} - ${course.name}</span>
                                                <span class="badge bg-warning ms-2">${course.teacherCount || 0} teachers</span>
                                            </div>
                                        </div>
                                    `).join('') :
                            '<div class="text-muted p-2">No courses</div>'
                            }
                            </div>
                        </div>
                    `).join('') :
                '<div class="text-muted p-2">No semesters</div>'
                }
            </div>
        </div>
    `).join('');

    treeContainer.innerHTML = treeHtml;
}

function toggleTreeChildren(element) {
    const children = element.nextElementSibling;
    const icon = element.querySelector('.fa-caret-right');

    if (children.style.display === 'none') {
        children.style.display = 'block';
        icon.classList.remove('fa-caret-right');
        icon.classList.add('fa-caret-down');
    } else {
        children.style.display = 'none';
        icon.classList.remove('fa-caret-down');
        icon.classList.add('fa-caret-right');
    }
}

// ================= UTILITY FUNCTIONS =================

// Show loading state
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading...</p>
                </td>
            </tr>
        `;
    }
}

// Show error state
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="mt-2">${message}</p>
                </td>
            </tr>
        `;
    }
}

// Show success message
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: message,
        timer: 1500,
        showConfirmButton: false
    });
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// LOAD
async function loadBatches() {
    const res = await fetch('/api/admin/batches');
    const batches = await res.json();

    document.getElementById('batchesTable').innerHTML = batches.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.year}</td>
      <td>${b.term}</td>
      <td>${b.active ? "Active" : "Inactive"}</td>
      <td>
        <button class="action-btn btn-edit" onclick='editBatch(${JSON.stringify(b)})'>
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn btn-delete" onclick="deleteBatch(${b.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// MODAL
function openAddBatchModal() {
    document.getElementById('batchId').value = '';
    document.getElementById('batchModalTitle').textContent = 'Add Batch';
    document.getElementById('batchModal').classList.add('show');
     const err = document.getElementById("batchModalError");
if (err) err.classList.add("hidden");

}

function closeBatchModal() {
    document.getElementById('batchModal').classList.remove('show');
}

// SAVE
async function saveBatch() {
  const btn = document.querySelector("#batchModal .btn-primary");
  btn.disabled = true;

  try {
    const id = document.getElementById("batchId").value;
    const year = parseInt(document.getElementById("batchYear").value, 10);
    const term = document.getElementById("batchTerm").value;
    const active = document.getElementById("batchStatus").value === "true";

    if (!year || !term) {
      showModalToast("Year and term are required", "error");
      btn.disabled = false;
      return;
    }

    const payload = { year, term, active };

    const url = id ? `/api/admin/batches/${id}` : `/api/admin/batches`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data = {};
    try { data = await res.json(); } catch (e) {}

    if (!res.ok) {
      showModalToast(data.message || "Batch already exists", "error");
      btn.disabled = false;
      return;
    }

    showSuccess("Batch saved successfully!");
    closeBatchModal();
    loadBatches();

  } catch (err) {
    console.error(err);
    showModalToast("Server error while saving batch", "error");
  } finally {
    btn.disabled = false;
  }
}




function editBatch(batch) {
    document.getElementById('batchId').value = batch.id;
    document.getElementById('batchYear').value = batch.year;
    document.getElementById('batchTerm').value = batch.term;
    document.getElementById('batchStatus').value = batch.active;
    document.getElementById('batchModalTitle').textContent = 'Edit Batch';
    document.getElementById('batchModal').classList.add('show');
}

async function deleteBatch(id) {
    await fetch(`/api/admin/batches/${id}`, {method: "DELETE"});
    loadBatches();
}

async function loadQualifications() {
  const res = await fetch('/api/admin/qualifications');
  const list = await res.json();

  const tbody = document.getElementById("qualificationTableBody");
  tbody.innerHTML = "";

  list.forEach(q => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${q.id}</td>
      <td>${q.name}</td>
      <td>
        <span class="status-badge ${q.active ? 'status-active' : 'status-inactive'}">
          ${q.active ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="action-btn btn-edit"
                  onclick="editQualification(${q.id}, '${q.name}', ${q.active})"
                  title="Edit">
            <i class="fas fa-edit"></i>
          </button>

          <button class="action-btn btn-delete"
                  onclick="deleteQualification(${q.id})"
                  title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}



function openQualificationModal() {
    editingQualificationId = null;
    document.getElementById("qualificationModalTitle").innerText = "Add Qualification";
    document.getElementById("qualificationId").value = "";
    document.getElementById("qualificationName").value = "";
    document.getElementById("qualificationStatus").value = "true";
   const err = document.getElementById("qualificationModalError");
if (err) err.classList.add("hidden");

    document.getElementById("qualificationModal").classList.add("show");
}


// EDIT
function editQualification(id, name, active) {
    editingQualificationId = id;
    document.getElementById("qualificationModalTitle").innerText = "Edit Qualification";
    document.getElementById("qualificationId").value = id;
    document.getElementById("qualificationName").value = name;
    document.getElementById("qualificationStatus").value = active.toString();
   document.getElementById("qualificationModal").classList.add("show");
   const err = document.getElementById("qualificationModalError");
if (err) err.classList.add("hidden");

}

function closeQualificationModal() {
   document.getElementById("qualificationModal").classList.remove("show");
}

// SAVE
async function saveQualification() {
  const btn = document.querySelector("#qualificationModal .btn-primary");
  btn.disabled = true;

  try {
    const name = document.getElementById("qualificationName").value.trim();
    const active = document.getElementById("qualificationStatus").value === "true";

    if (!name) {
      showModalToast("Qualification name required", "error");
      btn.disabled = false;
      return;
    }

    const payload = { name, active };
    const url = editingQualificationId
      ? `/api/admin/qualifications/${editingQualificationId}`
      : `/api/admin/qualifications`;

    const method = editingQualificationId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let result = {};
    try { result = await res.json(); } catch (e) {}

    if (!res.ok) {
      showModalToast(result.message || "Qualification already exists", "error");
      btn.disabled = false;
      return;
    }

    showModalToast("Qualification saved successfully!", "success");
    closeQualificationModal();
    loadQualifications();

  } catch (err) {
    console.error(err);
    showModalToast("Server error", "error");
  } finally {
    btn.disabled = false;
  }
}


// DELETE
async function deleteQualification(id) {
    const ok = await Swal.fire({
        title: "Delete?",
        text: "This qualification will be disabled",
        icon: "warning",
        showCancelButton: true
    });

    if (!ok.isConfirmed)
        return;

    await fetch(`/api/admin/qualifications/${id}`, {method: "DELETE"});
    loadQualifications();
}
function showModalToast(msg, type = "error") {
const box = document.querySelector(".modal-overlay.show .modal-toast");


  if (!box) return;

  box.textContent = msg;
  box.className = `modal-toast ${type}`;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 3000);
}

// 🔍 Check if semester already exists in the selected program
async function semesterExists(name, programId, excludeId = null) {
  const res = await fetch(`/api/admin/programs/${programId}/semesters`);
  if (!res.ok) return false;

  const semesters = await res.json();

  return semesters.some(s =>
    s.name.toLowerCase() === name.toLowerCase() &&
    (!excludeId || s.id != excludeId)
  );
}
// 🔍 Check if course already exists in the selected semester
async function courseExists(code, name, semesterId, excludeId = null) {
  const res = await fetch(`/api/admin/semesters/${semesterId}/courses`);
  if (!res.ok) return false;

  const courses = await res.json();

  return courses.some(c =>
    (
      c.code.toLowerCase() === code.toLowerCase() ||
      c.name.toLowerCase() === name.toLowerCase()
    ) &&
    (!excludeId || c.id != excludeId)
  );
}
function toggleSidebar() {
  if (document.querySelector(".academic-management-page")) {
    return; // ⛔ stop collapsing on this page
  }

  document.getElementById("sidebar").classList.toggle("collapsed");
}
