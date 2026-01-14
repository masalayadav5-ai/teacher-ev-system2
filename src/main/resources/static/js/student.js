// ================= API BASE URL =================
const STUDENT_API_BASE_URL = "http://localhost:8080/api";let editingStudentId = null;

// ================= INIT STUDENT PAGE =================
function initStudentPage() {

    const submitStudentBtn = document.getElementById("submitStudentBtn");
    const studentForm = document.getElementById("studentForm");
    const searchStudent = document.getElementById("searchStudent");
    const studentPanel = document.getElementById("studentPanel");

    // ===== Batch Dropdown =====
    const batchSelect = document.getElementById("batch");
    const currentYear = new Date().getFullYear();
    batchSelect.innerHTML = `<option value="">-- Select Batch --</option>`;
    for (let y = currentYear; y >= currentYear - 10; y--) {
        batchSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    loadStudents();
    loadStatistics();
    loadPrograms(); 
    
     document.getElementById("faculty").addEventListener('change', function() {
        console.log('Program changed to:', this.value);
         loadSemestersForStudent();
    });
    // ================= SUBMIT (ADD / UPDATE) =================
    submitStudentBtn.onclick = async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullName");
        const studentId = document.getElementById("studentId");
        const username = document.getElementById("username");
        const address = document.getElementById("address");
        const contact = document.getElementById("contact");
        const faculty = document.getElementById("faculty");
        const semester = document.getElementById("semester");
        const batch = document.getElementById("batch");
        const email = document.getElementById("email");

        const password = document.getElementById("password") || { value: "" };
        const confirmPassword = document.getElementById("confirmPassword") || { value: "" };

        // ===== BASIC VALIDATION =====
        if (!fullName.value.trim() || !studentId.value.trim() || !contact.value.trim() ||
            !faculty.value.trim() || !semester.value.trim() || !batch.value.trim() ||
            !email.value.trim() || !username.value.trim()) {
            showMessage("Please fill all required fields!", "error");
            return;
        }

        if (!editingStudentId && (!password.value || !confirmPassword.value)) {
            showMessage("Password is required!", "error");
            return;
        }

        if (!editingStudentId && password.value !== confirmPassword.value) {
            showMessage("Passwords do not match!", "error");
            return;
        }

        if (!/^\d{10}$/.test(contact.value.trim())) {
            showMessage("Contact number must be exactly 10 digits!", "error");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
            showMessage("Invalid email address!", "error");
            return;
        }

        // ===== DUPLICATE STUDENT ID CHECK =====
        try {
            const res = await fetch(`${STUDENT_API_BASE_URL}/students`);
            const students = await res.json();

            const exists = students.some(s =>
                s.studentId === studentId.value.trim() &&
                s.id !== editingStudentId
            );

            if (exists) {
                showMessage("Student ID already exists!", "error");
                return;
            }
        } catch (err) {
            showMessage("Failed to check student ID!", "error");
            return;
        }

        // ===== DATA OBJECT =====
       const studentData = {
    fullName: fullName.value.trim(),
    studentId: studentId.value.trim(),
    username: username.value.trim(),
    address: address.value.trim(),
    contact: contact.value.trim(),
    // CHANGE THESE FROM STRINGS TO IDs:
    programId: parseInt(faculty.value.trim()),  // Now expecting program ID
    semesterId: parseInt(semester.value.trim()), // Now expecting semester ID
    batch: batch.value.trim(),
    email: email.value.trim(),
    status: "Pending"
};

        if (!editingStudentId && password.value) {
            studentData.password = password.value;
        }

        const url = editingStudentId
            ? `${STUDENT_API_BASE_URL}/students/${editingStudentId}`
            : `${STUDENT_API_BASE_URL}/students`;

        const method = editingStudentId ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(studentData)
            });

            let result = {};
            try {
                result = await response.json();
            } catch (e) {}

            if (response.ok) {
                showMessage(
                    editingStudentId ? "Student updated successfully!" : "Student registered successfully!",
                    "success"
                );

                studentForm.reset();
                editingStudentId = null;

                document.querySelector(".modal-header h2").textContent = "Add Student";
                submitStudentBtn.textContent = "Submit";

                document.getElementById("passwordRow").style.display = "block";
                document.getElementById("confirmPasswordRow").style.display = "block";

                loadStudents();
                loadStatistics();
            } else {
                showMessage(result.message || "Operation failed!", "error");
            }

        } catch (error) {
            showMessage("Server error. Please try again!", "error");
            console.error(error);
        }
    };

    // ================= SEARCH =================
    searchStudent.oninput = () => {
        const term = searchStudent.value.toLowerCase();
        [...document.getElementById("studentTableBody").rows].forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
        });
    };
}

