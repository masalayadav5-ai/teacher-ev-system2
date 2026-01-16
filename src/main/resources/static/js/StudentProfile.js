// ================= STUDENT PROFILE JAVASCRIPT =================
console.log("studentprofile.js loaded");

// Use existing STUDENT_API_BASE_URL or fallback
window.PROFILE_API_BASE_URL = window.STUDENT_API_BASE_URL || "http://localhost:8080/api";

// ================= INIT STUDENT PROFILE =================
function initStudentProfile() {
    const mode = sessionStorage.getItem("profileMode") || "SELF";
    console.log("Profile mode:", mode);

    if (mode === "SELF") {
        loadLoggedInUserProfile();
    } else{
        loadSelectedProfile();
    }
    setupTabs();          // ✅ ADD THIS
    setupEventListeners();
}

function loadSelectedProfile() {
    const selectedDataString = localStorage.getItem('currentSelectedProfile');
    if (!selectedDataString) {
        console.error("No selected profile in storage!");
        return;
    }

    const data = JSON.parse(selectedDataString);

    const role = sessionStorage.getItem("profileMode") || "STUDENT";

    const profile = {
        studentId: data.studentId || null,
        teacherId: data.teacherId || null,
        fullName: data.fullName,
        email: data.email || "-",
        contact: data.contact || "-",
        address: data.address || "-",
        batch: data.batch || "-",
        program: user.program || null,
  semester: user.semester || null,
  faculty: user.program?.name || "-",
        status: data.status || "Active"
    };

    populateProfile(profile, role);
}



// ================= LOAD LOGGED-IN USER PROFILE =================
function loadLoggedInUserProfile() {
    fetch("/api/userinfo")
        .then(res => res.ok ? res.json() : Promise.reject("Unauthorized"))
        .then(user => {
            const role = user.role || "STUDENT";

            const profile = {
                studentId: user.studentId || null,
                teacherId: user.teacherId || null,
                fullName: user.fullName || user.username,
                email: user.email || "-",
                contact: user.contact || "-",
                address: user.address || "-",
                faculty: user.program?.name || "-",      // <-- correct mapping
                batch: user.batch || "-",
                semester: user.semester || "-",
                status: "Active"
            };

            populateProfile(profile, role);

            // Remove back button for self-profile
            document.querySelector(".btn-back")?.remove();
        })
        .catch(err => console.error(err));
}



// ================= POPULATE STUDENT DATA =================
function populateProfile(user, role) {
    console.log("Populating profile for:", user, role);

    // Main fields
    const studentIdElem = document.getElementById("student-id");
    const nameElem = document.querySelector(".student-name");
    const deptElem = document.getElementById("department");
    const semesterElem = document.getElementById("semester");
    const batchElem = document.getElementById("batch");
    const emailElem = document.getElementById("student-email");
    const phoneElem = document.getElementById("student-phone");
    const addressElem = document.getElementById("student-address");
    const statusBadge = document.querySelector(".badge-status");

    if (studentIdElem) studentIdElem.textContent = user.studentId || user.teacherId || "-";
    if (nameElem) nameElem.textContent = user.fullName || "-";
    if (deptElem) {
    deptElem.textContent = user.program ? `${user.program.code} - ${user.program.name}` : user.faculty || "-";
    }
    if (semesterElem) semesterElem.textContent = user.semester?.name || "-";
    if (batchElem) batchElem.textContent = user.batch || "-";
    if (emailElem) emailElem.textContent = user.email || "-";
    if (phoneElem) phoneElem.textContent = user.contact || "-";
    if (addressElem) addressElem.textContent = user.address || "-";

    if (statusBadge) {
        statusBadge.textContent = user.status || "-";
        statusBadge.className = `badge badge-status ${user.status === "Active" ? "active" : "inactive"}`;
    }

    // Hide student-only tabs for teacher/admin
    if (role !== "STUDENT") {
        document.querySelectorAll(".info-card, .tab-btn, .tab-pane").forEach(el => {
            if (el.dataset?.tab && ["academic","performance","attendance","documents"].includes(el.dataset.tab)) {
                el.style.display = "none";
            }
        });
    }
}

// ================= SETUP EVENT LISTENERS =================
function setupEventListeners() {
    const backButton = document.querySelector(".btn-back");
    if (backButton) {
        backButton.addEventListener("click", loadStudentListPage);
    }

    const editButton = document.querySelector(".btn-edit");
    if (editButton) {
        editButton.addEventListener("click", () => {
            const studentData = JSON.parse(localStorage.getItem('currentStudentProfile'));
            if (studentData && studentData.id && window.editStudent) {
                window.editStudent(studentData.id);
            }
        });
    }
}

// ================= LOAD STUDENT LIST PAGE =================
function loadStudentListPage() {
    fetch('/pages/student.html')
        .then(res => res.ok ? res.text() : "<h3 class='text-danger'>Page Not Found</h3>")
        .then(html => {
            const area = document.getElementById("content-area");
            if (!area) return;
            area.innerHTML = html;

            const script = document.createElement('script');
            script.src = '/js/student.js';
            script.onload = () => { if (window.initStudentPage) window.initStudentPage(); };
            document.body.appendChild(script);
        })
        .catch(console.error);
}

// ================= SETUP TABS =================
function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (!tabButtons.length) return;

    tabButtons.forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const targetTab = btn.getAttribute('data-tab');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            const targetPane = document.getElementById(targetTab + '-tab');
            if (targetPane) targetPane.classList.add('active');
        });
    });

    // Activate first tab if none active
    const active = document.querySelector('.tab-btn.active');
    if (!active && tabButtons.length) {
        tabButtons[0].classList.add('active');
        const firstPane = document.getElementById(tabButtons[0].getAttribute('data-tab') + '-tab');
        if (firstPane) firstPane.classList.add('active');
    }
}

// ================= SHOW PROFILE MESSAGE =================
function showProfileMessage(msg, type) {
    let messageBox = document.getElementById("profileMessage");
    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "profileMessage";
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 9999;
            min-width: 200px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(messageBox);
    }
    messageBox.textContent = msg;
    messageBox.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
    messageBox.style.display = 'block';
    setTimeout(() => messageBox.style.display = 'none', 3000);
}

// ================= MAKE FUNCTIONS GLOBALLY AVAILABLE =================
window.initStudentProfile = initStudentProfile;
window.loadStudentListPage = loadStudentListPage;
window.showProfileMessage = showProfileMessage;

// ================= AUTO-INITIALIZE =================
if (document.getElementById("student-id")) {
    setTimeout(initStudentProfile, 100);
}