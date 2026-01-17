
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

//package com.college.academic.evaluationsystem.controller;
//
@Controller
public class DashboardController {

    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }
}

//import org.springframework.stereotype.Controller;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.security.access.prepost.PreAuthorize;
//
//@Controller
//public class PageController {
//
//    // ===================== ADMIN ONLY =====================
//
//    @GetMapping("/pages/academic-management.html")
//    @PreAuthorize("hasRole('ADMIN')")
//    public String academicManagement() {
//        return "pages/academic-management";
//    }
//
//    @GetMapping("/pages/student.html")
//    @PreAuthorize("hasRole('ADMIN')")
//    public String studentsPage() {
//        return "pages/student";
//    }
//
//    @GetMapping("/pages/teacher.html")
//    @PreAuthorize("hasRole('ADMIN')")
//    public String teachersPage() {
//        return "pages/teacher";
//    }
//
//    @GetMapping("/pages/AdminEvaluationAnalytics.html")
//    @PreAuthorize("hasRole('ADMIN')")
//    public String adminEvaluationAnalytics() {
//        return "pages/AdminEvaluationAnalytics";
//    }
//
//    // ===================== STUDENT =====================
//
//    @GetMapping("/pages/evaldashboard.html")
//    @PreAuthorize("hasAnyRole('STUDENT','ADMIN')")
//    public String evaluationDashboard() {
//        return "pages/evaldashboard";
//    }
//
//    // ===================== STUDENT + TEACHER =====================
//
//    @GetMapping("/pages/sessionplan.html")
//    @PreAuthorize("hasAnyRole('STUDENT','TEACHER','ADMIN')")
//    public String sessionPlanner() {
//        return "pages/sessionplan";
//    }
//
//    // ===================== COMMON =====================
//
//    @GetMapping("/pages/dashboard-content.html")
//    @PreAuthorize("isAuthenticated()")
//    public String dashboardContent() {
//        return "pages/dashboard-content";
//    }
//}
