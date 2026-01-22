function initPasswordValidation() {

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
  event.preventDefault();   // 🔥 THIS stops redirect

  const newPassword = document.getElementById("newPassword");
  const confirmPassword = document.getElementById("confirmPassword");
  const errorBox = document.getElementById("changePasswordError");
  const sameAsOldFlag = document.getElementById("sameAsOld");
  const passwordMatchMessage = document.getElementById("passwordMatchMessage");

  errorBox.style.display = "none";
  errorBox.textContent = "";

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const password = newPassword.value;
  const confirm = confirmPassword.value;

  if (!password || !confirm) {
    errorBox.textContent = "Please fill in both fields.";
    errorBox.style.display = "block";
    return;
  }

  if (sameAsOldFlag?.value === "true") {
    errorBox.textContent = "New password cannot be the same as your old password.";
    errorBox.style.display = "block";
    return;
  }

  if (!strongPasswordRegex.test(password)) {
    errorBox.textContent =
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    errorBox.style.display = "block";
    return;
  }

  if (password !== confirm) {
    errorBox.textContent = "Passwords do not match.";
    errorBox.style.display = "block";
    return;
  }

  fetch("/change-password-auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      newPassword: password,
      confirmPassword: confirm
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      Swal.fire({
        icon: "success",
        title: "Password Changed",
        text: "Your password has been updated successfully"
      });

      document.getElementById("changePasswordModal")
        .classList.remove("show");

      newPassword.value = "";
      confirmPassword.value = "";
      passwordMatchMessage.textContent = "";
      passwordMatchMessage.className = "password-match";
    } else {
      errorBox.textContent = data.message || "Password update failed.";
      errorBox.style.display = "block";
    }
  })
  .catch(err => {
    console.error("Password change error:", err);
    errorBox.textContent = "Server error. Try again later.";
    errorBox.style.display = "block";
  });
}

