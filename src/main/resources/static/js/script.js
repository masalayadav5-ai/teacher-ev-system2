document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".toggle-pass").forEach(icon => {
        icon.addEventListener("click", () => {

            let target = document.getElementById(icon.dataset.target);

            if (target.type === "password") {
                target.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                target.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });

});


function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");

    // MOBILE (<700px)
    if (window.innerWidth < 700) {
        sidebar.classList.toggle("open");
        return;
    }

    // MEDIUM SCREENS (700–1100px): manual toggle disabled
    if (window.innerWidth < 1100) {
        return; // collapsed automatically, no toggle
    }

    // DESKTOP (>1100px): normal toggle
    sidebar.classList.toggle("collapsed");
}


function autoCollapseSidebar() {
    const sidebar = document.getElementById("sidebar");

    if (window.innerWidth < 700) {
        sidebar.classList.remove("collapsed");
        return; // mobile mode controlled by toggle
    }

    if (window.innerWidth < 1200) {
        sidebar.classList.add("collapsed");
    } else {
        sidebar.classList.remove("collapsed");
    }
}

window.addEventListener("load", autoCollapseSidebar);
window.addEventListener("resize", autoCollapseSidebar);



