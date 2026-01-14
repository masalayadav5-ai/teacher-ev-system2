package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
import com.college.academic.evaluationsystem.service.AdminManagementService;
import java.util.ArrayList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminManagementController {

    @Autowired
    private ProgramRepository programRepository;

    @Autowired
    private SemesterRepository semesterRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private AdminManagementService adminService;

    // ================= PROGRAMS =================
    
    @GetMapping("/programs")
    public List<Program> getAllPrograms() {
        return programRepository.findAll();
    }

    @GetMapping("/programs/{id}")
    public ResponseEntity<Program> getProgramById(@PathVariable Long id) {
        Optional<Program> program = programRepository.findById(id);
        return program.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/programs")
    public Program createProgram(@RequestBody Program program) {
        return programRepository.save(program);
    }
@GetMapping("/programs/overview")
public List<Map<String, Object>> getProgramsOverview() {
    List<Object[]> rows = programRepository.fetchProgramOverview();

    return rows.stream().map(r -> {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r[0]);               // id
        m.put("code", r[1]);             // code
        m.put("name", r[2]);             // name
        m.put("description", r[3]);      // description
        m.put("totalStudents", r[4]);    // total students
        m.put("totalTeachers", r[5]);    // total teachers
        m.put("activeTeachers", r[6]);   // active teachers
        m.put("totalSemesters", r[7]);   // total semesters
        m.put("active", r[8]);           // program active status
        return m;
    }).toList();
}
    

@GetMapping("/programs/{programId}/semesters/stats")
public List<Map<String, Object>> getSemesterStatsByProgram(@PathVariable Long programId) {
    List<Object[]> rows = semesterRepository.findBasicSemesterStats(programId);
    
    return rows.stream().map(row -> {
        Map<String, Object> map = new HashMap<>();
        map.put("id", row[0]);                 // semester.id
        map.put("name", row[1]);               // semester.name
        map.put("programName", row[2]);        // program.name
        map.put("courseCount", row[3]);        // course count
        map.put("studentCount", row[4]);       // student count  <-- THIS IS ACTIVE STUDENTS
        map.put("active", row[5]);             // semester.isActive
        return map;
    }).collect(Collectors.toList());
}
    @PutMapping("/programs/{id}")
    public ResponseEntity<Program> updateProgram(@PathVariable Long id, @RequestBody Program programDetails) {
        Optional<Program> programOptional = programRepository.findById(id);
        if (programOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Program program = programOptional.get();
        program.setName(programDetails.getName());
        program.setCode(programDetails.getCode());
        program.setDescription(programDetails.getDescription());
        program.setActive(programDetails.isActive());

        Program updatedProgram = programRepository.save(program);
        return ResponseEntity.ok(updatedProgram);
    }

    @DeleteMapping("/programs/{id}")
    public ResponseEntity<?> deleteProgram(@PathVariable Long id) {
        Optional<Program> programOptional = programRepository.findById(id);
        if (programOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Program program = programOptional.get();
        program.setActive(false); // Soft delete
        programRepository.save(program);
        
        return ResponseEntity.ok().build();
    }

    // ================= SEMESTERS =================
    
  @GetMapping("/programs/{programId}/semesters")
public List<Semester> getSemestersByProgram(@PathVariable Long programId) {
    // Start with the simplest method
    return semesterRepository.findByProgramId(programId);
}

    @GetMapping("/semesters")
    public List<Semester> getAllSemesters() {
        return semesterRepository.findAll();
    }

    @GetMapping("/semesters/{id}")
    public ResponseEntity<Semester> getSemesterById(@PathVariable Long id) {
        Optional<Semester> semester = semesterRepository.findById(id);
        return semester.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/semesters")
    public Semester createSemester(@RequestBody Semester semester) {
        return semesterRepository.save(semester);
    }

   @PutMapping("/semesters/{id}")
public ResponseEntity<Semester> updateSemester(@PathVariable Long id, @RequestBody Semester semesterDetails) {
    Optional<Semester> semesterOptional = semesterRepository.findById(id);
    if (semesterOptional.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    Semester semester = semesterOptional.get();
    semester.setName(semesterDetails.getName());
    semester.setActive(semesterDetails.isActive());
    semester.setProgram(semesterDetails.getProgram());

    Semester updatedSemester = semesterRepository.save(semester);
    return ResponseEntity.ok(updatedSemester);
}

    @DeleteMapping("/semesters/{id}")
    public ResponseEntity<?> deleteSemester(@PathVariable Long id) {
        Optional<Semester> semesterOptional = semesterRepository.findById(id);
        if (semesterOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Semester semester = semesterOptional.get();
        semester.setActive(false); // Soft delete
        semesterRepository.save(semester);
        
        return ResponseEntity.ok().build();
    }

    // ================= COURSES =================
    // In AdminManagementController.java

    
    @GetMapping("/semesters/{semesterId}/courses")
    public List<Course> getCoursesBySemester(@PathVariable Long semesterId) {
        return courseRepository.findBySemesterId(semesterId);
    }

    @GetMapping("/courses")
    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<Course> getCourseById(@PathVariable Long id) {
        Optional<Course> course = courseRepository.findById(id);
        return course.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/courses")
    public Course createCourse(@RequestBody Course course) {
        return courseRepository.save(course);
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<Course> updateCourse(@PathVariable Long id, @RequestBody Course courseDetails) {
        Optional<Course> courseOptional = courseRepository.findById(id);
        if (courseOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOptional.get();
        course.setCode(courseDetails.getCode());
        course.setName(courseDetails.getName());
        course.setDescription(courseDetails.getDescription());
        course.setCredits(courseDetails.getCredits());
        course.setActive(courseDetails.isActive());
        course.setSemester(courseDetails.getSemester());

        Course updatedCourse = courseRepository.save(course);
        return ResponseEntity.ok(updatedCourse);
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        Optional<Course> courseOptional = courseRepository.findById(id);
        if (courseOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Course course = courseOptional.get();
        course.setActive(false); // Soft delete
        courseRepository.save(course);
        
        return ResponseEntity.ok().build();
    }

    // ================= TEACHER ASSIGNMENTS =================
    
    @GetMapping("/programs/{programId}/teachers")
    public List<Teacher> getTeachersByProgram(@PathVariable Long programId) {
        return teacherRepository.findActiveTeachersByProgram(programId);
    }

    @GetMapping("/teachers/{teacherId}/courses")
    public List<Course> getCoursesByTeacher(@PathVariable Long teacherId) {
        return courseRepository.findByTeacherId(teacherId);
    }

    @PostMapping("/teachers/{teacherId}/courses/{courseId}/assign")
    public ResponseEntity<?> assignCourseToTeacher(@PathVariable Long teacherId, @PathVariable Long courseId) {
        Optional<Teacher> teacherOptional = teacherRepository.findById(teacherId);
        Optional<Course> courseOptional = courseRepository.findById(courseId);

        if (teacherOptional.isEmpty() || courseOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Teacher teacher = teacherOptional.get();
        Course course = courseOptional.get();

        teacher.addCourse(course);
        teacherRepository.save(teacher);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/teachers/{teacherId}/courses/{courseId}/remove")
    public ResponseEntity<?> removeCourseFromTeacher(@PathVariable Long teacherId, @PathVariable Long courseId) {
        Optional<Teacher> teacherOptional = teacherRepository.findById(teacherId);
        Optional<Course> courseOptional = courseRepository.findById(courseId);

        if (teacherOptional.isEmpty() || courseOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Teacher teacher = teacherOptional.get();
        Course course = courseOptional.get();

        teacher.removeCourse(course);
        teacherRepository.save(teacher);

        return ResponseEntity.ok().build();
    }

    // ================= OVERVIEW & STATS =================
    
    @GetMapping("/assignments/count")
    public Map<String, Long> getAssignmentsCount() {
        // Count teacher-course assignments
        List<Teacher> teachers = teacherRepository.findAll();
        long assignmentCount = teachers.stream()
                .mapToLong(teacher -> teacher.getCourses().size())
                .sum();
        
        Map<String, Long> response = new HashMap<>();
        response.put("count", assignmentCount);
        return response;
    }

    @GetMapping("/structure-tree")
public List<Map<String, Object>> getStructureTree() {
    List<Program> programs = programRepository.findAll();
    
    return programs.stream().map(program -> {
        Map<String, Object> programMap = new HashMap<>();
        programMap.put("id", program.getId());
        programMap.put("name", program.getName());
        programMap.put("code", program.getCode());
        programMap.put("active", program.isActive());
        
        // Load semesters for this program
        List<Semester> semesters = semesterRepository.findByProgramId(program.getId());
        List<Map<String, Object>> semesterList = semesters.stream().map(semester -> {
            Map<String, Object> semesterMap = new HashMap<>();
            semesterMap.put("id", semester.getId());
            semesterMap.put("name", semester.getName());
            semesterMap.put("active", semester.isActive());
            
            // Load courses for this semester
            List<Course> courses = courseRepository.findBySemesterId(semester.getId());
            List<Map<String, Object>> courseList = courses.stream().map(course -> {
                Map<String, Object> courseMap = new HashMap<>();
                courseMap.put("id", course.getId());
                courseMap.put("code", course.getCode());
                courseMap.put("name", course.getName());
                courseMap.put("active", course.isActive());
                
                // Get teacher count for this course
                long teacherCount = course.getTeachers() != null ? course.getTeachers().size() : 0;
                courseMap.put("teacherCount", teacherCount);
                
                return courseMap;
            }).collect(Collectors.toList());
            
            semesterMap.put("courses", courseList);
            return semesterMap;
        }).collect(Collectors.toList());
        
        programMap.put("semesters", semesterList);
        return programMap;
    }).collect(Collectors.toList());
}
    @GetMapping("/programs/{programId}/all-courses")
    public List<Course> getAllCoursesByProgram(@PathVariable Long programId) {
        return courseRepository.findByProgramId(programId);
    }
}