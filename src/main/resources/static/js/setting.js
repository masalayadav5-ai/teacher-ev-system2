/* ---------------- TAB SWITCHING ---------------- */
function initSettingsTabs() {
  const menuItems = document.querySelectorAll(".settings-menu li");
  const sections = document.querySelectorAll(".settings-section");
  if (!menuItems.length || !sections.length) return;

  menuItems.forEach(item => {
    item.onclick = () => {
      menuItems.forEach(i => i.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      item.classList.add("active");
      document.getElementById(`tab-${item.dataset.tab}`)?.classList.add("active");
    };
  });
}

/* ---------------- ROLE ACCESS ---------------- */
function applySettingsRoleAccess(role) {
  const isAdmin = role === "ADMIN";

  const institutionName = document.getElementById("institutionName");
  const establishedYear = document.getElementById("establishedYear");
  const evaluationFrequency = document.getElementById("evaluationFrequency");
  const saveBtn = document.getElementById("saveSettingsBtn");

  if (!institutionName || !establishedYear || !evaluationFrequency || !saveBtn) return;

  // ✅ Admin can edit these two only
  institutionName.disabled = !isAdmin;
  establishedYear.disabled = !isAdmin;

  // ✅ Student Evaluation Frequency: READ-ONLY for everyone (admin too)
  evaluationFrequency.disabled = true;

  // ✅ Save button only for admin
  saveBtn.style.display = isAdmin ? "" : "none";
}
/* ---------------- LOAD SETTINGS ---------------- */
function loadSystemSettings() {
  fetch("/api/settings")
    .then(res => res.json())
    .then(data => {
      const institutionName = document.getElementById("institutionName");
      const establishedYear = document.getElementById("establishedYear");
      const evaluationFrequency = document.getElementById("evaluationFrequency");

      if (institutionName) institutionName.value = data.institutionName ?? "";
      if (establishedYear) establishedYear.value = data.establishedYear ?? "";
      if (evaluationFrequency) evaluationFrequency.value = (data.evaluationFrequency ?? "WEEKLY").toLowerCase();
    })
    .catch(err => console.error("Failed to load settings", err));
}

/* ---------------- SAVE SETTINGS (ADMIN ONLY) ---------------- */
function initSaveSettings() {
  const btn = document.getElementById("saveSettingsBtn");
  if (!btn) return;

  // avoid multiple click bindings when modal opened many times
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  btn.addEventListener("click", async () => {
    const institutionName = document.getElementById("institutionName");
    const establishedYear = document.getElementById("establishedYear");
    const evaluationFrequency = document.getElementById("evaluationFrequency");

    const settings = {
      institutionName: institutionName?.value ?? "",
      establishedYear: establishedYear?.value ?? "",
      evaluationFrequency: (evaluationFrequency?.value ?? "weekly").toUpperCase()
    };

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    if (!res.ok) {
      Swal.fire("Error", "Only admin can update settings", "error");
      return;
    }

    Swal.fire("Saved", "System settings updated", "success");
  });
}

/* ---------------- SYSTEM INFO ---------------- */
function initSystemInfo() {
  const el = document.getElementById("serverTime");
  if (!el) return;

  setInterval(() => {
    el.textContent = new Date().toLocaleString();
  }, 1000);
}

function resetSettingsTabs() {
  document.querySelectorAll(".settings-menu li").forEach(li => li.classList.remove("active"));
  document.querySelectorAll(".settings-section").forEach(sec => sec.classList.remove("active"));

  document.querySelector('.settings-menu li[data-tab="general"]')?.classList.add("active");
  document.getElementById("tab-general")?.classList.add("active");
}

/* ---------------- INIT SETTINGS ---------------- */
function initSettings() {
  initSettingsTabs();
  initSystemInfo();
  loadSystemSettings();
  resetSettingsTabs();

  const role =
    window.currentUser?.role ||
    JSON.parse(localStorage.getItem("currentUser") || "{}")?.role ||
    "STUDENT";

  applySettingsRoleAccess(role);

  // ✅ Only admin gets save handler
  if (role === "ADMIN") initSaveSettings();
}