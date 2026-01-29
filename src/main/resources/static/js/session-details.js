// session-details.js - UPDATED
let isInitialized = false;

// Helper functions
function hideError() {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) errorContainer.style.display = 'none';
}

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.style.display = 'block';
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) errorMessage.textContent = message;
    }
}

function safeUpdate(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) element.textContent = value || 'Not specified';
}

function formatDate(dateString) {
    if (!dateString) return 'Not available';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        return 'Invalid date';
    }
}

// Main function to load session details
function loadSessionDetails(sessionId) {
    console.log('Loading session details for ID:', sessionId);
    
    hideError();
    
    // Show loading
    const daysContainer = document.getElementById('daysTableContainer');
    if (daysContainer) {
        daysContainer.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading session plan...</p>
            </div>
        `;
    }
    
    // Fetch from your actual API endpoint
    fetch(`/api/session-plans/${sessionId}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(session => {
            console.log('Session data:', session);
            updateSessionUI(session);
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showError('Failed to load session details. Please try again.');
        });
}

function updateSessionUI(session) {
    // Update basic info - FIXED: Extract nested object properties
    safeUpdate('courseTitle', session.course?.name || session.course || 'No Course');
    safeUpdate('sessionId', session.id || 'N/A');
    
    // FIX: Extract program name from nested object
    const programName = session.program?.name || 'Not specified';
    safeUpdate('faculty', programName);
    
    // FIX: Extract semester name from nested object
    const semesterName = session.semester?.name || 'Not specified';
    safeUpdate('semester', semesterName);
    
    safeUpdate('createdDate', formatDate(session.createdDate));
    
    // Display days
    displayDays(session.days || []);
    
    // Update stats
    updateStats(session.days || []);
}

function displayDays(days) {
    const container = document.getElementById('daysTableContainer');
    if (!container) return;

    const isTeacher = window.currentUser?.role === "TEACHER";

    if (!days || days.length === 0) {
        container.innerHTML = '<div class="empty-state">No days planned</div>';
        return;
    }

    const sortedDays = [...days].sort(
        (a, b) => (a.day_number || 0) - (b.day_number || 0)
    );

    let html = `
    <table class="days-table">
        <thead>
            <tr>
                <th>Day</th>
                <th>Topic</th>
                <th>Description</th>
                <th>Method</th>
                <th>Status</th>
                <th>Remarks</th>
                ${isTeacher ? "<th>Action</th>" : ""}
            </tr>
        </thead>
        <tbody>
    `;

    sortedDays.forEach(day => {
        const isCompleted = day.completed === true;

        html += `
        <tr>
            <td>Day ${day.day_number}</td>

            <td>
              ${isTeacher && !isCompleted
                ? `<input class="topic-input" value="${day.topic || ''}">`
                : day.topic || ''}
            </td>

            <td>
              ${isTeacher && !isCompleted
                ? `<textarea class="desc-input">${day.description || ''}</textarea>`
                : day.description || ''}
            </td>

            <td>
              ${isTeacher && !isCompleted
                ? `
                  <select class="method-input">
                    <option ${day.method==="Lecture"?"selected":""}>Lecture</option>
                    <option ${day.method==="Tutorial"?"selected":""}>Tutorial</option>
                    <option ${day.method==="Practical"?"selected":""}>Practical</option>
                  </select>
                  `
                : `<span class="method-badge">${day.method || ''}</span>`}
            </td>

            <td>
                ${
                    day.completed
                        ? `<span class="status completed">Completed</span>`
                        : `<span class="status pending">Pending</span>`
                }
            </td>

 <td>
  ${
    isTeacher
      ? (isCompleted
          ? `<span class="remarks-readonly">${day.remarks || "-"}</span>`
          : `<textarea class="remarks">${day.remarks || ""}</textarea>`
        )
      : (day.remarks || "-")
  }
</td>





         ${isTeacher ? `
<td>
  <div class="action-cell">

    <button class="btn-update"
      onclick="updateDay(${day.id}, this)">
      Update
    </button>

    <button class="btn-complete ${isCompleted ? "locked" : ""}"
      ${isCompleted ? "disabled" : ""}
      onclick="completeDay(${day.id}, this)">
      ${isCompleted ? "Completed" : "Complete"}
    </button>

  </div>
</td>` : ""}



        </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}



function updateStats(days) {
    const totalDays = days.length;
    safeUpdate('totalDays', totalDays);
    
    const daysBadge = document.getElementById('daysCountBadge');
    if (daysBadge) {
        daysBadge.textContent = `${totalDays} day${totalDays !== 1 ? 's' : ''}`;
    }
    
    const methods = [...new Set(days.map(d => d.method).filter(Boolean))];
    safeUpdate('methodsList', methods.length ? methods.join(', ') : 'None');
}

// Initialize based on URL parameters
function initSessionDetails() {
    if (isInitialized) return;
    isInitialized = true;
    
    console.log('Initializing session details');
    
    if (localStorage.getItem("role") === "TEACHER") {
    document.querySelector(".info-note")?.remove();
}
    // Get ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');
    
    console.log('Session ID from URL:', sessionId);
    
    if (sessionId) {
        setTimeout(() => loadSessionDetails(sessionId), 100);
    } else {
        showError('No session ID found in URL');
    }
}

// Navigation functions
window.goBackToSessions = function() {
    console.log('Navigating back to sessions');
    if (typeof loadPage === 'function') {
        loadPage('/pages/sessionplan.html');
    } else {
        window.location.href = '/pages/sessionplan.html';
    }
};

window.retryLoad = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');
    if (sessionId) loadSessionDetails(sessionId);
};

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSessionDetails);
} else {
    initSessionDetails();
}
function updateDay(dayId, btn) {
    const row = btn.closest("tr");

    const topic = row.querySelector(".topic-input")?.value;
    const description = row.querySelector(".desc-input")?.value;
    const method = row.querySelector(".method-input")?.value;
    const remarks = row.querySelector(".remarks")?.value;

    fetch(`/api/session-plans/day/${dayId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            topic,
            description,
            method,
            remarks,
            completed: false   // ❗ DO NOT lock here
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Update failed");
        alert("Day updated successfully");
    })
    .catch(err => alert(err.message));
}

function completeDay(dayId, btn) {
    const row = btn.closest("tr");

    const topic = row.querySelector(".topic-input")?.value;
    const description = row.querySelector(".desc-input")?.value;
    const method = row.querySelector(".method-input")?.value;
    const remarks = row.querySelector(".remarks")?.value;

    fetch(`/api/session-plans/day/${dayId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            topic,
            description,
            method,
            remarks,
            completed: true   // 🔒 LOCK HERE
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Complete failed");

        alert("Day marked as completed");

        // 🔒 Disable inputs
        row.querySelectorAll("input, textarea, select").forEach(el => {
            el.disabled = true;
        });

        // 🔒 Disable buttons
        row.querySelector(".btn-complete").disabled = true;
        row.querySelector(".btn-complete").textContent = "Completed";
        row.querySelector(".btn-complete").classList.add("locked");

        row.querySelector(".btn-update").disabled = true;
        row.querySelector(".btn-update").classList.add("locked");

        // 🔒 Update status text
        const statusCell = row.querySelector(".status");
        if (statusCell) {
            statusCell.textContent = "Completed";
            statusCell.classList.remove("pending");
            statusCell.classList.add("completed");
        }
    })
    .catch(err => alert(err.message));
}
