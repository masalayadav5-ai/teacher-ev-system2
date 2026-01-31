// ================================
// Unified Authentication Helper
// ================================

let _currentUserPromise = null;

async function getCurrentUser() {
  if (_currentUserPromise) return _currentUserPromise;

  _currentUserPromise = fetch("/admin/api/userinfo", {
    credentials: "include"
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to fetch user info");
      return res.json();
    })
    .then(user => {
      if (!user?.role) return null;

      // ✅ NORMALIZED USER OBJECT (ONLY THIS SHAPE)
      return {
        role: user.role,
        username: user.username || user.fullName || "User",

        teacherId: user.teacherDbId ?? null,
        studentId: user.studentId ?? null,
        programId: user.programId ?? null,
        semesterId: user.semesterId ?? null
      };
    })
    .catch(err => {
      console.error("Auth error:", err);
      _currentUserPromise = null;
      return null;
    });

  return _currentUserPromise;
}

// ================================
// Global Auth API (SAFE)
// ================================

window.Auth = {
  getCurrentUser,

  isAuthenticated: async function () {
    const user = await getCurrentUser();
    return !!user;
  },

  getUserRole: async function () {
    const user = await getCurrentUser();
    return user?.role ?? null;
  },

  requireAuth: async function () {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = "/login";
      return false;
    }
    return true;
  },

  logout: function () {
    fetch("/logout", {
      method: "POST",
      credentials: "include"
    }).finally(() => {
      window.location.href = "/login";
    });
  }
};

window.Auth = { getCurrentUser };
window.getCurrentUser = getCurrentUser; // legacy support