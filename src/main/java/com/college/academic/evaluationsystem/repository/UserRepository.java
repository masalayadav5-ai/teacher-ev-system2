package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByOtpToken(String otpToken);
}
