// topbar.js - Enhanced version
document.addEventListener("DOMContentLoaded", async () => {
    const topTitle = document.querySelector(".top-title");
    if (!topTitle) return;

    try {
        const res = await fetch("/admin/api/userinfo");
        const userData = await res.json();

        // Display in topbar
        topTitle.textContent = `Welcome, ${userData.username} (${userData.role})`;
        
        // Store user data globally for other pages to use
        window.currentUser = userData;
        
        // Also store in localStorage for persistence
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Add data attributes to topbar for easy extraction
        topTitle.dataset.username = userData.username;
        topTitle.dataset.role = userData.role;
        topTitle.dataset.userId = userData.userId || '0';
        if (userData.teacherId) {
            topTitle.dataset.teacherId = userData.teacherId;
        }
        
        console.log('User loaded:', userData);
        
    } catch (err) {
        console.error("Failed to load user info:", err);
        topTitle.textContent = "Welcome!";
        
        // Try to use cached data
        const cached = localStorage.getItem('currentUser');
        if (cached) {
            window.currentUser = JSON.parse(cached);
        }
    }
});