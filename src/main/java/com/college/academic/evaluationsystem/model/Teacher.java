package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "teacher")
public class Teacher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "teacher_id", unique = true)
    private String teacherId;
    
    private String address;
    private String contact;
    private String department;
    private String qualification;
    private Integer experience;
    
    @Column(name = "hide", nullable = false)
    private String hide = "0";   // 0 = visible, 1 = hidden
    
    @Column(nullable = false)
    private String status = "Pending";

    // Foreign key to User table
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    // ===== Getters and Setters =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContact() {
        return contact;
    }

    public void setContact(String contact) {
        this.contact = contact;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getQualification() {
        return qualification;
    }

    public void setQualification(String qualification) {
        this.qualification = qualification;
    }

    public Integer getExperience() {
        return experience;
    }

    public void setExperience(Integer experience) {
        this.experience = experience;
    }

    // Convenience methods to get user properties
    public String getEmail() {
        return user != null ? user.getEmail() : null;
    }

    public String getUsername() {
        return user != null ? user.getUsername() : null;
    }

    public String getPassword() {
        return user != null ? user.getPassword() : null;
    }

    // Set user with username, email, and password
    public void setUserCredentials(String username, String email, String password) {
        if (this.user == null) {
            this.user = new User();
        }
        this.user.setUsername(username);
        this.user.setEmail(email);
        this.user.setPassword(password);
        this.user.setRole("TEACHER");
        this.user.setStatus(this.status); // Sync status
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        // Sync status with user if user exists
        if (this.user != null) {
            this.user.setStatus(status);
        }
    }

    public String getHide() {
        return hide;
    }

    public void setHide(String hide) {
        this.hide = hide;
    }
}