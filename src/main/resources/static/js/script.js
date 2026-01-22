document.addEventListener("DOMContentLoaded", function () {

    // 👁 Toggle password visibility
    document.querySelectorAll(".toggle-pass").forEach(icon => {
        icon.addEventListener("click", () => {
            const target = document.getElementById(icon.dataset.target);
            if (!target)
                return;

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
        if (!sidebar)
            return;

        if (window.innerWidth < 700) {
            sidebar.classList.toggle("open");
            return;
        }

        if (window.innerWidth < 1100)
            return; // no toggle
        sidebar.classList.toggle("collapsed");
    };

    function autoCollapseSidebar() {
        if (!sidebar)
            return;

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
    // OTP Modal Functions
    // ==========================

    // OTP Modal functions
    function closeOtpModal() {
        const otpModal = document.getElementById('otpVerificationModal');
        if (otpModal)
            otpModal.classList.remove('show');
    }

function resendOtp() {
    const email = document.getElementById('otpEmail').value;

    fetch('/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'email=' + encodeURIComponent(email)
    }).then(() => {
        alert('OTP resent successfully!');
    });
}

    // Auto-focus OTP input when modal opens
    const otpModal = document.getElementById('otpVerificationModal');

    if (otpModal) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                        mutation.attributeName === 'class' &&
                        otpModal.classList.contains('show')
                        ) {
                    const otpInput = otpModal.querySelector('input[name="otp"]');
                    if (otpInput) {
                        setTimeout(() => otpInput.focus(), 100);
                    }
                }
            });
        });

        observer.observe(otpModal, {attributes: true});
    }


    // Auto-advance OTP input
  document.addEventListener('input', function (e) {
    if (
        e.target.name === 'otp' &&
        e.target.value.length === 6 &&
        e.target.form &&
        e.target.form.method.toLowerCase() === 'post' &&
        e.target.form.action.endsWith('/verify-otp')
    ) {
        e.target.form.submit();
    }
});


    // ==========================
    // Make OTP functions available globally
    // ==========================
    window.closeOtpModal = closeOtpModal;
    window.resendOtp = resendOtp;

});
function handlePasswordSubmit(event) {

  const form = document.getElementById("changePasswordForm");
  const errorBox = document.getElementById("changePasswordError");

  // OTP reset → NORMAL submit
  if (form.action.endsWith("/reset-password-otp")) {
    return;
  }

  // ALL other modes → AJAX
  event.preventDefault();

  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {

    if (!data.success) {
      errorBox.textContent = data.message;
      errorBox.style.display = "block";
      setTimeout(() => errorBox.style.display = "none", 3000);
      return;
    }

    // 🔥 Dashboard success
    if (form.action.endsWith("/change-password-auth")) {
      Swal.fire("Success", "Password updated successfully", "success");
      document.getElementById("changePasswordModal").classList.remove("show");
      form.reset();
      return;
    }

    // 🔥 First-login success
    window.location.href = "/login?passwordChanged=true";
  })
  .catch(() => {
    errorBox.textContent = "Something went wrong. Try again.";
    errorBox.style.display = "block";
  });
}
