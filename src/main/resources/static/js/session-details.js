// session-details.js - Fixed version
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
    if (element) element.textContent = value;
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
    // Update basic info
    safeUpdate('courseTitle', session.course || 'No Course');
    safeUpdate('sessionId', session.id || 'N/A');
    safeUpdate('faculty', session.faculty || 'Not specified');
    safeUpdate('semester', session.semester || 'Not specified');
    safeUpdate('createdDate', formatDate(session.createdDate));
    
    // Display days
    displayDays(session.days || []);
    
    // Update stats
    updateStats(session.days || []);
}

function displayDays(days) {
    const container = document.getElementById('daysTableContainer');
    if (!container) return;
    
    if (!days || days.length === 0) {
        container.innerHTML = '<div class="empty-state">No days planned</div>';
        return;
    }
    
    // Sort by day_number
    const sortedDays = [...days].sort((a, b) => (a.day_number || 0) - (b.day_number || 0));
    
    let html = `
        <table class="days-table">
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Method</th>
                    <th>Topic</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sortedDays.forEach(day => {
        const dayNum = day.day_number !== undefined ? day.day_number : (day.day || '');
        const method = day.method || 'Lecture';
        const topic = day.topic || '-';
        const description = day.description || '-';
        
        html += `
            <tr>
                <td class="day-cell">Day ${dayNum}</td>
                <td><span class="method-badge">${method}</span></td>
                <td>${topic}</td>
                <td>${description}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
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