package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.model.Teacher;
import com.college.academic.evaluationsystem.model.TeacherCourseHistory;
import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import com.college.academic.evaluationsystem.repository.TeacherCourseHistoryRepository;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import com.college.academic.evaluationsystem.service.SessionPlanService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import java.util.UUID;
import java.util.stream.Collectors;

@Controller
//@RequestMapping("/admin")
public class AdminController {

    @Autowired
    private TeacherCourseHistoryRepository historyRepository;
    @Autowired
    private StudentEvaluationRepository studentEvaluationRepository;

    @Autowired
    private UserRepository repo;
    @Autowired
    private SessionPlanService sessionPlanService;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // MAIN ADMIN DASHBOARD
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("username", "Admin");
        return "dashboard"; // Loads dashboard.html layout
    }

    // STATIC PAGES
    @GetMapping("/student")
    public String studentPage() {
        return "redirect:/pages/student.html";
    }

    @GetMapping("/teachers")
    public String teacherPage() {
        return "redirect:/pages/teachers.html";
    }

    @GetMapping("/evaluation")
    public String evaluationPage() {
        return "redirect:/pages/evaluation.html";
    }

    @GetMapping("/session-planner")
    public String sessionPlannerPage() {
        return "redirect:/pages/session-planner.html";
    }

    @GetMapping("/settings")
    public String settingsPage() {
        return "redirect:/pages/settings.html";
    }

    //------------------------------------
    // CREATE USER
    //------------------------------------
    @PostMapping("/create-user")
    @ResponseBody
    public String createUser(@RequestParam String username, @RequestParam String email) {

        if (repo.findByUsername(username).isPresent()) {
            return "username_exists";
        }
        if (repo.findByEmail(email).isPresent()) {
            return "email_exists";
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);

        String tempPassword = UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        // enable immediately
        user.setStatus("Pending"); // default status
        user.setFirstLogin(true);

        repo.save(user);

        String body = String.format("""
                Hello %s,
                
                Your account has been created.
                Temporary Password: %s
                
                You can login and change your password.
                """, username, tempPassword);

        emailService.sendSimpleMessage(email, "Account Created", body);

        return "ok";
    }

    // ===================== TOGGLE USER STATUS =====================
    @PutMapping("/users/{id}/status")
    @ResponseBody
    public String toggleUserStatus(@PathVariable Long id) {
        User user = repo.findById(id).orElse(null);
        if (user == null) {
            return "User not found";
        }

        // Toggle between "Pending" and "Active"
        String newStatus = "Pending".equals(user.getStatus()) ? "Active" : "Pending";
        user.setStatus(newStatus);

        repo.save(user);
        return "ok";
    }
    //------------------------------------
    // NEW: USER INFO ENDPOINT FOR STATIC PAGES
    //------------------------------------

    @GetMapping("/admin/api/userinfo")
    @ResponseBody
    public Map<String, Object> getLoggedInUserInfo(Authentication authentication) {
        Map<String, Object> map = new HashMap<>();
        if (authentication == null) {
            return map;
        }

        // Use the injected 'repo' instead of UserRepository (static)
        User user = repo.findByUsername(authentication.getName()).orElse(null);
        if (user == null) {
            return map;
        }

        map.put("userId", user.getId());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());

        switch (user.getRole()) {
            case "STUDENT":
                studentRepository.findByUserId(user.getId()).ifPresent(s -> {

                    map.put("studentId", s.getId());
                    map.put("fullName", s.getFullName());
                    map.put("contact", s.getContact());
                    map.put("address", s.getAddress());
                    map.put("batch", s.getBatchLabel());

                    // 🔥 ADD THESE (IDs for frontend logic)
                    if (s.getProgram() != null) {
                        map.put("programId", s.getProgram().getId());
                        map.put("programName", s.getProgram().getName());
                    }

                    if (s.getSemester() != null) {
                        map.put("semesterId", s.getSemester().getId());
                        map.put("semesterName", s.getSemester().getName());
                    }

                    // (Optional legacy fields — keep if used elsewhere)
                    map.put("semester", s.getSemester() != null ? s.getSemester().getName() : "-");
                    map.put("department", s.getProgram() != null ? s.getProgram().getName() : "-");

                });
                break;

            case "TEACHER":
                teacherRepository.findByUserId(user.getId()).ifPresent(t -> {

                    // 🔥 IMPORTANT: return BOTH ids
                    map.put("teacherDbId", t.getId());           // numeric DB id (for API URLs)
                    map.put("teacherCode", t.getTeacherId());   // string code like "23" (for matching)

                    map.put("fullName", t.getFullName());
                    map.put("contact", t.getContact());
                    map.put("address", t.getAddress());
                    map.put("department", t.getProgram() != null ? t.getProgram().getName() : "-");
                });
                break;

            case "ADMIN":
                map.put("fullName", user.getUsername());
                map.put("contact", "-");
                map.put("address", "-");
                map.put("department", "-");
                break;
        }

        return map;
    }

    @GetMapping("/api/admin/activity/recent")
    @ResponseBody
    public List<Map<String, Object>> getRecentActivities() {

        List<TeacherCourseHistory> list
                = historyRepository.findTop5ByOrderByAssignedAtDesc();

        List<Map<String, Object>> result = new ArrayList<>();

        for (TeacherCourseHistory h : list) {
            Map<String, Object> m = new HashMap<>();
            m.put("teacher", h.getTeacher().getFullName());
            m.put("course", h.getCourse().getName());
            m.put("action", h.getRemovedAt() == null ? "Assigned" : "Removed");
            m.put("date", h.getAssignedAt());
            result.add(m);
        }

        return result;
    }

    @GetMapping("/api/admin/teachers/leaderboard")
    @ResponseBody
    public List<Map<String, Object>> getTeacherLeaderboard() {

        List<Object[]> rows
                = studentEvaluationRepository.getTeacherLeaderboard();

        List<Map<String, Object>> result = new ArrayList<>();

        int rank = 1;
        for (Object[] r : rows.stream().limit(5).toList()) {

            Long teacherId = (Long) r[0];
            Double avg = (Double) r[1];

            Teacher t = teacherRepository.findById(teacherId).orElse(null);

            Map<String, Object> m = new HashMap<>();
            m.put("rank", rank++);
            m.put("teacher", t != null ? t.getFullName() : "Unknown");
            m.put("avg", Math.round(avg * 10) / 10.0);

            result.add(m);
        }

        return result;
    }

    @GetMapping("/api/evaluation/student/{studentId}/weekly-stats")
    @ResponseBody
    public Map<String, Object> getWeeklyStats(@PathVariable Long studentId) {

        LocalDate weekStart = LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters
                        .previousOrSame(java.time.DayOfWeek.SUNDAY));

        List<StudentEvaluation> list
                = studentEvaluationRepository
                        .findByStudentIdAndWeekStart(studentId, weekStart);

        long pending;

      // 🔥 FIX: pending = active courses - submitted courses
