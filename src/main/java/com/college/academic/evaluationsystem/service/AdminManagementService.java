package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class AdminManagementService {

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentRepository studentRepository;

    // Program Management
    public Program createProgram(Program program) {
        return programRepository.save(program);
    }

    public Program updateProgram(Long id, Program programDetails) {
        Program program = programRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Program not found"));
        
        program.setName(programDetails.getName());
        program.setCode(programDetails.getCode());
        program.setDescription(programDetails.getDescription());
        program.setActive(programDetails.isActive());
        
        return programRepository.save(program);
    }

    public void deleteProgram(Long id) {
        Program program = programRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Program not found"));
        program.setActive(false);
        programRepository.save(program);
    }

    // Semester Management
    public Semester createSemester(Semester semester) {
        return semesterRepository.save(semester);
    }

    public Semester updateSemester(Long id, Semester semesterDetails) {
        Semester semester = semesterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Semester not found"));
        
        semester.setName(semesterDetails.getName());

        semester.setActive(semesterDetails.isActive());
        semester.setProgram(semesterDetails.getProgram());
        
        return semesterRepository.save(semester);
    }

    // Course Management
    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(Long id, Course courseDetails) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        course.setCode(courseDetails.getCode());
        course.setName(courseDetails.getName());
        course.setDescription(courseDetails.getDescription());
        course.setCredits(courseDetails.getCredits());
        course.setActive(courseDetails.isActive());
        course.setSemester(courseDetails.getSemester());
        
        return courseRepository.save(course);
    }

    // Teacher-Course Assignment
    public void assignCourseToTeacher(Long teacherId, Long courseId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        teacher.addCourse(course);
        teacherRepository.save(teacher);
    }

    public void removeCourseFromTeacher(Long teacherId, Long courseId) {
        Teacher teacher = teacherRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        teacher.removeCourse(course);
        teacherRepository.save(teacher);
    }

    // Get statistics
    public Map<String, Long> getStatistics() {
        long programCount = programRepository.count();
        long semesterCount = semesterRepository.count();
        long courseCount = courseRepository.count();
        long teacherCount = teacherRepository.count();
        long studentCount = studentRepository.count();
        
        Map<String, Long> stats = new HashMap<>();
        stats.put("programs", programCount);
        stats.put("semesters", semesterCount);
        stats.put("courses", courseCount);
        stats.put("teachers", teacherCount);
        stats.put("students", studentCount);
        
        return stats;
    }
}