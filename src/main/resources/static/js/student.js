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
        <td>${s.faculty}</td>
        <td>${s.semester}</td>

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
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
        const response = await fetch(`${STUDENT_API_BASE_URL}/students/${id}/hide`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(result.message || "Student hidden successfully!", "success");
            loadStudents(); // Refresh table
            loadStatistics();
        } else {
            showMessage(result.message || "Failed to hide student!", "error");
        }
    } catch (error) {
        console.error("Error hiding student:", error);
        showMessage("Server error! Could not hide student.", "error");
    }
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
    const res = await fetch(`${STUDENT_API_BASE_URL}/students`);
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
