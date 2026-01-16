// ================= TEACHER API BASE URL =================
const TEACHER_API_BASE_URL = "http://localhost:8080/api";
let editingTeacherId = null;

console.log("Teacher.js loaded");

// ================= INIT TEACHER PAGE =================
function initTeacherPage() {
    console.log("Initializing teacher page...");
    
    const submitTeacherBtn = document.getElementById("submitTeacherBtn");
    const searchTeacher = document.getElementById("searchTeacher");
    const teacherPanel = document.getElementById("teacherPanel");
    
    console.log("Submit button found:", !!submitTeacherBtn);
    
    if (!submitTeacherBtn) {
        console.error("Submit Teacher button not found!");
        return;
    }

    // ===== Event Listeners =====
    submitTeacherBtn.addEventListener('click', handleTeacherSubmit);
    
    if (searchTeacher) {
        searchTeacher.addEventListener('input', filterTeachers);
    }
    
    // Modal close
    const modalClose = document.querySelector("#teacherPanel .modal-close");
    if (modalClose) {
        modalClose.addEventListener('click', closeTeacherPanel);
    }
    
    // Close modal on outside click
    if (teacherPanel) {
        teacherPanel.addEventListener('click', function(e) {
            if (e.target === teacherPanel) {
                closeTeacherPanel();
            }
        });
    }
    
    // ===== Load Data =====
    loadTeachers();
    loadTeacherStatistics();
    loadTeacherPrograms(); // Load programs on page initialization
    
    console.log("Teacher page initialized");
}

// ================= LOAD PROGRAMS FOR TEACHER =================
async function loadTeacherPrograms(selectedProgramId = null) {
    try {
        console.log('Loading programs for teacher registration...');
        const response = await fetch(`${TEACHER_API_BASE_URL}/admin/programs`);
        if (!response.ok) throw new Error('Failed to load programs');
        
        const programs = await response.json();
        
        // Filter only active programs
        const activePrograms = programs.filter(p => p.active === true);
        
        const programSelect = document.getElementById("programId");
        if (!programSelect) {
            console.error('Program select element not found');
            return;
        }
        
        // Clear existing options
        programSelect.innerHTML = '<option value="">-- Select Program --</option>';
        
        // Add program options
        activePrograms.forEach(program => {
            const option = document.createElement('option');
            option.value = program.id;
            option.textContent = `${program.code} - ${program.name}`;
            programSelect.appendChild(option);
        });
        
        // If a program ID is provided, select it
        if (selectedProgramId) {
            programSelect.value = selectedProgramId;
        }
        
        console.log('Loaded programs for teacher:', activePrograms.length);
        
    } catch (error) {
        console.error("Error loading programs for teacher:", error);
        showTeacherMessage("Failed to load programs. Please refresh the page.", "error");
    }
}

// ================= RESET TEACHER FORM =================
function resetTeacherForm() {
    const form = document.getElementById("teacherForm");
    if (form) form.reset();
    
    // Reset program dropdown
    const programSelect = document.getElementById("programId");
    if (programSelect) {
        programSelect.innerHTML = '<option value="">-- Select Program --</option>';
    }
    
    // Enable teacher ID field
    const teacherIdInput = document.getElementById("teacherId");
    if (teacherIdInput) {
        teacherIdInput.disabled = false;
        teacherIdInput.style.backgroundColor = "";
    }
    
    // Show password fields
    showElement("passwordRow", true);
    showElement("confirmPasswordRow", true);
}

// ================= OPEN ADD TEACHER =================
function openAddTeacher() {
    console.log("Opening add teacher");
    editingTeacherId = null;
    
    // Reset form
    resetTeacherForm();
    
    // Load programs for dropdown
    loadTeacherPrograms();
    
    // Update UI
    setTextContent("#teacherPanel .modal-header h2", "Add Teacher");
    setTextContent("#submitTeacherBtn", "Submit");
    
    // Show modal
    const panel = document.getElementById("teacherPanel");
    if (panel) {
        panel.style.display = "flex";
        panel.classList.add("show");
    }
}

