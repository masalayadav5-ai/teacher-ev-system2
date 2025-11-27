package com.college.academic.evaluationsystem.config;

import com.college.academic.evaluationsystem.service.LoginService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    private final LoginService loginService;

    public SecurityConfig(LoginService loginService) {
        this.loginService = loginService;
    }

   @Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

    http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
                .requestMatchers("/login", "/css/**", "/js/**").permitAll()
                .anyRequest().authenticated()
        )
        .formLogin(form -> form
                .loginPage("/login")
                .loginProcessingUrl("/do-login")
                .usernameParameter("username")
                .passwordParameter("password")
                .defaultSuccessUrl("/dashboard", true)  // FIXED
                .failureUrl("/login?error=true")
        )
        .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/login?logout=true")
        )
        .authenticationProvider(authenticationProvider());

    return http.build();
}


    @Bean
public AuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider provider =
            new DaoAuthenticationProvider(loginService); // constructor requires UserDetailsService

    provider.setPasswordEncoder(NoOpPasswordEncoder.getInstance());
    return provider;
}
}