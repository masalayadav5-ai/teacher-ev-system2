package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.model.Student;
import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class LoginController {

    private static final Logger logger = LoggerFactory.getLogger(LoginController.class);
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailService emailService;

    // 🔒 Strong password regex
    private static final String STRONG_PASSWORD_REGEX =
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";

     private void updateBothUserAndStudent(User user, String newPassword) {
    // Update User table (encoded)
    user.setPassword(passwordEncoder.encode(newPassword));
    user.setFirstLogin(false);
    user.setStatus("Active");
    userRepository.save(user);

    // Update Student table (plain text)
  
}
    // =========================
    // LOGIN PAGE
    // =========================
    @GetMapping("/login")
    public String showLoginPage(
            @RequestParam(required = false) Boolean firstLogin,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String error,
            @RequestParam(required = false) String passwordChanged,
            HttpServletRequest request,
            Model model) {

        if (Boolean.TRUE.equals(firstLogin) && userId != null) {
            model.addAttribute("forcePasswordChange", true);
            model.addAttribute("userId", userId);

            if (error != null) {
                model.addAttribute("error", error);
            }
        }

        if (passwordChanged != null) {
            model.addAttribute("passwordChanged", true);
        }

        return "login";
    }

    // =========================
    // CHANGE PASSWORD
    // =========================
    @PostMapping("/change-password")
    @Transactional
    public String processChangePassword(
            @RequestParam Long userId,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            Model model) {

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            return returnError(model, "User not found", userId);
        }

        // 1️⃣ Check password match
        if (!newPassword.equals(confirmPassword)) {
            return returnError(model, "Passwords do not match", userId);
        }

        // 2️⃣ Strong password validation
        if (!newPassword.matches(STRONG_PASSWORD_REGEX)) {
            return returnError(
                    model,
                    "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
                    userId
            );
        }

        // 3️⃣ Update User table (ENCODED) and student(plain )
        updateBothUserAndStudent(user, newPassword);

        return "redirect:/login?passwordChanged=true";
    }

    // =========================
    // COMMON ERROR HANDLER
    // =========================
    private String returnError(Model model, String message, Long userId) {
        model.addAttribute("error", message);
        model.addAttribute("forcePasswordChange", true);
        model.addAttribute("userId", userId);
        return "login";
    }

    // =========================
    // DEBUG ENDPOINT
    // =========================
    @GetMapping("/debug-redirect")
    @ResponseBody
    public String debugRedirect(HttpServletRequest request) {
        return "URL: " + request.getRequestURL()
                + "<br>Query: " + request.getQueryString();
    }
 
@PostMapping("/forgot-password")
public String sendOtp(
        @RequestParam String email,
        Model model,
        RedirectAttributes redirectAttributes) {

    User user = userRepository.findByEmail(email).orElse(null);

    // For security, always show success message even if email doesn't exist
    model.addAttribute("otpSent", true);
    model.addAttribute("email", email);

    if (user == null) {
        logger.warn("Forgot password attempt for non-existent email: {}", email);
        // Still show "otp sent" message but don't actually send email
        return "login";
    }

    // Generate 6-digit OTP
    String otp = String.format("%06d", new Random().nextInt(999999));

    user.setOtp(otp);
    user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
    userRepository.save(user);

    String body = """
            Hello %s,
            
            Your OTP for password reset is: %s
            
            This OTP is valid for 5 minutes.
            Do not share it with anyone.
            
            - SmarTeach Team
            """.formatted(user.getUsername(), otp);

    boolean emailSent = emailService.sendSimpleMessage(
            user.getEmail(),
            "SmarTeach Password Reset OTP",
            body
    );

    if (!emailSent) {
        model.addAttribute("emailError", "Failed to send OTP. Please try again.");
    }

    return "login";
}

    @PostMapping("/verify-otp")
    public String verifyOtp(
            @RequestParam String email,
            @RequestParam String otp,
            Model model) {

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null ||
            user.getOtp() == null ||
            !user.getOtp().equals(otp) ||
            user.getOtpExpiry().isBefore(LocalDateTime.now())) {

            model.addAttribute("otpError", "Invalid or expired OTP");
            model.addAttribute("otpSent", true);
            model.addAttribute("email", email);
            return "login";
        }

        model.addAttribute("otpVerified", true);
        model.addAttribute("forcePasswordChange", true);
        model.addAttribute("userId", user.getId());
        return "login";
    }
 
    @PostMapping("/reset-password-otp")
    @Transactional
    public String resetPasswordWithOtp(
            @RequestParam Long userId,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword,
            Model model) {

        User user = userRepository.findById(userId).orElse(null);

        if (user == null) {
            model.addAttribute("error", "User not found");
            return "login";
        }

        if (!newPassword.equals(confirmPassword)) {
            model.addAttribute("otpVerified", true);
            model.addAttribute("userId", userId);
            model.addAttribute("error", "Passwords do not match");
            return "login";
        }

        if (!newPassword.matches(STRONG_PASSWORD_REGEX)) {
            model.addAttribute("otpVerified", true);
            model.addAttribute("userId", userId);
            model.addAttribute("error",
                    "Password must be strong (uppercase, lowercase, number, symbol)");
            return "login";
        }
        
            // Use helper method
    updateBothUserAndStudent(user, newPassword);

        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "redirect:/login?passwordChanged=true";
    }
    
}