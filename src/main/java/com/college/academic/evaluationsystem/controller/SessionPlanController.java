package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.dto.DayUpdateDTO;
import com.college.academic.evaluationsystem.dto.SessionPlanRequestDTO;
import com.college.academic.evaluationsystem.model.Course;
import com.college.academic.evaluationsystem.model.SessionDay;
import com.college.academic.evaluationsystem.model.SessionPlan;
import com.college.academic.evaluationsystem.repository.CourseRepository;
import com.college.academic.evaluationsystem.repository.SessionDayRepository;
import com.college.academic.evaluationsystem.repository.SessionPlanRepository;
import com.college.academic.evaluationsystem.service.SessionPlanService;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/session-plans")
@CrossOrigin
public class SessionPlanController {

    @Autowired
    private SessionDayRepository sessionDayRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private SessionPlanService service;
    @Autowired
    private SessionPlanRepository sessionPlanRepository;

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

    @GetMapping("/teacher/{teacherId}/visible")
    public List<SessionPlan> getVisibleForTeacher(@PathVariable Long teacherId) {
        return service.findForTeacherCourses(teacherId);
    }

    @GetMapping("/student/{studentId}")
    public List<SessionPlan> getForStudent(@PathVariable Long studentId) {
        return service.findForStudent(studentId);
    }

    @GetMapping("/admin/sessions/recent-completed")
    public List<Map<String, Object>> getRecentlyCompletedSessions() {

        List<SessionDay> days
                = sessionDayRepository.findRecentlyCompleted();

        List<Map<String, Object>> result = new ArrayList<>();

        for (SessionDay d : days.stream().limit(5).toList()) {

            SessionPlan p = d.getSessionPlan();

            Map<String, Object> m = new HashMap<>();
            m.put("course", p.getCourse().getName());
            m.put("teacher", p.getTeacher().getFullName());
            m.put("day", "Day " + d.getDayNumber());
            m.put("topic", d.getTopic());
            m.put("date", d.getCompletedDate());
            result.add(m);
        }

        return result;
    }

    @GetMapping("/admin/course-progress")
    public List<Map<String, Object>> getCourseProgress() {

        List<Object[]> rows
                = sessionDayRepository.getCourseProgressRaw();

        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] r : rows) {
            Long courseId = (Long) r[0];
            long total = (Long) r[1];
            long completed = (Long) r[2];

            int percent = total == 0 ? 0 : (int) ((completed * 100) / total);

            Course c = courseRepository.findById(courseId).orElse(null);

            Map<String, Object> m = new HashMap<>();
            m.put("course", c != null ? c.getName() : "Unknown");
            m.put("progress", percent);

            result.add(m);
        }

        return result;
    }

}
