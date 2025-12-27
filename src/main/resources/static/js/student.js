// ================= API BASE URL =================
const API_BASE_URL = "http://localhost:8080/api";
let editingStudentId = null;

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
    const res = await fetch(`${API_BASE_URL}/students`);
    const students = await res.json();

    studentTableBody.innerHTML = "";

    if (!students.length) {
        studentTableBody.innerHTML = `<tr><td colspan="6" align="center">No students found</td></tr>`;
        return;
    }

    students.slice().reverse().forEach(s => {
        studentTableBody.innerHTML += `
        <tr>
            <td>${s.studentId}</td>
            <td>${s.fullName}</td>
            <td>${s.faculty}</td>
            <td>${s.semester}</td>
            <td><span class="badge ${s.status.toLowerCase()}">${s.status}</span></td>
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
    const res = await fetch(`${API_BASE_URL}/students/stats`);
    const stats = await res.json();
    document.getElementById("totalStudents").textContent = stats.total;
    document.getElementById("activeStudents").textContent = stats.active;
    document.getElementById("pendingStudents").textContent = stats.pending;
}

// ================= ADD STUDENT =================
function openAddStudent() {
    editingStudentId = null;
    const studentForm = document.getElementById("studentForm");
    studentForm.reset();

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
async function editStudent(id) {
    const res = await fetch(`${API_BASE_URL}/students`);
    const students = await res.json();
    const s = students.find(st => st.id === id);
    if (!s) return;

    editingStudentId = id;
    document.querySelector(".modal-header h2").textContent = "Edit Student";
    document.getElementById("submitStudentBtn").textContent = "Update";

    document.getElementById("fullName").value = s.fullName;
    document.getElementById("studentId").value = s.studentId;

    const studentIdInput = document.getElementById("studentId");
    studentIdInput.disabled = true;
    studentIdInput.style.backgroundColor = "#f3f3f3";

    document.getElementById("username").value = s.username;
    document.getElementById("address").value = s.address || "";
    document.getElementById("contact").value = s.contact;
    document.getElementById("faculty").value = s.faculty;
    document.getElementById("semester").value = s.semester;
    document.getElementById("batch").value = s.batch;
    document.getElementById("email").value = s.email;

    document.getElementById("passwordRow").style.display = "none";
    document.getElementById("confirmPasswordRow").style.display = "none";

    document.getElementById("studentPanel").classList.add("show");
}

// ================= VIEW STUDENT =================
async function viewStudent(id) {
    const res = await fetch(`${API_BASE_URL}/students`);
    const students = await res.json();
    const s = students.find(st => st.id === id);
    if (!s) return alert("Student not found!");

    alert(`Student Profile
------------------------
Name: ${s.fullName}
ID: ${s.studentId}
Username: ${s.username}
Faculty: ${s.faculty}
Semester: ${s.semester}
Batch: ${s.batch}
Contact: ${s.contact}
Email: ${s.email}
Status: ${s.status}`);
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
    document.getElementById("studentForm").reset();
    editingStudentId = null;
};

// ================= RUN INIT =================
document.addEventListener("DOMContentLoaded", initStudentPage);
