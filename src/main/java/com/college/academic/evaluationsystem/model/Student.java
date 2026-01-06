package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;

@Entity
@Table(name = "student")
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "student_id", unique = true)
    private String studentId;

    private String address;
    private String contact;
    private String faculty;
    private String semester;
    private String batch;
    
    @Column(name = "hide", nullable = false)
    private String hide = "0";   // 0 = visible, 1 = hidden
    
    @Column(nullable = false)
    private String status = "Pending";

    // Foreign key to User table - Change to EAGER fetching to avoid LazyInitializationException
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

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
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

    public String getFaculty() {
        return faculty;
    }

    public void setFaculty(String faculty) {
        this.faculty = faculty;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String batch) {
        this.batch = batch;
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
        this.user.setRole("STUDENT");
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