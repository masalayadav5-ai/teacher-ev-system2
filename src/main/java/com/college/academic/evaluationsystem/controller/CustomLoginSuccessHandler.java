package com.college.academic.evaluationsystem.config;

import com.college.academic.evaluationsystem.model.User;
import com.college.academic.evaluationsystem.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class CustomLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    public CustomLoginSuccessHandler(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

   @Override
public void onAuthenticationSuccess(HttpServletRequest request,
                                    HttpServletResponse response,
                                    Authentication authentication) throws IOException {

    System.out.println("=== CustomLoginSuccessHandler ===");
    System.out.println("Username: " + authentication.getName());
    
    String username = authentication.getName();
    User user = userRepository.findByUsername(username).orElse(null);

    if (user == null) {
        System.out.println("ERROR: User not found in database!");
        response.sendRedirect("/login?error=user_not_found");
        return;
    }

    System.out.println("User ID: " + user.getId());
    System.out.println("First login: " + user.isFirstLogin());
    System.out.println("Status: " + user.getStatus());

    if (user.isFirstLogin()) {
        String redirectUrl = "/change-password?userId=" + user.getId();
        System.out.println("Redirecting to: " + redirectUrl);
        response.sendRedirect(redirectUrl);
        return;
    }

        // Redirect by role
        switch (user.getRole()) {
            case "ADMIN":
                response.sendRedirect("/dashboard");
                break;
            case "TEACHER":
                response.sendRedirect("/dashboard");
                break;
            case "STUDENT":
                response.sendRedirect("/dashboard");
                break;
            default:
                response.sendRedirect("/login");
        }
    }
}
