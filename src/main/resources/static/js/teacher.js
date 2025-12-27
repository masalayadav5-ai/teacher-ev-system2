// ================= API BASE URL =================
const API_BASE_URL = "http://localhost:8080/api";
let editingStudentId = null;

// ================= INIT STUDENT PAGE =================
function initStudentPage() {
    console.log("Initializing student page...");
    
    const submitStudentBtn = document.getElementById("submitStudentBtn");
    const studentForm = document.getElementById("studentForm");
    const searchStudent = document.getElementById("searchStudent");
    const studentPanel = document.getElementById("studentPanel");
    const studentTableBody = document.getElementById("studentTableBody");
    
    // Check if required elements exist
    if (!studentTableBody) {
        console.error("Student table body not found!");
        return;
    }

    // ===== Batch Dropdown =====
    const batchSelect = document.getElementById("batch");
    if (batchSelect) {
        const currentYear = new Date().getFullYear();
        batchSelect.innerHTML = `<option value="">-- Select Batch --</option>`;
        for (let y = currentYear; y >= currentYear - 10; y--) {
            batchSelect.innerHTML += `<option value="${y}">${y}</option>`;
        }
    }

    loadStudents();
    loadStatistics();

    // ================= SUBMIT (ADD / UPDATE) =================
    if (submitStudentBtn) {
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
            if (!fullName || !fullName.value.trim() || !studentId || !studentId.value.trim() || 
                !contact || !contact.value.trim() || !faculty || !faculty.value.trim() || 
                !semester || !semester.value.trim() || !batch || !batch.value.trim() ||
                !email || !email.value.trim() || !username || !username.value.trim()) {
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
                const res = await fetch(`${API_BASE_URL}/students`);
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
                faculty: faculty.value.trim(),
                semester: semester.value.trim(),
                batch: batch.value.trim(),
                email: email.value.trim(),
                status: "Pending"
            };

            if (!editingStudentId && password.value) {
                studentData.password = password.value;
            }

            const url = editingStudentId
                ? `${API_BASE_URL}/students/${editingStudentId}`
                : `${API_BASE_URL}/students`;

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

                    if (studentForm) studentForm.reset();
                    editingStudentId = null;

                    const modalHeader = document.querySelector(".modal-header h2");
                    if (modalHeader) modalHeader.textContent = "Add Student";
                    submitStudentBtn.textContent = "Submit";

                    const passwordRow = document.getElementById("passwordRow");
                    const confirmPasswordRow = document.getElementById("confirmPasswordRow");
                    if (passwordRow) passwordRow.style.display = "block";
                    if (confirmPasswordRow) confirmPasswordRow.style.display = "block";

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
    }

    // ================= SEARCH =================
    if (searchStudent) {
        searchStudent.oninput = () => {
            const term = searchStudent.value.toLowerCase();
            const studentTableBody = document.getElementById("studentTableBody");
            if (studentTableBody) {
                [...studentTableBody.rows].forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(term) ? "" : "none";
                });
            }
        };
    }
}

