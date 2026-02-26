//package com.college.academic.evaluationsystem.config;
//
//import com.college.academic.evaluationsystem.service.LoginService;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.web.cors.CorsConfiguration;
//import org.springframework.web.cors.CorsConfigurationSource;
//import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
//
//import java.util.Arrays;
//import java.util.List;
//import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
//@EnableMethodSecurity(prePostEnabled = true)
//@Configuration
//public class SecurityConfig {
//
//    private final LoginService loginService;
//    private final CustomLoginSuccessHandler successHandler;
//
//    public SecurityConfig(LoginService loginService, CustomLoginSuccessHandler successHandler) {
//        this.loginService = loginService;
//        this.successHandler = successHandler;
//    }
//
//    @Bean
//    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
//
//        http
//            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable CORS
//            .csrf(csrf -> csrf.disable())
//            .authorizeHttpRequests(auth -> auth
//
//    // 🔓 PUBLIC (web login + static)
//    .requestMatchers(
//        "/login",
//        "/do-login",
//        "/forgot-password",
//        "/verify-otp",
//        "/change-password",
//        "/css/**",
//        "/js/**",
//        "/images/**",
//        "/videos/**",
//        "/pages/**"
//    ).permitAll()
//
//// 🔐 WEB ROLE-BASED APIs
//.requestMatchers("/api/teachers/**").hasRole("TEACHER")   // ✅ teacher APIs (plural)
//.requestMatchers("/api/student/**").hasRole("STUDENT")
//.requestMatchers("/api/teacher/**").hasRole("TEACHER")    // (optional legacy)
//.requestMatchers("/api/admin/teachers/*/courses-for-session")
//.hasAnyRole("ADMIN","TEACHER")
// .requestMatchers("/api/admin/evaluations/**")
// .hasAnyRole("ADMIN","TEACHER")                   
//.requestMatchers("/api/admin/**").hasRole("ADMIN")
//
//// 🔐 evaluation shared
//.requestMatchers("/api/evaluation/**").hasAnyRole("STUDENT", "ADMIN")
//    // everything else
//    .anyRequest().authenticated()
//)
//
//            .formLogin(form -> form
//                .loginPage("/login")
//                .loginProcessingUrl("/do-login")
//                .successHandler(successHandler)
//                .failureUrl("/login?error")
//                .permitAll()
//            )
//            .logout(logout -> logout
//                .logoutUrl("/logout")
//                .logoutSuccessUrl("/login?logout=true")
//                .permitAll()
//            );
//
//        return http.build();
//    }
//
//    @Bean
//    public CorsConfigurationSource corsConfigurationSource() {
//        CorsConfiguration configuration = new CorsConfiguration();
//        
//        // Configure allowed origins
//        configuration.setAllowedOrigins(Arrays.asList(
//            "http://localhost:3000",    // React frontend
//            "http://localhost:8080",    // Your app
//            "http://127.0.0.1:3000"     // Alternative localhost
//        ));
//        
//        // Configure allowed methods
//        configuration.setAllowedMethods(Arrays.asList(
//            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
//        ));
//        
//        // Configure allowed headers
//        configuration.setAllowedHeaders(Arrays.asList(
//            "Authorization", "Content-Type", "X-Requested-With", "Accept", 
//            "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"
//        ));
//        
//        // Configure exposed headers (optional)
//        configuration.setExposedHeaders(Arrays.asList(
//            "Authorization", "Content-Type"
//        ));
//        
//        // Allow credentials (cookies, authorization headers)
//        configuration.setAllowCredentials(true);
//        
//        // Set max age for preflight requests (in seconds)
//        configuration.setMaxAge(3600L);
//        
//        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
//        source.registerCorsConfiguration("/**", configuration); // Apply to all endpoints
//        
//        return source;
//    }
//
//    @Bean
//    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
//        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
//        builder.userDetailsService(loginService).passwordEncoder(passwordEncoder());
//        return builder.build();
//    }
//
//    @Bean
//    public PasswordEncoder passwordEncoder() {
//        return new BCryptPasswordEncoder();
//    }
//}
package com.college.academic.evaluationsystem.config;

import com.college.academic.evaluationsystem.service.LoginService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import java.util.Arrays;
import java.util.List;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
@EnableMethodSecurity(prePostEnabled = true)
@Configuration
public class SecurityConfig {

    private final LoginService loginService;
    private final CustomLoginSuccessHandler successHandler;

    public SecurityConfig(LoginService loginService, CustomLoginSuccessHandler successHandler) {
        this.loginService = loginService;
        this.successHandler = successHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource())) // Enable CORS
            .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
    .requestMatchers(
        "/login", "/do-login", "/change-password",
        "/css/**", "/js/**", "/images/**",
        "/forgot-password", "/verify-otp",
        "/videos/**", "/pages/**"
    ).permitAll()

    // ✅ Android login open
    .requestMatchers("/api/auth/**").permitAll()

    // ✅ Student-only APIs (Android will still work if you permitAll,
    // but better to protect later using token/session)
    .requestMatchers("/api/students/**").permitAll() // (or hasRole("STUDENT"))

    // ✅ evaluation endpoints
    .requestMatchers("/api/admin/evaluations/**").hasAnyRole("ADMIN", "TEACHER")

    .requestMatchers("/api/evaluation/**").permitAll() // (or hasRole("STUDENT"))

    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .requestMatchers("/api/teacher/**").hasRole("TEACHER")
                        
    .requestMatchers(HttpMethod.GET, "/api/settings").hasAnyRole("ADMIN","TEACHER","STUDENT")
    .requestMatchers(HttpMethod.PUT, "/api/settings").hasRole("ADMIN")
    .anyRequest().authenticated()
)
//            .authorizeHttpRequests(auth -> auth
//                .requestMatchers("/login", "/do-login", "/change-password", 
//                               "/css/**", "/js/**", "/images/**","/forgot-password",   // ✅ ADD THIS
//                "/verify-otp","/videos/**","/pages/**",
//                               "/api/evaluation/**").permitAll() // Add public API endpoints
//                .requestMatchers("/api/student/**").hasRole("STUDENT")
//                .requestMatchers("/api/teacher/**").hasRole("TEACHER")
//                .requestMatchers("/api/admin/**").hasRole("ADMIN")
//                .requestMatchers("/api/evaluation/**").hasAnyRole("STUDENT", "ADMIN")
//                .anyRequest().authenticated()
//            )
            .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/do-login")
                .successHandler(successHandler)
                .failureUrl("/login?error")
                .permitAll()
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
                .permitAll()
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Configure allowed origins
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",    // React frontend
            "http://localhost:8080",    // Your app
            "http://127.0.0.1:3000",
            "http://10.0.2.2:8080",
            "http://192.168.18.72:8080"
// Alternative localhost
        ));
        
        // Configure allowed methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));
        
        // Configure allowed headers
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "X-Requested-With", "Accept", 
            "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"
        ));
        
        // Configure exposed headers (optional)
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization", "Content-Type"
        ));
        
        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Set max age for preflight requests (in seconds)
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Apply to all endpoints
        
        return source;
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder builder = http.getSharedObject(AuthenticationManagerBuilder.class);
        builder.userDetailsService(loginService).passwordEncoder(passwordEncoder());
        return builder.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}