List<TeacherCourseHistory> activeCourses =
        historyRepository.findActiveCoursesByStudent(studentId);

Set<Long> submittedCourseIds = list.stream()
        .filter(e -> Boolean.TRUE.equals(e.getIsSubmitted()))
        .map(StudentEvaluation::getCourseId)
        .collect(Collectors.toSet());

pending = activeCourses.stream()

        .filter(h -> !submittedCourseIds.contains(h.getCourse().getId()))
        .count();


        long completed = list.stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsSubmitted()))
                .count();

        Set<Long> courseIds = list.stream()
                .map(StudentEvaluation::getCourseId)
                .collect(Collectors.toSet());

      if (courseIds.isEmpty()) {

    List<TeacherCourseHistory> active =
        historyRepository.findActiveCoursesByStudent(studentId);

    // ✅ reuse existing submittedCourseIds
    active = active.stream()
        .filter(h -> !submittedCourseIds.contains(h.getCourse().getId()))
        .toList();

    courseIds = active.stream()
        .map(h -> h.getCourse().getId())
        .collect(Collectors.toSet());

    completed = submittedCourseIds.size();
}


        Map<String, Object> res = new HashMap<>();
        res.put("pending", pending);
        res.put("completed", completed);
       List<TeacherCourseHistory> activeCoursesAll
        = historyRepository.findActiveCoursesByStudent(studentId);


       res.put("coursesCount", activeCoursesAll.size());


        long sessionPlans
                = sessionPlanService.findForStudent(studentId).size();

        res.put("sessionPlans", sessionPlans);

        return res;
    }

    @GetMapping("/api/evaluation/student/{studentId}/weekly-pending-courses")
    @ResponseBody
    public List<Map<String, Object>> getWeeklyPendingCourses(
            @PathVariable Long studentId) {

        LocalDate weekStart = LocalDate.now()
                .with(java.time.temporal.TemporalAdjusters
                        .previousOrSame(java.time.DayOfWeek.SUNDAY));

        List<StudentEvaluation> list
                = studentEvaluationRepository
                        .findByStudentIdAndWeekStart(studentId, weekStart);

        List<StudentEvaluation> pending
                = list.stream()
                        .filter(e -> !Boolean.TRUE.equals(e.getIsSubmitted()))
                        .toList();

        // 🔥 FALLBACK if no evaluation rows exist yet
        // 🔥 FALLBACK: show only THIS student's active courses not yet evaluated
        if (pending.isEmpty()) {

            // 1️⃣ Get only courses assigned to THIS student
            List<TeacherCourseHistory> active
                    = historyRepository.findActiveCoursesByStudent(studentId);

            // 2️⃣ Exclude courses already evaluated this week
            Set<Long> evaluatedCourseIds = list.stream()
                    .filter(e -> Boolean.TRUE.equals(e.getIsSubmitted()))
                    .map(StudentEvaluation::getCourseId)
                    .collect(Collectors.toSet());

            active = active.stream()
                    .filter(h -> !evaluatedCourseIds.contains(h.getCourse().getId()))
                    .toList();

            // 3️⃣ Build response
            return active.stream()
                    .map(h -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("courseId", h.getCourse().getId());
                        m.put("courseName", h.getCourse().getName());
                        return m;
                    })
                    .collect(Collectors.toList());
        }

        return pending.stream()
                .map(e -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("courseId", e.getCourseId());

                    TeacherCourseHistory h
                            = historyRepository.findLatestActiveAssignment(
                                    e.getTeacherId(), e.getCourseId()
                            );

                    m.put("courseName",
                            h != null ? h.getCourse().getName() : "Unknown Course");

                    return m;
                })
                .collect(Collectors.toList());
    }

}