// ================= LOAD STUDENTS =================
async function loadStudents() {
    const studentTableBody = document.getElementById("studentTableBody");
    if (!studentTableBody) {
        console.error("Cannot load students: studentTableBody not found");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/students`);
        const students = await res.json();

        studentTableBody.innerHTML = "";

        if (!students || !students.length) {
            studentTableBody.innerHTML = `<tr><td colspan="6" align="center">No students found</td></tr>`;
            return;
        }

        students.slice().reverse().forEach(s => {
            studentTableBody.innerHTML += `
            <tr>
                <td>${s.studentId || 'N/A'}</td>
                <td>${s.fullName || 'N/A'}</td>
                <td>${s.faculty || 'N/A'}</td>
                <td>${s.semester || 'N/A'}</td>
                <td><span class="badge ${s.status ? s.status.toLowerCase() : 'pending'}">${s.status || 'Pending'}</span></td>
                <td>
                    <button 
                        class="action-btn ${s.status === 'Pending' ? 'approve-btn' : 'pending-btn'}"
                        onclick="toggleStatus(${s.id}, '${s.status}')">
                        ${s.status === "Pending" ? "Approve" : "Pending"}
                    </button>
                    <button class="action-btn edit" onclick="editStudent(${s.id})">Edit</button>
                    <button class="action-btn view" onclick="viewStudent(${s.id})">View</button>
                </td>
            </tr>`;
        });
    } catch (error) {
        console.error("Failed to load students:", error);
        studentTableBody.innerHTML = `<tr><td colspan="6" align="center">Error loading students</td></tr>`;
    }
}

// ================= TOGGLE STATUS =================
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "Pending" ? "Active" : "Pending";

    try {
        const response = await fetch(`${API_BASE_URL}/students/${id}/status`, {
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
        const res = await fetch(`${API_BASE_URL}/students/stats`);
        const stats = await res.json();
        
        const totalEl = document.getElementById("totalStudents");
        const activeEl = document.getElementById("activeStudents");
        const pendingEl = document.getElementById("pendingStudents");
        
        if (totalEl) totalEl.textContent = stats.total || 0;
        if (activeEl) activeEl.textContent = stats.active || 0;
        if (pendingEl) pendingEl.textContent = stats.pending || 0;
    } catch (error) {
        console.error("Failed to load statistics:", error);
    }
}

// ================= ADD STUDENT =================
function openAddStudent() {
    editingStudentId = null;
    const studentForm = document.getElementById("studentForm");
    if (studentForm) studentForm.reset();

    const studentIdInput = document.getElementById("studentId");
    if (studentIdInput) {
        studentIdInput.disabled = false;
        studentIdInput.style.backgroundColor = "";
    }

    const modalHeader = document.querySelector(".modal-header h2");
    if (modalHeader) modalHeader.textContent = "Add Student";
    
    const submitBtn = document.getElementById("submitStudentBtn");
    if (submitBtn) submitBtn.textContent = "Submit";

    const passwordRow = document.getElementById("passwordRow");
    const confirmPasswordRow = document.getElementById("confirmPasswordRow");
    if (passwordRow) passwordRow.style.display = "block";
    if (confirmPasswordRow) confirmPasswordRow.style.display = "block";

    const studentPanel = document.getElementById("studentPanel");
    if (studentPanel) studentPanel.classList.add("show");
}

// ================= EDIT STUDENT =================
async function editStudent(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/students`);
        const students = await res.json();
        const s = students.find(st => st.id === id);
        if (!s) {
            showMessage("Student not found!", "error");
            return;
        }

        editingStudentId = id;
        
        const modalHeader = document.querySelector(".modal-header h2");
        if (modalHeader) modalHeader.textContent = "Edit Student";
        
        const submitBtn = document.getElementById("submitStudentBtn");
        if (submitBtn) submitBtn.textContent = "Update";

        document.getElementById("fullName").value = s.fullName || "";
        document.getElementById("studentId").value = s.studentId || "";

        const studentIdInput = document.getElementById("studentId");
        if (studentIdInput) {
            studentIdInput.disabled = true;
            studentIdInput.style.backgroundColor = "#f3f3f3";
        }

        document.getElementById("username").value = s.username || "";
        document.getElementById("address").value = s.address || "";
        document.getElementById("contact").value = s.contact || "";
        document.getElementById("faculty").value = s.faculty || "";
        document.getElementById("semester").value = s.semester || "";
        document.getElementById("batch").value = s.batch || "";
        document.getElementById("email").value = s.email || "";

        const passwordRow = document.getElementById("passwordRow");
        const confirmPasswordRow = document.getElementById("confirmPasswordRow");
        if (passwordRow) passwordRow.style.display = "none";
        if (confirmPasswordRow) confirmPasswordRow.style.display = "none";

        const studentPanel = document.getElementById("studentPanel");
        if (studentPanel) studentPanel.classList.add("show");
    } catch (error) {
        console.error("Failed to edit student:", error);
        showMessage("Failed to load student data!", "error");
    }
}

// ================= VIEW STUDENT =================
async function viewStudent(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/students`);
        const students = await res.json();
        const s = students.find(st => st.id === id);
        if (!s) {
            alert("Student not found!");
            return;
        }

        alert(`Student Profile
------------------------
Name: ${s.fullName || 'N/A'}
ID: ${s.studentId || 'N/A'}
Username: ${s.username || 'N/A'}
Faculty: ${s.faculty || 'N/A'}
Semester: ${s.semester || 'N/A'}
Batch: ${s.batch || 'N/A'}
Contact: ${s.contact || 'N/A'}
Email: ${s.email || 'N/A'}
Status: ${s.status || 'Pending'}`);
    } catch (error) {
        console.error("Failed to view student:", error);
        alert("Failed to load student data!");
    }
}

// ================= MESSAGE =================
function showMessage(msg, type) {
    const box = document.getElementById("formMessage");
    if (!box) {
        console.log(`${type.toUpperCase()}: ${msg}`);
        return;
    }
    
    box.textContent = msg;
    box.className = `message-container ${type}`;
    box.style.display = "block";
    setTimeout(() => box.style.display = "none", 3000);
}

// ================= CLOSE MODAL =================
document.addEventListener("DOMContentLoaded", function() {
    const closeBtn = document.querySelector(".modal-close");
    if (closeBtn) {
        closeBtn.onclick = () => {
            const studentPanel = document.getElementById("studentPanel");
            if (studentPanel) studentPanel.classList.remove("show");
            
            const studentForm = document.getElementById("studentForm");
            if (studentForm) studentForm.reset();
            
            editingStudentId = null;
        };
    }
});