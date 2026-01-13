package com.college.academic.evaluationsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIgnoreProperties({"semesters","students","teachers"})
@Table(
    name = "program",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"code", "name"})
    }
)public class Program {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    private String code; // e.g., "CS", "EE"
    
    private String description;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
    
    // Relationships
    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL)
    private List<Semester> semesters = new ArrayList<>();
    
    @OneToMany(mappedBy = "program")
    private List<Student> students = new ArrayList<>();
    
    @OneToMany(mappedBy = "program")
    private List<Teacher> teachers = new ArrayList<>();
    
    // Constructors
    public Program() {}
    
    public Program(String name, String code, String description) {
        this.name = name;
        this.code = code;
        this.description = description;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public List<Semester> getSemesters() { return semesters; }
    public void setSemesters(List<Semester> semesters) { this.semesters = semesters; }
    
    public List<Student> getStudents() { return students; }
    public void setStudents(List<Student> students) { this.students = students; }
    
    public List<Teacher> getTeachers() { return teachers; }
    public void setTeachers(List<Teacher> teachers) { this.teachers = teachers; }
}