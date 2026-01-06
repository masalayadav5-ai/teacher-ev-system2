document.addEventListener("DOMContentLoaded", function () {

    // 👁 Toggle password visibility
    document.querySelectorAll(".toggle-pass").forEach(icon => {
        icon.addEventListener("click", () => {
            const target = document.getElementById(icon.dataset.target);
            if (!target) return;

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

    // ==========================
    // Sidebar toggle
    // ==========================
    const sidebar = document.getElementById("sidebar");

    window.toggleSidebar = function () {
        if (!sidebar) return;

        if (window.innerWidth < 700) {
            sidebar.classList.toggle("open");
            return;
        }

        if (window.innerWidth < 1100) return; // no toggle
        sidebar.classList.toggle("collapsed");
    };

    function autoCollapseSidebar() {
        if (!sidebar) return;

        if (window.innerWidth < 700) {
            sidebar.classList.remove("collapsed");
            return;
        }

        if (window.innerWidth < 1200) {
            sidebar.classList.add("collapsed");
        } else {
            sidebar.classList.remove("collapsed");
        }
    }

    window.addEventListener("load", autoCollapseSidebar);
    window.addEventListener("resize", autoCollapseSidebar);

    // ==========================
    // Forgot Password Modal
    // ==========================
    const forgotLink = document.getElementById("forgotPasswordLink");
    const forgotModal = document.getElementById("forgotPasswordModal");
    const closeForgot = document.getElementById("closeForgotModal");

    if (forgotLink && forgotModal && closeForgot) {
        forgotLink.addEventListener("click", function (e) {
            e.preventDefault();
            forgotModal.classList.add("show");
        });

        closeForgot.addEventListener("click", function () {
            forgotModal.classList.remove("show");
        });
    }

    // ==========================
    // Force Change Password Modal
    // ==========================
    const changePasswordModal = document.getElementById("changePasswordModal");
    if (changePasswordModal && changePasswordModal.classList.contains("show")) {
        changePasswordModal.style.display = "flex";
    }

    // ==========================
    // OTP Modal Functions
    // ==========================
    
    // OTP Modal functions
    function closeOtpModal() {
        const otpModal = document.getElementById('otpVerificationModal');
        if (otpModal) otpModal.classList.remove('show');
    }
    
    function resendOtp() {
        const email = document.getElementById('otpEmail').value;
        if (email) {
            fetch('/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'email=' + encodeURIComponent(email)
            }).then(() => {
                alert('OTP resent successfully!');
            });
        }
    }
    
    // Auto-focus OTP input when modal opens
    const otpModal = document.getElementById('otpVerificationModal');
    if (otpModal) {
        // Using MutationObserver to detect when modal becomes visible
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    if (otpModal.classList.contains('show')) {
                        const otpInput = otpModal.querySelector('input[name="otp"]');
                        if (otpInput) {
                            setTimeout(() => otpInput.focus(), 100);
                        }
                    }
                }
            });
        });
        
        observer.observe(otpModal, { attributes: true });
    }
    
    // Auto-advance OTP input
    document.addEventListener('input', function(e) {
        if (e.target.name === 'otp' && e.target.value.length === 6) {
            // Optional: auto-submit after 6 digits
            setTimeout(() => {
                if (e.target.form) {
                    e.target.form.submit();
                }
            }, 500);
        }
    });

    // ==========================
    // Make OTP functions available globally
    // ==========================
    window.closeOtpModal = closeOtpModal;
    window.resendOtp = resendOtp;

});