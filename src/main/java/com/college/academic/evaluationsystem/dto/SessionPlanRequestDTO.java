package com.college.academic.evaluationsystem.dto;

import java.util.List;

public class SessionPlanRequestDTO {
    private Long programId;
    private Long semesterId;
    private Long courseId;
    private Long teacherId;
    private List<DayDTO> days;

    // Getters and Setters
    public Long getProgramId() { return programId; }
    public void setProgramId(Long programId) { this.programId = programId; }
    
    public Long getSemesterId() { return semesterId; }
    public void setSemesterId(Long semesterId) { this.semesterId = semesterId; }
    
    public Long getCourseId() { return courseId; }
    public void setCourseId(Long courseId) { this.courseId = courseId; }
    
    public Long getTeacherId() { return teacherId; }
    public void setTeacherId(Long teacherId) { this.teacherId = teacherId; }
    
    public List<DayDTO> getDays() { return days; }
    public void setDays(List<DayDTO> days) { this.days = days; }
}