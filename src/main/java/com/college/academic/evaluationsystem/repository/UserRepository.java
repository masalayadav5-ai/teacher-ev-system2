package com.college.academic.evaluationsystem.repository;

import com.college.academic.evaluationsystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Find user by username
    Optional<User> findByUsername(String username);
    
    // Find user by email
    Optional<User> findByEmail(String email);
    
    // Check if username exists
    boolean existsByUsername(String username);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Find users by role
    Optional<User> findByRole(String role);
    
    // Find users by status
    Optional<User> findByStatus(String status);
    
    // Find users by role and status
    Optional<User> findByRoleAndStatus(String role, String status);
}