// ================= EDIT TEACHER =================
async function editTeacher(id) {
    try {
        const response = await fetch(`${TEACHER_API_BASE_URL}/teachers`);
        const teachers = await response.json();
        const teacher = teachers.find(t => t.id === id);
        
        if (!teacher) {
            showTeacherMessage("Teacher not found!", "error");
            return;
        }
        
        editingTeacherId = id;
        
        // Fill form
        setValue("fullName", teacher.fullName);
        setValue("teacherId", teacher.teacherId);
        setValue("username", teacher.username);
        setValue("address", teacher.address);
        setValue("contact", teacher.contact);
        setValue("qualification", teacher.qualification);
        setValue("experience", teacher.experience);
        setValue("email", teacher.email);
        
        // Disable teacher ID
        const teacherIdInput = document.getElementById("teacherId");
        if (teacherIdInput) {
            teacherIdInput.disabled = true;
            teacherIdInput.style.backgroundColor = "#f3f3f3";
        }
        
        // Load programs and select the current one
        await loadTeacherPrograms();
        
        // Set program after loading (use setTimeout to ensure dropdown is populated)
        if (teacher.program && teacher.program.id) {
            setTimeout(() => {
                setValue("programId", teacher.program.id);
            }, 100);
        }
        
        // Update UI
        setTextContent("#teacherPanel .modal-header h2", "Edit Teacher");
        setTextContent("#submitTeacherBtn", "Update");
        
        // Hide password fields
        showElement("passwordRow", false);
        showElement("confirmPasswordRow", false);
        
        // Show modal
        const panel = document.getElementById("teacherPanel");
        if (panel) {
            panel.style.display = "flex";
            panel.classList.add("show");
        }
    } catch (error) {
        console.error("Edit teacher error:", error);
        showTeacherMessage("Error loading teacher!", "error");
    }
}

// ================= HANDLE SUBMIT =================
async function handleTeacherSubmit(e) {
    e.preventDefault();

    const formData = {
        fullName: getValue("fullName"),
        teacherId: getValue("teacherId"),
        username: getValue("username") || getValue("teacherId"),
        address: getValue("address"),
        contact: getValue("contact"),
        programId: getValue("programId"), // This will be the selected program ID
        qualification: getValue("qualification"),
        experience: getValue("experience"),
        email: getValue("email"),
        password: getValue("password"),
        confirmPassword: getValue("confirmPassword")
    };

    if (!validateTeacherForm(formData)) return;

    // Build payload - make sure programId is parsed as integer
    const teacherData = {
        fullName: formData.fullName,
        teacherId: formData.teacherId,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        contact: formData.contact,
        qualification: formData.qualification,
        experience: formData.experience.toString(), // send as string
        programId: parseInt(formData.programId) // parse as integer
    };

    await saveTeacher(teacherData);
}

// ================= VALIDATE TEACHER FORM =================
function validateTeacherForm(data) {
    // Required fields - add programId
    const required = ['fullName', 'teacherId', 'contact', 'programId', 'email', 'qualification', 'experience'];
    for (const field of required) {
        if (!data[field]) {
            const fieldName = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            showTeacherMessage(`${fieldName} is required!`, "error");
            return false;
        }
    }
    
    // Password validation for new teachers
    if (!editingTeacherId) {
        if (!data.password) {
            showTeacherMessage("Password is required!", "error");
            return false;
        }
        if (data.password !== data.confirmPassword) {
            showTeacherMessage("Passwords do not match!", "error");
            return false;
        }
    }
    
    // Contact validation
    if (!/^\d{10}$/.test(data.contact)) {
        showTeacherMessage("Contact must be 10 digits!", "error");
        return false;
    }
    
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showTeacherMessage("Invalid email format!", "error");
        return false;
    }
    
    return true;
}

// ================= SAVE TEACHER =================
async function saveTeacher(teacherData) {
    const url = editingTeacherId
        ? `${TEACHER_API_BASE_URL}/teachers/${editingTeacherId}`
        : `${TEACHER_API_BASE_URL}/teachers`;

    const method = editingTeacherId ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(teacherData)
        });

        const result = await response.json();
        if (response.ok) {
            showTeacherMessage(editingTeacherId ? "Teacher updated!" : "Teacher registered!", "success");
            editingTeacherId = null;
            closeTeacherPanel();
            loadTeachers();
            loadTeacherStatistics();
        } else {
            console.error("Backend error:", result);
            showTeacherMessage(result.message || "Operation failed!", "error");
        }
    } catch (error) {
        console.error("Save error:", error);
        showTeacherMessage("Server error!", "error");
    }
}

