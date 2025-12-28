// Student Profile JavaScript
// Don't redeclare STUDENT_API_BASE_URL - use the one from student.js
// const STUDENT_API_BASE_URL = "http://localhost:8080/api"; // REMOVE THIS LINE

console.log("studentprofile.js loaded");

// Use existing STUDENT_API_BASE_URL or fallback
const PROFILE_API_BASE_URL = window.STUDENT_API_BASE_URL || "http://localhost:8080/api";

// ================= INIT STUDENT PROFILE =================
function initStudentProfile() {
    console.log("Initializing student profile...");
    
    // Debug: Check if localStorage has data
    const studentDataString = localStorage.getItem('currentStudentProfile');
    console.log("Student data from localStorage:", studentDataString);
    
    if (!studentDataString) {
        console.error("No student data found in localStorage!");
        showProfileMessage("Student data not found!", "error");
        return;
    }
    
    let studentData;
    try {
        studentData = JSON.parse(studentDataString);
        console.log("Parsed student data:", studentData);
    } catch (error) {
        console.error("Error parsing student data:", error);
        showProfileMessage("Error parsing student data!", "error");
        return;
    }
    
    if (!studentData) {
        console.error("Parsed student data is null!");
        showProfileMessage("Student data is empty!", "error");
        return;
    }
    
    // Debug: Check if DOM elements exist
    console.log("Checking DOM elements:");
    console.log("student-id element:", document.getElementById("student-id"));
    console.log(".student-name element:", document.querySelector(".student-name"));
    console.log("department element:", document.getElementById("department"));
    console.log("semester element:", document.getElementById("semester"));
    console.log("batch element:", document.getElementById("batch"));
    
    // Populate student data
    populateStudentData(studentData);
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup tabs
    setupTabs();
    
    console.log("Student profile initialized for:", studentData.fullName);
}

// ================= POPULATE STUDENT DATA =================
function populateStudentData(student) {
    console.log("Populating data for student:", student);
    
    // Basic Information
    const studentIdElement = document.getElementById("student-id");
    const studentNameElement = document.querySelector(".student-name");
    const departmentElement = document.getElementById("department");
    const semesterElement = document.getElementById("semester");
    const batchElement = document.getElementById("batch");
    
    if (studentIdElement) {
        studentIdElement.textContent = student.studentId || "-";
        console.log("Set student ID to:", student.studentId);
    } else {
        console.error("student-id element not found!");
    }
    
    if (studentNameElement) {
        studentNameElement.textContent = student.fullName || "-";
        console.log("Set student name to:", student.fullName);
    } else {
        console.error(".student-name element not found!");
    }
    
    if (departmentElement) {
        departmentElement.textContent = student.faculty || "-";
        console.log("Set department to:", student.faculty);
    } else {
        console.error("department element not found!");
    }
    
    if (semesterElement) {
        semesterElement.textContent = student.semester || "-";
        console.log("Set semester to:", student.semester);
    } else {
        console.error("semester element not found!");
    }
    
    if (batchElement) {
        batchElement.textContent = student.batch || "-";
        console.log("Set batch to:", student.batch);
    } else {
        console.error("batch element not found!");
    }
    
    // Update status badge
    const statusBadge = document.querySelector(".badge-status");
    if (statusBadge) {
        statusBadge.innerHTML = `<i class="fas fa-circle"></i> ${student.status || 'Inactive'}`;
        statusBadge.className = `badge badge-status ${student.status === 'Active' ? 'active' : 'inactive'}`;
        console.log("Set status to:", student.status);
    } else {
        console.error(".badge-status element not found!");
    }
    
    // Contact Information
    const emailElement = document.getElementById("student-email");
    const phoneElement = document.getElementById("student-phone");
    const addressElement = document.getElementById("student-address");
    
    if (emailElement) {
        emailElement.textContent = student.email || "-";
        console.log("Set email to:", student.email);
    } else {
        console.error("student-email element not found!");
    }
    
    if (phoneElement) {
        phoneElement.textContent = student.contact || "-";
        console.log("Set phone to:", student.contact);
    } else {
        console.error("student-phone element not found!");
    }
    
    if (addressElement) {
        addressElement.textContent = student.address || "-";
        console.log("Set address to:", student.address);
    } else {
        console.error("student-address element not found!");
    }
}

