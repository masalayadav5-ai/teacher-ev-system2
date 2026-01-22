package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.dto.DayUpdateDTO;
import com.college.academic.evaluationsystem.dto.SessionPlanRequestDTO;
import com.college.academic.evaluationsystem.model.SessionDay;
import com.college.academic.evaluationsystem.model.SessionPlan;
import com.college.academic.evaluationsystem.service.SessionPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/session-plans")
@CrossOrigin
public class SessionPlanController {

    @Autowired
    private SessionPlanService service;

    @PostMapping
    public SessionPlan save(@RequestBody SessionPlanRequestDTO dto) {
        return service.save(dto);
    }

    @GetMapping
    public List<SessionPlan> getAll() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public SessionPlan getById(@PathVariable Long id) {
        return service.findById(id);
    }
    
    // NEW: Get session plans by program
    @GetMapping("/program/{programId}")
    public List<SessionPlan> getByProgram(@PathVariable Long programId) {
        return service.findByProgram(programId);
    }
    
    // NEW: Get session plans by program and semester
    @GetMapping("/program/{programId}/semester/{semesterId}")
    public List<SessionPlan> getByProgramAndSemester(@PathVariable Long programId, @PathVariable Long semesterId) {
        return service.findByProgramAndSemester(programId, semesterId);
    }
    
    // NEW: Get session plans by teacher
    @GetMapping("/teacher/{teacherId}")
    public List<SessionPlan> getByTeacher(@PathVariable Long teacherId) {
        return service.findByTeacher(teacherId);
    }
    
    // NEW: Get session plans by course
    @GetMapping("/course/{courseId}")
    public List<SessionPlan> getByCourse(@PathVariable Long courseId) {
        return service.findByCourse(courseId);
    }
 @GetMapping("/exists")
public boolean exists(
        @RequestParam Long programId,
        @RequestParam Long semesterId,
        @RequestParam Long courseId) {

    return service.existsByProgramSemesterCourse(
        programId, semesterId, courseId
    );
}
@PutMapping("/day/{dayId}")
public SessionDay updateSessionDay(
        @PathVariable Long dayId,
        @RequestBody DayUpdateDTO dto) {
    return service.updateSessionDay(dayId, dto);
}
}