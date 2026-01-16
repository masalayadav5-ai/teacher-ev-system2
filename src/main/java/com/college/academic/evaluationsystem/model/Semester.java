package com.college.academic.evaluationsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIgnoreProperties(
    value = {"courses","students"},
    allowSetters = true
)
@Table(name = "semester")
public class Semester {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name; // e.g., "Semester 1", "Fall 2024"
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
    
    // Relationships
    @ManyToOne
    @JoinColumn(name = "program_id", nullable = false)
    private Program program;
    
    @OneToMany(mappedBy = "semester", cascade = CascadeType.ALL)
    private List<Course> courses = new ArrayList<>();
    
    @OneToMany(mappedBy = "semester")
    private List<Student> students = new ArrayList<>();
    
    // Constructors
    public Semester() {}
    
    public Semester(String name, Program program) {
        this.name = name;
        this.program = program;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public Program getProgram() { return program; }
    public void setProgram(Program program) { this.program = program; }
    
    public List<Course> getCourses() { return courses; }
    public void setCourses(List<Course> courses) { this.courses = courses; }
    
    public List<Student> getStudents() { return students; }
    public void setStudents(List<Student> students) { this.students = students; }
}