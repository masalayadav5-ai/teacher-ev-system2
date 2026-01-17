// topbar.js
document.addEventListener("DOMContentLoaded", async () => {

    const topTitle = document.querySelector(".top-title");
    const avatarBtn = document.getElementById("avatarBtn");

    try {
        const res = await fetch("/admin/api/userinfo");
        if (!res.ok)
            throw new Error("Not authenticated");

        const userData = await res.json();

        // 🔹 Top title
        topTitle.textContent = `Welcome, ${userData.username} (${userData.role})`;

        // 🔹 Store globally
        window.currentUser = userData;
        localStorage.setItem("currentUser", JSON.stringify(userData));
        applyRoleBasedUI(userData.role);

        // 🔹 Determine display name
        // Prefer fullName → fallback to username
        const displayName =
                userData.fullName ||
                userData.name ||
                userData.username ||
                "U";

        // 🔹 Avatar first letter
        if (avatarBtn) {
            avatarBtn.textContent = displayName.charAt(0).toUpperCase();
        }

        console.log("User loaded:", userData);

    } catch (err) {
        console.error("Failed to load user info:", err);
        topTitle.textContent = "Welcome!";

        // 🔹 Fallback from localStorage
        const cached = localStorage.getItem("currentUser");
        if (cached) {
            const userData = JSON.parse(cached);
            window.currentUser = userData;

            const displayName =
                    userData.fullName ||
                    userData.name ||
                    userData.username ||
                    "U";

            if (avatarBtn) {
                avatarBtn.textContent = displayName.charAt(0).toUpperCase();
            }
        }
    }
  // ================= ROLE BASED PAGE PROTECTION =================

});
function protectPage(allowedRoles = []) {
    const checkAccess = () => {
        const role = window.currentUser?.role;

        if (!role) {
            console.warn("User not loaded yet, retrying protectPage...");
            setTimeout(checkAccess, 50); // retry shortly
            return;
        }

        if (!allowedRoles.includes(role)) {
            console.warn("Access denied for role:", role);

            if (typeof loadPage === "function") {
                loadPage('/pages/dashboard-content.html');
            }

            if (window.Swal) {
                Swal.fire(
                    "Access Denied",
                    "You are not allowed to access this page",
                    "error"
                );
            }
        }
    };

    checkAccess();
}
