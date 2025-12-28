document.addEventListener("DOMContentLoaded", () => {
    const topTitle = document.querySelector(".top-title");
    if (!topTitle) return;

    const username = localStorage.getItem("username");
    const role = localStorage.getItem("userRole");

    if (username && role) {
        topTitle.textContent = `Welcome, ${username} (${role})`;
    } else {
        topTitle.textContent = "Welcome!";
    }
});
