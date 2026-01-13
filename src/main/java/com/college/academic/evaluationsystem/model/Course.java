package com.college.academic.evaluationsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@JsonIgnoreProperties(
    value = {"semester", "teachers", "sessionPlans"},
    allowSetters = true
)@Table(name = "course")
public class Course {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code; // e.g., "CS101"
    
    @Column(nullable = false)
    private String name;
    
    private String description;
    
    private int credits;
    
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
    
    // Relationships
    @ManyToOne
    @JoinColumn(name = "semester_id", nullable = false)
    private Semester semester;
    
    // TEACHERS - mappedBy because Teacher is the owner
    @ManyToMany(mappedBy = "courses")
    private List<Teacher> teachers = new ArrayList<>();
    
    @OneToMany(mappedBy = "course")
    private List<SessionPlan> sessionPlans = new ArrayList<>();
    
    // Constructors
    public Course() {}
    
    public Course(String code, String name, Semester semester) {
        this.code = code;
        this.name = name;
        this.semester = semester;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public int getCredits() { return credits; }
    public void setCredits(int credits) { this.credits = credits; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public Semester getSemester() { return semester; }
    public void setSemester(Semester semester) { this.semester = semester; }
    
    public List<Teacher> getTeachers() { return teachers; }
    public void setTeachers(List<Teacher> teachers) { this.teachers = teachers; }
    
    public List<SessionPlan> getSessionPlans() { return sessionPlans; }
    public void setSessionPlans(List<SessionPlan> sessionPlans) { this.sessionPlans = sessionPlans; }
    
    // ===== HELPER METHODS (Optional but useful) =====
    
    /**
     * Add a teacher to this course (delegates to Teacher's addCourse)
     */
    public void addTeacher(Teacher teacher) {
        if (this.teachers == null) {
            this.teachers = new ArrayList<>();
        }
        
        if (!this.teachers.contains(teacher)) {
            // This will automatically update both sides of the relationship
            teacher.addCourse(this);
        }
    }
    
    /**
     * Remove a teacher from this course (delegates to Teacher's removeCourse)
     */
    public void removeTeacher(Teacher teacher) {
        if (this.teachers != null) {
            // This will automatically update both sides of the relationship
            teacher.removeCourse(this);
        }
    }
    
    /**
     * Check if a specific teacher teaches this course
     */
    public boolean isTaughtBy(Teacher teacher) {
        return this.teachers != null && this.teachers.contains(teacher);
    }
}