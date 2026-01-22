
/* ---------------- TAB SWITCHING ---------------- */
function initSettingsTabs() {
  const menu = document.querySelectorAll(".settings-menu li");
  const sections = document.querySelectorAll(".settings-section");

  menu.forEach(item => {
    item.addEventListener("click", () => {
      menu.forEach(i => i.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      item.classList.add("active");
      document.getElementById(`tab-${item.dataset.tab}`).classList.add("active");
    });
  });
}

/* ---------------- SAVE SETTINGS ---------------- */
 function initSaveSettings() {
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {

    const settings = {
      institutionName: institutionName.value,
      establishedYear: establishedYear.value,
       evaluationFrequency: evaluationFrequency.value.toUpperCase()
    };

    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    }).then(() => {
      Swal.fire("Saved", "System settings updated", "success");
    });
  });
}

/* ---------------- SECURITY ---------------- */
function initSecurityButton() {
  const btn = document.getElementById("openChangePassword");
  const modal = document.getElementById("changePasswordModal");

  if (!btn || !modal) return;

  btn.addEventListener("click", () => {
    modal.classList.add("show");

    // Reset form state when opening from settings
    document.getElementById("changePasswordForm")?.reset();
    document.getElementById("passwordMatchMessage").textContent = "";
  });
}


/* ---------------- SYSTEM INFO ---------------- */
function initSystemInfo() {
  setInterval(() => {
    document.getElementById("serverTime").textContent =
      new Date().toLocaleString();
  }, 1000);
}
 
function loadSystemSettings() {
  fetch("/api/settings")
    .then(res => res.json())
    .then(data => {

      // Fill form values
      institutionName.value = data.institutionName;
      establishedYear.value = data.establishedYear;
      evaluationFrequency.value = data.evaluationFrequency.toLowerCase();

      })
    .catch(err => console.error("Failed to load settings", err));
}
function resetSettingsTabs() {
  document.querySelectorAll(".settings-menu li").forEach(li =>
    li.classList.remove("active")
  );
  document.querySelectorAll(".settings-section").forEach(sec =>
    sec.classList.remove("active")
  );

  document.querySelector('.settings-menu li[data-tab="general"]').classList.add("active");
  document.getElementById("tab-general").classList.add("active");
}

function initSettings() {
  initSettingsTabs();
  initSaveSettings();
  initSystemInfo();
  initSecurityButton();
  loadSystemSettings();
  resetSettingsTabs();
}
