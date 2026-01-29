package com.college.academic.evaluationsystem.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;   // 🔥 ADD THIS
import java.util.List;
import com.fasterxml.jackson.annotation.JsonManagedReference;

@Entity
@Table(
    name = "session_plan",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"program_id", "semester_id", "course_id"}
    )
)
public class SessionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate createdDate = LocalDate.now();

    // 🔥 NEW: Actual session date (for upcoming logic)
    private LocalDate sessionDate;

    // 🔥 NEW: Start time of the session
    private LocalTime startTime;

    @OneToMany(mappedBy = "sessionPlan", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<SessionDay> days;

    @ManyToOne
    @JoinColumn(name = "program_id")
    private Program program;

    @ManyToOne
    @JoinColumn(name = "semester_id")
    private Semester semester;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;

    // ---------- GETTERS & SETTERS ----------

    public Long getId() { 
        return id; 
    }

    public void setId(Long id) { 
        this.id = id; 
    }

    public LocalDate getCreatedDate() { 
        return createdDate; 
    }

    public void setCreatedDate(LocalDate createdDate) { 
        this.createdDate = createdDate; 
    }

    public LocalDate getSessionDate() {
        return sessionDate;
    }

    public void setSessionDate(LocalDate sessionDate) {
        this.sessionDate = sessionDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public List<SessionDay> getDays() { 
        return days; 
    }

    public void setDays(List<SessionDay> days) { 
        this.days = days; 
    }

    public Program getProgram() { 
        return program; 
    }

    public void setProgram(Program program) { 
        this.program = program; 
    }

    public Semester getSemester() { 
        return semester; 
    }

    public void setSemester(Semester semester) { 
        this.semester = semester; 
    }

    public Course getCourse() { 
        return course; 
    }

    public void setCourse(Course course) { 
        this.course = course; 
    }

    public Teacher getTeacher() { 
        return teacher; 
    }

    public void setTeacher(Teacher teacher) { 
        this.teacher = teacher; 
    }
}
