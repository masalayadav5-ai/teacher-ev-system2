package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.dto.DayDTO;
import com.college.academic.evaluationsystem.dto.SessionPlanRequestDTO;
import com.college.academic.evaluationsystem.dto.DayUpdateDTO;
import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;

import java.time.LocalDate;
import java.time.LocalTime;   // 🔥 NEW
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionPlanService {

    @Autowired
    private SessionPlanRepository sessionPlanRepository;

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private SessionDayRepository sessionDayRepository;

    @Autowired
    private TeacherCourseHistoryRepository historyRepository;

    // ================= SAVE =================

    @Transactional
    public SessionPlan save(SessionPlanRequestDTO dto) {

        SessionPlan plan = new SessionPlan();

        // 🔥 Uniqueness check
        if (dto.getProgramId() != null && dto.getSemesterId() != null && dto.getCourseId() != null) {
            boolean exists =
                sessionPlanRepository.existsByProgram_IdAndSemester_IdAndCourse_Id(
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

        // 🔗 Program
        if (dto.getProgramId() != null) {
            Program program = programRepository.findById(dto.getProgramId())
                .orElseThrow(() -> new RuntimeException("Program not found"));
            plan.setProgram(program);
        }

        // 🔗 Semester
        if (dto.getSemesterId() != null) {
            Semester semester = semesterRepository.findById(dto.getSemesterId())
                .orElseThrow(() -> new RuntimeException("Semester not found"));
            plan.setSemester(semester);
        }

        // 🔗 Course
        if (dto.getCourseId() != null) {
            Course course = courseRepository.findById(dto.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
            plan.setCourse(course);
        }

        // 🔗 Teacher
        if (dto.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
            plan.setTeacher(teacher);
        }

        // 🔥 NEW: Session Date + Time
        if (dto.getSessionDate() != null && !dto.getSessionDate().isBlank()) {
            plan.setSessionDate(LocalDate.parse(dto.getSessionDate()));
        }

        if (dto.getStartTime() != null && !dto.getStartTime().isBlank()) {
            plan.setStartTime(LocalTime.parse(dto.getStartTime()));
        }

        // 📅 Create session days
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

    // ================= FINDERS =================

    public List<SessionPlan> findAll() {
        return sessionPlanRepository.findAll();
    }

    public SessionPlan findById(Long id) {
        return sessionPlanRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Session Plan not found"));
    }

    public List<SessionPlan> findByProgram(Long programId) {
        return sessionPlanRepository.findByProgramId(programId);
    }

    public List<SessionPlan> findByProgramAndSemester(Long programId, Long semesterId) {
        return sessionPlanRepository.findByProgramIdAndSemesterId(programId, semesterId);
    }

    public List<SessionPlan> findByTeacher(Long teacherId) {
        return sessionPlanRepository.findByTeacherId(teacherId);
    }

    public List<SessionPlan> findByCourse(Long courseId) {
        return sessionPlanRepository.findByCourseId(courseId);
    }

    // ================= STUDENT =================

    public List<SessionPlan> findForStudent(Long studentId) {

        Student student =
            studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getProgram() == null || student.getSemester() == null) {
            return List.of();
        }

        return sessionPlanRepository.findForStudent(
            student.getProgram().getId(),
            student.getSemester().getId()
        );
    }

    public boolean existsByProgramSemesterCourse(
        Long programId,
        Long semesterId,
        Long courseId
    ) {
        return sessionPlanRepository
            .existsByProgram_IdAndSemester_IdAndCourse_Id(
                programId, semesterId, courseId
            );
    }

    // ================= UPDATE DAY =================

    @Transactional
    public SessionDay updateSessionDay(Long dayId, DayUpdateDTO dto) {

        SessionDay day = sessionDayRepository.findById(dayId)
            .orElseThrow(() -> new RuntimeException("Session day not found"));

        day.setTopic(dto.getTopic());
        day.setDescription(dto.getDescription());
        day.setMethod(dto.getMethod());

        day.setCompleted(dto.isCompleted());
        day.setRemarks(dto.getRemarks());

        if (dto.getCompletedDate() != null && !dto.getCompletedDate().isEmpty()) {
            day.setCompletedDate(LocalDate.parse(dto.getCompletedDate()));
        }

        return sessionDayRepository.save(day);
    }

    // ================= REASSIGN =================

    @Transactional
    public void reassignSessionPlans(Long teacherId, Long courseId) {
        sessionPlanRepository.reassignTeacherForCourse(
            teacherId,
            courseId
        );
    }

    // ================= TEACHER =================

    public List<SessionPlan> findForTeacherCourses(Long teacherId) {

        List<Long> activeCourseIds =
            historyRepository.findActiveCourses(teacherId)
                .stream()
                .map(h -> h.getCourse().getId())
                .toList();

        if (activeCourseIds.isEmpty()) {
            return List.of();
        }

        return sessionPlanRepository.findByCourseIdIn(activeCourseIds);
    }
}
