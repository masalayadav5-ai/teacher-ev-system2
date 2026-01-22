package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.dto.DayDTO;
import com.college.academic.evaluationsystem.dto.SessionPlanRequestDTO;
import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.controller.*;
import com.college.academic.evaluationsystem.dto.DayUpdateDTO;

import com.college.academic.evaluationsystem.repository.*;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class SessionPlanService {

    @Autowired
    private SessionPlanRepository sessionPlanRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private SessionDayRepository sessionDayRepository;

    @Transactional
    public SessionPlan save(SessionPlanRequestDTO dto) {
        SessionPlan plan = new SessionPlan();
 if (
        dto.getProgramId() != null &&
        dto.getSemesterId() != null) {

       boolean exists =
    sessionPlanRepository
        .existsByProgram_IdAndSemester_IdAndCourse_Id(
            dto.getProgramId(),
            dto.getSemesterId(),
            dto.getCourseId()
        );

if (exists) {
    throw new RuntimeException(
        "Session plan already exists for this Program, Semester and Course"
    );
}
}
        // Fetch and set relationships instead of strings
        if (dto.getProgramId() != null) {
            Program program = programRepository.findById(dto.getProgramId())
                .orElseThrow(() -> new RuntimeException("Program not found"));
            plan.setProgram(program);
        }

        if (dto.getSemesterId() != null) {
            Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));
            plan.setSemester(semester);
        }

        if (dto.getCourseId() != null) {
            Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
            plan.setCourse(course);
        }

        if (dto.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
            plan.setTeacher(teacher);
        }

        // Create session days
        List<SessionDay> dayList = new ArrayList<>();
        for (DayDTO d : dto.getDays()) {
            SessionDay day = new SessionDay();
            day.setDayNumber(d.getDay_number());
            day.setTopic(d.getTopic());
            day.setDescription(d.getDescription());
            day.setMethod(d.getMethod());
            day.setSessionPlan(plan);
            dayList.add(day);
        }

        plan.setDays(dayList);
        return sessionPlanRepository.save(plan);
    }

    public List<SessionPlan> findAll() {
        return sessionPlanRepository.findAll();
    }

    public SessionPlan findById(Long id) {
        return sessionPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Session Plan not found"));
    }

    // Get session plans by program
    public List<SessionPlan> findByProgram(Long programId) {
        return sessionPlanRepository.findByProgramId(programId);
    }

    // Get session plans by program and semester
    public List<SessionPlan> findByProgramAndSemester(Long programId, Long semesterId) {
        return sessionPlanRepository.findByProgramIdAndSemesterId(programId, semesterId);
    }

    // Get session plans by teacher
    public List<SessionPlan> findByTeacher(Long teacherId) {
        return sessionPlanRepository.findByTeacherId(teacherId);
    }

    // Get session plans by course
    public List<SessionPlan> findByCourse(Long courseId) {
        return sessionPlanRepository.findByCourseId(courseId);
    }

    // Get session plans for a student (based on their program and semester)
    public List<SessionPlan> findForStudent(Long studentId) {
        // You'll need to implement this based on your Student entity
        // This would fetch student, then find sessions for their program/semester
        return new ArrayList<>();
    }
 public boolean existsByProgramSemesterCourse(
        Long programId,
        Long semesterId,
        Long courseId) {

    return sessionPlanRepository
        .existsByProgram_IdAndSemester_IdAndCourse_Id(
            programId, semesterId, courseId
        );
}
 @Transactional
    public SessionDay updateSessionDay(Long dayId,DayUpdateDTO dto) {

        // 1️⃣ Fetch existing day from DB
        SessionDay day = sessionDayRepository.findById(dayId)
                .orElseThrow(() -> new RuntimeException("Session day not found"));

         day.setTopic(dto.getTopic());
    day.setDescription(dto.getDescription());
    day.setMethod(dto.getMethod());
    
        // 2️⃣ Update fields
        day.setCompleted(dto.isCompleted());
        day.setRemarks(dto.getRemarks());

       if (dto.getCompletedDate() != null && !dto.getCompletedDate().isEmpty()) {
        day.setCompletedDate(LocalDate.parse(dto.getCompletedDate()));
    }

        // 3️⃣ Save updated day
        return sessionDayRepository.save(day);
    }
}