package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.repository.CourseRepository;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
 
@RestController
@RequestMapping("/api/student-profile")
public class StudentProfileAcademicController {

    @Autowired
    private StudentEvaluationRepository evaluationRepository;
    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private CourseRepository courseRepository;

    // ================= EVALUATION WEEKS =================
    @GetMapping("/{studentId}/evaluation-weeks")
    public ResponseEntity<?> getEvaluationWeeks(@PathVariable Long studentId) {

        List<StudentEvaluation> evaluations =
                evaluationRepository.findByStudentIdAndIsSubmittedTrue(studentId);

        if (evaluations.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "weeks", List.of()
            ));
        }

        Map<LocalDate, List<StudentEvaluation>> grouped =
                evaluations.stream()
                        .filter(e -> e.getWeekStart() != null)
                        .collect(Collectors.groupingBy(StudentEvaluation::getWeekStart));

        List<Map<String, Object>> weeks = new ArrayList<>();
        int weekNo = 1;

        for (LocalDate weekStart : grouped.keySet().stream().sorted().toList()) {
            weeks.add(Map.of(
                    "weekNo", weekNo++,
                    "weekStart", weekStart.toString()
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "weeks", weeks
        ));
    }

    // ================= EVALUATIONS BY WEEK =================
    @GetMapping("/{studentId}/evaluations")
public ResponseEntity<?> getEvaluationsByWeek(
        @PathVariable Long studentId,
        @RequestParam String weekStart) {

    LocalDate week = LocalDate.parse(weekStart);

    List<StudentEvaluation> evaluations =
            evaluationRepository.findByStudentIdAndWeekStart(studentId, week);

    List<Map<String, Object>> list = evaluations.stream().map(e -> {

        String teacherName = teacherRepository.findById(e.getTeacherId())
                .map(t -> t.getFullName())
                .orElse("Unknown Teacher");

        String courseName = courseRepository.findById(e.getCourseId())
                .map(c -> c.getName())
                .orElse("Unknown Course");

          Map<String, Object> map = new HashMap<>();
        map.put("evaluationId", e.getId());
        map.put("teacherName", teacherName);
        map.put("courseName", courseName);
        map.put("submittedAt", e.getSubmittedAt());

        return map;
    }).collect(Collectors.toList());


    return ResponseEntity.ok(Map.of(
            "success", true,
            "evaluations", list
    ));
}

    }

