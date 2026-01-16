// This script will be extracted and executed by dashboard.html
console.log('Evaluation dashboard script content loaded');

// In evdashboard.html, update the loadStudentTeachers function:
async function loadStudentTeachers() {
    console.log('loadStudentTeachers function called');
    
    const container = document.getElementById('teachersContainer');
    if (!container) {
        console.error('Teachers container not found');
        return;
    }
    
    try {
        // Get username from topbar
        const topTitle = document.querySelector(".top-title");
        let username = topTitle?.dataset?.username;
        
        if (!username) {
            // Try to get from window.currentUser
            if (window.currentUser && window.currentUser.username) {
                username = window.currentUser.username;
            } else {
                // Try localStorage
                const cachedUser = localStorage.getItem('currentUser');
                if (cachedUser) {
                    username = JSON.parse(cachedUser).username;
                }
            }
        }
        
        if (!username) {
            console.error('Username not found');
            container.innerHTML = `
                <div class="empty-state error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Please log in to view teachers</p>
                </div>
            `;
            return;
        }
        
        console.log('Fetching student data for:', username);
        
        // Get student data
        const studentRes = await fetch(`/api/students/profile/${username}`);
        if (!studentRes.ok) {
            throw new Error('Failed to fetch student data');
        }
        
        const student = await studentRes.json();
        console.log('Student data:', student);
        
        if (!student.program || !student.semester) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>You are not enrolled in any program or semester</p>
                </div>
            `;
            return;
        }
        
        // Get teacher-course pairs using the NEW endpoint
        const teacherCoursesRes = await fetch(`/api/students/${student.id}/teacher-courses`);
        if (!teacherCoursesRes.ok) {
            throw new Error('Failed to fetch teacher courses');
        }
        
        const teacherCourses = await teacherCoursesRes.json();
        console.log('Teacher courses data:', teacherCourses);
        
        // Render teacher-course cards
        if (!teacherCourses || teacherCourses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <p>No teachers/courses found for your program and semester</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = teacherCourses.map(tc => `
            <div class="eval-card">
            <div class="aavatar">
  <i class="fas fa-user"></i>
</div>
                <h4>${tc.teacherName || 'Unknown Teacher'}</h4>
                <p class="teacher-info">
                    <strong>Course:</strong>  ${tc.courseName || 'No course name'}
                   
                </p>
                <button onclick="evaluateTeacherCourse(${tc.teacherId}, ${student.id}, ${tc.courseId})">
                    Evaluate Course 
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error in loadStudentTeachers:', error);
        const container = document.getElementById('teachersContainer');
        if (container) {
            container.innerHTML = `
                <div class="empty-state error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading teacher courses: ${error.message}</p>
                    <button onclick="loadStudentTeachers()" class="retry-btn">
                        <i class="fas fa-redo"></i> Retry
                    </button>
                </div>
            `;
        }
    }
}


function evaluateTeacherCourse(teacherId, studentId, courseId, isCompleted = false) {
    console.log('Evaluating teacher:', teacherId, 'for course:', courseId, 'by student:', studentId);

    if (isCompleted) {
        alert('You have already evaluated this course.');
        return;
    }

    // Store context for EvaluationForm.js
    const evaluationContext = {
        teacherId: Number(teacherId),
        studentId: Number(studentId),
        courseId: Number(courseId),
        timestamp: Date.now()
    };

    sessionStorage.setItem('evaluationContext', JSON.stringify(evaluationContext));

    // Navigate (works inside dashboard.html + also works when opened directly)
    if (typeof loadPage === "function") {
        loadPage('/pages/EvaluationForm.html');
    } else {
        window.location.href = '/pages/EvaluationForm.html';
    }
}

// Initialize function
function initEvalDashboard() {
    console.log('initEvalDashboard called');
    loadStudentTeachers();
}

// Register functions globally
window.loadStudentTeachers = loadStudentTeachers;
window.evaluateTeacherCourse = evaluateTeacherCourse;
window.initEvalDashboard = initEvalDashboard;

console.log('Evaluation dashboard functions registered');

//// Show admin button if user is admin
//if (currentUser.role === 'Admin') {
//    document.getElementById('adminBtn').style.display = 'block';
//}

// Admin button click handler
function loadAdminEvaluationPage() {
    window.location.href = '/pages/evaluation/AdminEvaluation.html';
}