// ================= LOAD STUDENTS =================
async function loadStudents() {
    const studentTableBody = document.getElementById("studentTableBody");
    const res = await fetch(`${STUDENT_API_BASE_URL}/students`);
    const students = await res.json();

    studentTableBody.innerHTML = "";

    if (!students.length) {
        studentTableBody.innerHTML = `<tr><td colspan="6" align="center">No students found</td></tr>`;
        return;
    }
students.slice().reverse().forEach(s => {
    const isPending = s.status === "Pending";

    studentTableBody.innerHTML += `
    <tr>
       <td>${s.studentId}</td>
        <td>${s.fullName}</td>
        <td>${s.program ? (s.program.code + " - " + s.program.name) : 'N/A'}</td>
        <td>${s.semester ? s.semester.name : 'N/A'}</td>

        <!-- STATUS COLUMN -->
        <td>
            <button 
                class="status-btn ${isPending ? 'pending-btn' : 'approve-btn'}"
                onclick="toggleStatus(${s.id}, '${s.status}')">
                ${isPending ? "Pending" : "Active"}
            </button>
        </td>

        <!-- ACTION COLUMN -->
        <td>
            <button class="action-btn edit" onclick="editStudent(${s.id})">Edit</button>
            <button class="action-btn view" onclick="viewStudent(${s.id})">View</button>
            <button class="action-btn hide" onclick="hidestudent(${s.id})">Delete</button>

        </td>
    </tr>`;
});
}
// ================= HIDE (SOFT DELETE) =================
async function hidestudent(id) {
    const result = await Swal.fire({
        title: "Are you sure?",
        text: "This student will be deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!"
    });

    if (!result.isConfirmed) return;

    const response = await fetch(
      `${STUDENT_API_BASE_URL}/students/${id}/hide`,
      { method: "PUT" }
    );

    const data = await response.json();

    Swal.fire("Done!", data.message, "success");
    loadStudents();
    loadStatistics();
}


 async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "Pending" ? "Active" : "Pending";

    try {
        const response = await fetch(`${STUDENT_API_BASE_URL}/students/${id}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            showMessage("Failed to update status!", "error");
            return;
        }

        showMessage("Status updated successfully!", "success");
        await loadStudents(); // re-render table
        loadStatistics();

    } catch (error) {
        console.error(error);
        showMessage("Server error!", "error");
    }
}

// ================= LOAD STATS =================
async function loadStatistics() {
    try {
        const res = await fetch(`${STUDENT_API_BASE_URL}/students`);
        const students = await res.json();

        const visibleStudents = students.filter(s => s.hide === "0"); // Only visible
        const total = visibleStudents.length;
        const active = visibleStudents.filter(s => s.status === "Active").length;
        const pending = visibleStudents.filter(s => s.status === "Pending").length;

        document.getElementById("totalStudents").textContent = total;
        document.getElementById("activeStudents").textContent = active;
        document.getElementById("pendingStudents").textContent = pending;
    } catch (error) {
        console.error("Error loading statistics:", error);
    }
}


// ================= ADD STUDENT =================
function openAddStudent() {
    editingStudentId = null;
    const studentForm = document.getElementById("studentForm");
    resetStudentForm();

    const studentIdInput = document.getElementById("studentId");
    studentIdInput.disabled = false;
    studentIdInput.style.backgroundColor = "";

    document.querySelector(".modal-header h2").textContent = "Add Student";
    document.getElementById("submitStudentBtn").textContent = "Submit";

    document.getElementById("passwordRow").style.display = "block";
    document.getElementById("confirmPasswordRow").style.display = "block";

    document.getElementById("studentPanel").classList.add("show");
}

// ================= EDIT STUDENT =================
// ================= EDIT STUDENT =================
async function editStudent(id) {
    console.log('=== START editStudent for ID:', id, '===');
    
    try {
        const res = await fetch(`${STUDENT_API_BASE_URL}/students`);
        const students = await res.json();
        
        const s = students.find(st => st.id === id);
        
        if (!s) {
            showMessage("Student not found!", "error");
            return;
        }

        editingStudentId = id;
        document.querySelector(".modal-header h2").textContent = "Edit Student";
        document.getElementById("submitStudentBtn").textContent = "Update";

        // Fill basic fields
        document.getElementById("fullName").value = s.fullName;
        document.getElementById("studentId").value = s.studentId;

        const studentIdInput = document.getElementById("studentId");
        studentIdInput.disabled = true;
        studentIdInput.style.backgroundColor = "#f3f3f3";

        document.getElementById("username").value = s.username;
        document.getElementById("address").value = s.address || "";
        document.getElementById("contact").value = s.contact;
        document.getElementById("batch").value = s.batch;
        document.getElementById("email").value = s.email;

        // Hide password fields
        document.getElementById("passwordRow").style.display = "none";
        document.getElementById("confirmPasswordRow").style.display = "none";

        // Get dropdowns
        const facultySelect = document.getElementById("faculty");
        const semesterSelect = document.getElementById("semester");
        
        // Show modal first
        document.getElementById("studentPanel").classList.add("show");
        
        // Clear dropdowns
        facultySelect.innerHTML = '<option value="">-- Select Program --</option>';
        semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
        semesterSelect.disabled = true;
        
        // Load programs first
        await loadPrograms();
        
        // If student has program, wait a bit then select it
        if (s.program && s.program.id) {
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
                facultySelect.value = s.program.id;
                console.log('Program selected:', s.program.id);
                
                // Now load semesters
                loadSemestersForStudent(s.program.id).then(() => {
                    // After semesters are loaded, select the semester
                    setTimeout(() => {
                        if (s.semester && s.semester.id) {
                            semesterSelect.value = s.semester.id;
                            console.log('Semester selected:', s.semester.id);
                        }
                    }, 300);
                });
            }, 300);
        }
        
        console.log('=== END editStudent ===');
        
    } catch (error) {
        console.error('Error in editStudent:', error);
        showMessage("Error loading student details", "error");
    }
}
// ================= VIEW STUDENT =================
async function viewStudent(id) {
    console.log("viewStudent called with ID:", id);
    
    try {
        console.log("Fetching students from API...");
        const res = await fetch(`${STUDENT_API_BASE_URL}/students`);
        const students = await res.json();
        console.log("Total students fetched:", students.length);
        
        const s = students.find(st => st.id === id);
        console.log("Found student:", s);
        
        if (!s) {
            showMessage("Student not found!", "error");
            return;
        }

        // Store student data
        console.log("Storing student data in localStorage:", s);
        localStorage.setItem('currentStudentProfile', JSON.stringify(s));
        
        // Verify storage
        const stored = localStorage.getItem('currentStudentProfile');
        console.log("Verified stored data:", stored);
        
        // Directly load profile page
        console.log("Loading profile page...");
        fetch('/pages/studentprofile.html')
            .then(res => {
                console.log("Profile HTML response status:", res.status);
                return res.ok ? res.text() : "<h3 class='text-danger'>Profile Page Not Found</h3>";
            })
            .then(html => {
                console.log("Profile HTML loaded, length:", html.length);
                const area = document.getElementById("content-area");
                if (!area) {
                    console.error("content-area element not found!");
                    return;
                }
                
                area.innerHTML = html;
                console.log("Profile HTML inserted into content-area");
                
                // Load and init profile script
                const script = document.createElement('script');
                script.src = '/js/studentprofile.js?v=' + Date.now(); // Add cache buster
                
                // Define the onload handler
                script.onload = function() {
                    console.log("studentprofile.js loaded successfully");
                    console.log("Checking if initStudentProfile exists:", typeof window.initStudentProfile);
                    
                    // Give it a moment to register
                    setTimeout(function() {
                        if (typeof window.initStudentProfile === 'function') {
                            console.log("Calling initStudentProfile...");
                            window.initStudentProfile();
                        } else {
                            console.error("window.initStudentProfile is not a function!");
                            console.log("Available window functions:", Object.keys(window).filter(key => typeof window[key] === 'function'));
                        }
                    }, 100);
                };
                
                script.onerror = function(error) {
                    console.error("Error loading studentprofile.js:", error);
                };
                
                document.body.appendChild(script);
                console.log("studentprofile.js script tag added to body");
            })
            .catch(error => {
                console.error("Error loading profile page:", error);
            });
        
    } catch (error) {
        console.error("Error in viewStudent:", error);
        showMessage("Error loading student details!", "error");
    }
}

// ================= LOAD STUDENT PROFILE PAGE =================
function loadStudentProfilePage() {
    // Load the student profile HTML
    fetch('/pages/studentprofile.html')
        .then(res => res.ok ? res.text() : "<h3 class='text-danger'>Profile Page Not Found</h3>")
        .then(html => {
            const area = document.getElementById("content-area");
            area.innerHTML = html;
            
            // Load student profile JavaScript
            const script = document.createElement('script');
            script.src = '/js/studentprofile.js';
            document.body.appendChild(script);
            
            // Initialize profile after script loads
            setTimeout(() => {
                if (window.initStudentProfile) {
                    window.initStudentProfile();
                }
            }, 100);
        })
        .catch(error => {
            console.error("Error loading profile page:", error);
        });
}
// ================= LOAD PROGRAMS DYNAMICALLY =================
async function loadPrograms(selectedProgramId = null) {
    try {
        console.log('=== START loadPrograms ===');
        const response = await fetch(`${STUDENT_API_BASE_URL}/admin/programs`);
        if (!response.ok) throw new Error('Failed to load programs');
        
        const programs = await response.json();
        console.log('Programs API returned:', programs.length, 'programs');
        
        // Filter only active programs
        const activePrograms = programs.filter(p => p.active === true);
        console.log('Active programs:', activePrograms.length);
        
        const facultySelect = document.getElementById("faculty");
        
        // Save the current value
        const currentValue = facultySelect.value;
        
        // Clear all options
        facultySelect.innerHTML = '<option value="">-- Select Program --</option>';
        
        // Add program options
        activePrograms.forEach(program => {
            const option = document.createElement('option');
            option.value = program.id;
            option.textContent = `${program.code} - ${program.name}`;
            facultySelect.appendChild(option);
        });
        
        // If a program ID is provided, select it
        if (selectedProgramId) {
            console.log('Selecting program:', selectedProgramId);
            facultySelect.value = selectedProgramId;
        } else if (currentValue) {
            // Restore previous value if any
            facultySelect.value = currentValue;
        }
        
        console.log('Program dropdown populated with', activePrograms.length, 'options');
        
        console.log('=== END loadPrograms ===');
        
    } catch (error) {
        console.error("Error loading programs:", error);
        showMessage("Failed to load programs. Please refresh the page.", "error");
    }
}
// Reset the modal when opening for new student
function resetStudentForm() {
    const form = document.getElementById("studentForm");
    form.reset();
    
    // Reset program and semester dropdowns
    const facultySelect = document.getElementById("faculty");
    const semesterSelect = document.getElementById("semester");
    
    facultySelect.innerHTML = '<option value="">-- Select Program --</option>';
    semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
    semesterSelect.disabled = true;
    
    // Load programs
    loadPrograms();
    
    // Enable student ID field
    const studentIdInput = document.getElementById("studentId");
    studentIdInput.disabled = false;
    studentIdInput.style.backgroundColor = "";
    
    // Show password fields
    document.getElementById("passwordRow").style.display = "block";
    document.getElementById("confirmPasswordRow").style.display = "block";
}
// ================= LOAD SEMESTERS BY PROGRAM =================
async function loadSemestersForStudent(programId = null) {
    console.log('loadSemestersByProgram called with programId:', programId);
    
    // If programId is not provided, get it from dropdown
    if (!programId) {
        programId = document.getElementById("faculty").value;
        console.log('Got programId from dropdown:', programId);
    }
    
    const semesterSelect = document.getElementById("semester");
    console.log('Semester select element:', semesterSelect);
    
    // Reset semester dropdown
    semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
    semesterSelect.disabled = true;
    
    if (!programId) {
        console.log('No programId provided, enabling semester select');
        semesterSelect.disabled = false;
        return [];
    }
    
    try {
        console.log('Fetching semesters for program ID:', programId);
        const response = await fetch(`${STUDENT_API_BASE_URL}/admin/programs/${programId}/semesters`);
        
        if (!response.ok) {
            console.error('Failed to load semesters. Status:', response.status);
            throw new Error('Failed to load semesters');
        }
        
        const semesters = await response.json();
        console.log('Semesters API response:', semesters);
        
        // Filter only active semesters
        const activeSemesters = semesters.filter(s => s.active === true);
        console.log('Active semesters:', activeSemesters);
        
        // Populate dropdown
        activeSemesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester.id;
            option.textContent = semester.name;
            semesterSelect.appendChild(option);
        });
        
        semesterSelect.disabled = false;
        console.log('Semester dropdown populated with', activeSemesters.length, 'options');
        
        return activeSemesters; // Return the semesters
        
    } catch (error) {
        console.error("Error loading semesters:", error);
        showMessage("Failed to load semesters for this program.", "error");
        semesterSelect.disabled = false;
        return [];
    }
}

// ================= MESSAGE =================
function showMessage(msg, type) {
    const box = document.getElementById("formMessage");
    box.textContent = msg;
    box.className = `message-container ${type}`;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 3000);
}

// ================= CLOSE MODAL =================
document.querySelector(".modal-close").onclick = () => {
    document.getElementById("studentPanel").classList.remove("show");
    editingStudentId = null;
    resetStudentForm();
};

// ================= RUN INIT =================
document.addEventListener("DOMContentLoaded", initStudentPage);
// Add this test function at the bottom of your file