// ================= LOAD TEACHERS =================
async function loadTeachers() {
    try {
        const response = await fetch(`${TEACHER_API_BASE_URL}/teachers`);
        const teachers = await response.json();
        
        console.log('Teachers loaded with programs:', teachers);
        
        const tbody = document.getElementById("teacherTableBody");
        if (!tbody) return;
        
        tbody.innerHTML = "";
        
        if (teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No teachers found</td></tr>`;
            return;
        }
        
        teachers.slice().reverse().forEach(teacher => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${teacher.teacherId || ''}</td>
                <td>${teacher.fullName || ''}</td>
                <td>${teacher.email || ''}</td>
                <td>${teacher.program ? teacher.program.name : 'No Program Assigned'}</td>
                <td>
                    <button 
                        class="status-btn ${teacher.status === 'Pending' ? 'pending-btn' : 'approve-btn'}"
                        onclick="toggleTeacherStatus(${teacher.id}, '${teacher.status}')">
                        ${teacher.status === 'Pending' ? 'Pending' : 'Active'}
                    </button>
                </td>
                <td>
                    <button class="action-btn edit" onclick="editTeacher(${teacher.id})">Edit</button>
                    <button class="action-btn view" onclick="viewTeacher(${teacher.id})">View</button>
                    <button class="action-btn hide" onclick="hideTeacher(${teacher.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error("Load teachers error:", error);
    }
}

// ================= LOAD STATS =================
async function loadTeacherStatistics() {
    try {
        const response = await fetch(`${TEACHER_API_BASE_URL}/teachers/stats`);
        const stats = await response.json();
        
        setText("totalTeachers", stats.total || 0);
        setText("activeTeachers", stats.active || 0);
        setText("pendingTeachers", stats.pending || 0);
    } catch (error) {
        console.error("Load stats error:", error);
    }
}

// ================= TOGGLE STATUS =================
async function toggleTeacherStatus(id, currentStatus) {
    const newStatus = currentStatus === "Pending" ? "Active" : "Pending";
    
    try {
        const response = await fetch(`${TEACHER_API_BASE_URL}/teachers/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            showTeacherMessage("Status updated!", "success");
            loadTeachers();
            loadTeacherStatistics();
        } else {
            showTeacherMessage("Failed to update status!", "error");
        }
    } catch (error) {
        console.error("Toggle status error:", error);
        showTeacherMessage("Server error!", "error");
    }
}

// ================= VIEW TEACHER =================
async function viewTeacher(teacherId) {
    console.log("viewTeacher called with ID:", teacherId);

    try {
        // fetch teachers list
        const response = await fetch(`${TEACHER_API_BASE_URL}/teachers`);
        const teachers = await response.json();

        // find the selected teacher
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) {
            console.error("Teacher not found!");
            return;
        }

        console.log("Selected teacher:", teacher);

        // store in localStorage
        localStorage.setItem('currentSelectedProfile', JSON.stringify(teacher));

        // set mode
        sessionStorage.setItem('profileMode', 'TEACHER');

        // load teacher profile page
loadStudentProfilePage();

    } catch (error) {
        console.error("Error loading teacher list:", error);
    }
}


// ================= HIDE TEACHER =================
async function hideTeacher(id) {
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "This teacher will be deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!"
    });

    if (!result.isConfirmed) return;

    const response = await fetch(
      `${TEACHER_API_BASE_URL}/teachers/${id}/hide`,
      { method: "PUT" }
    );

    const data = await response.json();

    Swal.fire("Done!", data.message, "success");
    loadTeachers();
    loadTeacherStatistics();
}

// ================= CLOSE MODAL =================
function closeTeacherPanel() {
    const panel = document.getElementById("teacherPanel");
    if (panel) {
        panel.style.display = "none";
        panel.classList.remove("show");
    }
    
    resetTeacherForm();
    editingTeacherId = null;
}

// ================= FILTER TEACHERS =================
function filterTeachers() {
    const searchInput = document.getElementById("searchTeacher");
    const term = searchInput.value.toLowerCase();
    
    const rows = document.querySelectorAll("#teacherTableBody tr");
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? "" : "none";
    });
}

// ================= SHOW MESSAGE =================
function showTeacherMessage(msg, type) {
    const messageBox = document.getElementById("formMessage");
    if (!messageBox) return;
    
    messageBox.textContent = msg;
    messageBox.className = `message-container ${type}`;
    messageBox.style.display = "block";
    
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
}

// ================= HELPER FUNCTIONS =================
function getValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim() : "";
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value || "";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function setTextContent(selector, text) {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
}

function showElement(id, show) {
    const element = document.getElementById(id);
    if (element) element.style.display = show ? "block" : "none";
}

// ================= MAKE FUNCTIONS GLOBAL =================
window.openAddTeacher = openAddTeacher;
window.toggleTeacherStatus = toggleTeacherStatus;
window.editTeacher = editTeacher;
window.viewTeacher = viewTeacher;
window.hideTeacher = hideTeacher;
window.closeTeacherPanel = closeTeacherPanel;

// ================= INITIALIZE =================
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready, initializing teacher page");
    initTeacherPage();
});