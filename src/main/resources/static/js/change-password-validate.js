function initPasswordValidation() {
window.initPasswordValidation = initPasswordValidation;
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordMatchMessage = document.getElementById('passwordMatchMessage');
  const sameAsOldFlag = document.getElementById("sameAsOld");

  if (!newPassword || !confirmPassword || !passwordMatchMessage) return;

  let hasUserEdited = false;

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  function showError(msg) {
    passwordMatchMessage.textContent = msg;
    passwordMatchMessage.className = 'password-match error';
  }

  function showSuccess(msg) {
    if (!hasUserEdited) return;
    passwordMatchMessage.textContent = msg;
    passwordMatchMessage.className = 'password-match success';
  }

  function clearMessage() {
    passwordMatchMessage.textContent = '';
    passwordMatchMessage.className = 'password-match';
  }

function validatePasswords() {
  const password = newPassword.value;
  const confirm = confirmPassword.value;

  clearMessage();
  if (!password || !confirm) return;

  if (sameAsOldFlag?.value === "true") {
    showError("New password cannot be the same as your old password.");
    return; // 👈 STOP here
  }

  if (!strongPasswordRegex.test(password)) {
    showError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
    return;
  }

  if (password !== confirm) {
    showError("Passwords do not match");
    return;
  }

  showSuccess("Strong password ✔");
}

  newPassword.oninput = () => {
    hasUserEdited = true;
    sameAsOldFlag.value = "false";
    validatePasswords();
  };

  confirmPassword.oninput = () => {
    hasUserEdited = true;
    validatePasswords();
  };
}

function handlePasswordSubmit(event) {
    window.handlePasswordSubmit = handlePasswordSubmit;

  const form = event.target;

  const errorBox = form.querySelector("#changePasswordError");
  const matchBox = form.querySelector("#passwordMatchMessage");

  // OTP reset must be NORMAL submit
// OTP reset should be handled by JS too (because server returns JSON)
  event.preventDefault();

  if (errorBox) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
  }

  const formData = new FormData(form);

  fetch(form.action, {
    method: "POST",
    body: formData,
    headers: { "X-Requested-With": "XMLHttpRequest" }
  })
    .then(async (res) => {
      // if redirected to login => session expired
      if (res.redirected || res.url.includes("/login")) throw new Error("SESSION_EXPIRED");

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) throw new Error("NOT_JSON");

      return res.json();
    })
    .then((data) => {
      if (!data.success) {
        if (errorBox) {
          errorBox.textContent = data.message || "Password update failed.";
          errorBox.style.display = "block";
        }
        return;
      }

      Swal.fire("Success", "Password updated successfully", "success");
if (form.action.endsWith("/reset-password-otp")) {
    window.location.href = "/login?passwordChanged=true";
    return;
  }
      document.getElementById("dashboardChangePasswordModal")?.classList.remove("show");
      document.getElementById("changePasswordModal")?.classList.remove("show");
      document.body.style.overflow = "";

      form.reset();
      if (matchBox) matchBox.textContent = "";
    })
    .catch((err) => {
      console.error(err);
      if (errorBox) {
        errorBox.textContent =
          err.message === "SESSION_EXPIRED"
            ? "Session expired. Please login again."
            : "Server error. Try again later.";
        errorBox.style.display = "block";
      }
    });
}
// ✅ Listener comes AFTER function definition
document.addEventListener("submit", function (e) {
  const form = e.target;
  if (!form.classList?.contains("js-change-password-form")) return;

//  if (form.action.endsWith("/reset-password-otp")) return; // normal submit

  e.preventDefault();
  handlePasswordSubmit(e);
});
