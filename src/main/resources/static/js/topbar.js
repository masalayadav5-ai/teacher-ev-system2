document.addEventListener("DOMContentLoaded", async () => {
    const topTitle = document.querySelector(".top-title");
    if (!topTitle) return;

    try {
const res = await fetch("/admin/api/userinfo");
        const data = await res.json();

        const username = data.username || "Guest";
        const role = data.role || "USER";

        topTitle.textContent = `Welcome, ${username} (${role})`;
    } catch (err) {
        console.error("Failed to load user info:", err);
        topTitle.textContent = "Welcome!";
    }
});