// ================= SETUP EVENT LISTENERS =================
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    // Back button
    const backButton = document.querySelector(".btn-back");
    if (backButton) {
        console.log("Back button found");
        backButton.addEventListener("click", function() {
            console.log("Back button clicked");
            // Go back to student list
            loadStudentListPage();
        });
    } else {
        console.error(".btn-back element not found!");
    }
    
    // Edit button
    const editButton = document.querySelector(".btn-edit");
    if (editButton) {
        console.log("Edit button found");
        editButton.addEventListener("click", function() {
            console.log("Edit button clicked");
            const studentData = JSON.parse(localStorage.getItem('currentStudentProfile'));
            if (studentData && studentData.id) {
                console.log("Calling editStudent with ID:", studentData.id);
                // Call edit function from student.js
                if (window.editStudent) {
                    window.editStudent(studentData.id);
                } else {
                    console.error("window.editStudent is not defined!");
                }
            }
        });
    } else {
        console.error(".btn-edit element not found!");
    }
}

// ================= LOAD STUDENT LIST PAGE =================
function loadStudentListPage() {
    console.log("Loading student list page...");
    fetch('/pages/student.html')
        .then(res => res.ok ? res.text() : "<h3 class='text-danger'>Page Not Found</h3>")
        .then(html => {
            const area = document.getElementById("content-area");
            if (!area) {
                console.error("content-area element not found!");
                return;
            }
            
            area.innerHTML = html;
            
            // Load student list JavaScript
            const script = document.createElement('script');
            script.src = '/js/student.js';
            script.onload = function() {
                console.log("student.js loaded");
                if (window.initStudentPage) {
                    window.initStudentPage();
                }
            };
            document.body.appendChild(script);
        })
        .catch(error => {
            console.error("Error loading student list:", error);
        });
}

// ================= SETUP TABS =================
function setupTabs() {
    console.log("Setting up tabs...");
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    console.log("Found tab buttons:", tabButtons.length);
    
    if (tabButtons.length === 0) {
        console.error("No tab buttons found!");
        return;
    }
    
    tabButtons.forEach((button, index) => {
        console.log(`Tab button ${index}:`, button.getAttribute('data-tab'));
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetTab = this.getAttribute('data-tab');
            console.log("Switching to tab:", targetTab);
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Show target tab pane
            const targetPane = document.getElementById(targetTab + '-tab');
            if (targetPane) {
                targetPane.classList.add('active');
                console.log("Tab pane shown:", targetTab + '-tab');
            } else {
                console.error("Tab pane not found:", targetTab + '-tab');
            }
        });
    });
    
    // Set first tab as active if none is active
    const activeButtons = document.querySelectorAll('.tab-btn.active');
    if (activeButtons.length === 0 && tabButtons.length > 0) {
        console.log("No active tab found, activating first tab");
        tabButtons[0].classList.add('active');
        const firstTab = tabButtons[0].getAttribute('data-tab');
        const firstPane = document.getElementById(firstTab + '-tab');
        if (firstPane) {
            firstPane.classList.add('active');
            console.log("First tab activated:", firstTab);
        }
    }
}

// ================= SHOW MESSAGE =================
function showProfileMessage(msg, type) {
    console.log("Showing message:", msg, type);
    // Create message element if it doesn't exist
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
    
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 3000);
}

// ================= MAKE FUNCTIONS GLOBALLY AVAILABLE =================
// Define globally BEFORE calling initStudentProfile
window.initStudentProfile = initStudentProfile;
window.loadStudentListPage = loadStudentListPage;
window.showProfileMessage = showProfileMessage;

console.log("Functions exposed to window:", {
    initStudentProfile: typeof window.initStudentProfile,
    loadStudentListPage: typeof window.loadStudentListPage,
    showProfileMessage: typeof window.showProfileMessage
});

// Auto-initialize if student-id element exists
console.log("Checking if we should auto-initialize...");
console.log("document.getElementById('student-id'):", document.getElementById('student-id'));

if (document.getElementById("student-id")) {
    console.log("Student profile page detected, initializing...");
    // Wait a bit for DOM to be ready
    setTimeout(function() {
        console.log("Auto-initializing student profile...");
        initStudentProfile();
    }, 100);
} else {
    console.log("Not a student profile page (student-id element not found)");
}