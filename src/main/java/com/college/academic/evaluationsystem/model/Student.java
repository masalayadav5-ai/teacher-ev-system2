package com.college.academic.evaluationsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
    @Column(name = "batch_label")
private String batchLabel;   // Stores year like "2024"


    @Column(name = "hide", nullable = false)
    private String hide = "0";   // 0 = visible, 1 = hidden

    @Column(nullable = false)
    private String status = "Pending";

    // Foreign key to User table
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

   @ManyToOne
@JoinColumn(name = "batch_id")
@JsonIgnoreProperties("students")
private Batch batch;


    // NEW: Relationship with Program (replaces faculty string)
    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    // NEW: Relationship with Semester (replaces semester string)
    @ManyToOne
    @JoinColumn(name = "semester_id")
    private Semester semester;

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

  public String getBatchLabel() {
    return batchLabel;
}

public void setBatchLabel(String batchLabel) {
    this.batchLabel = batchLabel;
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

    public Program getProgram() {
        return program;
    }

    public void setProgram(Program program) {
        this.program = program;
    }

    // ===== MISSING GETTER/SETTER FOR SEMESTER =====
    public Semester getSemester() {
        return semester;
    }

    public void setSemester(Semester semester) {
        this.semester = semester;
    }
}
