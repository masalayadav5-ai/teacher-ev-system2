package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.User;

import com.college.academic.evaluationsystem.repository.UserRepository;
import com.college.academic.evaluationsystem.repository.StudentRepository;
import com.college.academic.evaluationsystem.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
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
  @GetMapping("/login")
public String showLoginPage(
        @RequestParam(required = false) Boolean firstLogin,
        @RequestParam(required = false) Long userId,
        @RequestParam(required = false) String passwordChanged,
        Model model) {

    logger.info("LOGIN PAGE (flash) → otpSent={}, email={}",
        model.containsAttribute("otpSent") ? model.getAttribute("otpSent") : "none",
        model.containsAttribute("email") ? model.getAttribute("email") : "none");


    model.addAttribute("forcePasswordChange", false);
    model.addAttribute("otpVerified", false);

  if (!model.containsAttribute("otpSent")) {
    model.addAttribute("otpSent", false);
}
if (!model.containsAttribute("email")) {
    model.addAttribute("email", null);
}
if (!model.containsAttribute("otpError")) {
    model.addAttribute("otpError", null);
}
if (!model.containsAttribute("emailError")) {
    model.addAttribute("emailError", null);
}

    if (Boolean.TRUE.equals(firstLogin) && userId != null) {
        model.addAttribute("forcePasswordChange", true);
        model.addAttribute("userId", userId);
    }

    if (passwordChanged != null) {
        model.addAttribute("passwordChanged", true);
    }

    return "login";
}

@PostMapping("/change-password")
@ResponseBody
@Transactional
public Map<String, Object> processChangePassword(
        @RequestParam String newPassword,
        @RequestParam String confirmPassword,
        Authentication authentication) {

    Map<String, Object> response = new HashMap<>();

    String username = authentication.getName();
    User user = userRepository.findByUsername(username).orElse(null);

    if (user == null) {
        response.put("success", false);
        response.put("message", "User not found");
        return response;
    }

    if (!newPassword.equals(confirmPassword)) {
        response.put("success", false);
        response.put("message", "Passwords do not match");
        return response;
    }

    if (!newPassword.matches(STRONG_PASSWORD_REGEX)) {
        response.put("success", false);
        response.put("message",
            "Password must include uppercase, lowercase, number and symbol");
        return response;
    }

    if (passwordEncoder.matches(newPassword, user.getPassword())) {
        response.put("success", false);
        response.put("message", "New password cannot be same as old password");
        return response;
    }

    // ✅ SAVE PASSWORD
    updateBothUserAndStudent(user, newPassword);

    response.put("success", true);
//    console.log("CHANGE PASSWORD POST HIT");
    return response;
}

    @GetMapping("/debug-redirect")
    @ResponseBody
    public String debugRedirect(HttpServletRequest request) {
        return "URL: " + request.getRequestURL()
                + "<br>Query: " + request.getQueryString();
    }
 
@PostMapping("/forgot-password")
public String sendOtp(
        @RequestParam String email,
        RedirectAttributes redirectAttributes) {
logger.info("FORGOT PASSWORD HIT with email={}", email);
    User user = userRepository.findByEmail(email).orElse(null);

    // ✅ Always set (security best practice)
    redirectAttributes.addFlashAttribute("otpSent", true);
    redirectAttributes.addFlashAttribute("email", email);

    // ❌ User not found → still redirect (do NOT return "login")
    if (user == null) {
        logger.warn("EMAIL NOT FOUND in DB");
        return "redirect:/login";
    }

    // Generate 6-digit OTP
    String otp = String.format("%06d", new Random().nextInt(999999));
 logger.info("OTP GENERATED = {}", otp);
    user.setOtp(otp);
    user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
    userRepository.save(user);

    boolean emailSent = emailService.sendSimpleMessage(
            user.getEmail(),
            "SmarTeach Password Reset OTP",
            """
            Hello %s,

            Your OTP for password reset is: %s

            This OTP is valid for 5 minutes.
            Do not share it with anyone.

            - SmarTeach Team
            """.formatted(user.getUsername(), otp)
    );

    // ❌ Email failed → show error BUT still show OTP modal
    if (!emailSent) {
        redirectAttributes.addFlashAttribute(
            "emailError", "Failed to send OTP. Please try again."
        );
    }
 logger.info("EMAIL SENT STATUS = {}", emailSent);
    // ✅ IMPORTANT
    return "redirect:/login";
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
model.addAttribute("otpSent", false);
model.addAttribute("passwordChanged", false);
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

    logger.info("🔐 RESET PASSWORD OTP HIT | userId={}", userId);

    User user = userRepository.findById(userId).orElse(null);

    if (user == null) {
        logger.warn("❌ User not found for userId={}", userId);
        return otpError(model, "User not found", userId);
    }

    logger.info("📌 Stored password hash = {}", user.getPassword());
    logger.info("📌 New password entered = {}", newPassword);

    if (!newPassword.equals(confirmPassword)) {
        logger.warn("❌ Passwords do not match");
        return otpError(model, "Passwords do not match", userId);
    }

    if (!newPassword.matches(STRONG_PASSWORD_REGEX)) {
        logger.warn("❌ Password does not match strength regex");
        return otpError(
            model,
            "Password must include uppercase, lowercase, number and symbol",
            userId
        );
    }

    boolean sameAsOld = passwordEncoder.matches(newPassword, user.getPassword());
    logger.info("🔍 newPassword == oldPassword ? {}", sameAsOld);

    if (sameAsOld) {
        logger.warn("❌ New password SAME as old password");
        return otpError(
            model,
            "New password cannot be same as old password",
            userId
        );
    }

    logger.info("✅ Password valid & different → updating DB");

    updateBothUserAndStudent(user, newPassword);

    user.setOtp(null);
    user.setOtpExpiry(null);
    userRepository.save(user);

    logger.info("🎉 Password reset successful for userId={}", userId);

    return "redirect:/login?passwordChanged=true";
}


    @GetMapping("/reset-password-otp")
public String blockGetResetPassword() {
    return "redirect:/login";
}

   private String otpError(Model model, String message, Long userId) {
    model.addAttribute("error", message);
    model.addAttribute("forcePasswordChange", true);
    model.addAttribute("otpVerified", true);
    model.addAttribute("otpSent", false);
    model.addAttribute("passwordChanged", false);
    model.addAttribute("userId", userId);
    return "login";
}
@PostMapping("/change-password-auth")
@ResponseBody
public Map<String, Object> changePasswordAfterLogin(
    @RequestParam String newPassword,
    @RequestParam String confirmPassword,
    Authentication authentication) {

    Map<String, Object> response = new HashMap<>();

    User user = userRepository
        .findByUsername(authentication.getName())
        .orElse(null);

    if (user == null) {
        response.put("success", false);
        response.put("message", "User not found");
        return response;
    }

    if (!newPassword.equals(confirmPassword)) {
        response.put("success", false);
        response.put("message", "Passwords do not match");
        return response;
    }

    if (!newPassword.matches(STRONG_PASSWORD_REGEX)) {
        response.put("success", false);
        response.put("message",
            "Password must include uppercase, lowercase, number and symbol");
        return response;
    }

    if (passwordEncoder.matches(newPassword, user.getPassword())) {
        response.put("success", false);
        response.put("message", "New password cannot be same as old password");
        return response;
    }

    updateBothUserAndStudent(user, newPassword);

    response.put("success", true);
    return response;
}


}