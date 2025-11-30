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
