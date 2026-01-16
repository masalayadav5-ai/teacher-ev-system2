package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.repository.EvaluationResponseRepository;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/evaluations")
public class AdminEvaluationController {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private StudentEvaluationRepository evaluationRepository;

    @Autowired
    private EvaluationResponseRepository responseRepository;

    /* =========================================================
       1️⃣ GET ALL TEACHERS WITH THEIR ASSIGNED COURSES
       ========================================================= */
    @GetMapping("/teachers")
    public ResponseEntity<List<Map<String, Object>>> getAllTeachersWithCourses() {

        List<Object[]> rows = teacherRepository.findTeachersWithCourses();

        Map<Long, Map<String, Object>> teacherMap = new LinkedHashMap<>();

        for (Object[] row : rows) {
            Long teacherId = (Long) row[0];
            String teacherName = (String) row[1];
            Long courseId = (Long) row[2];
            String courseName = (String) row[3];

            teacherMap.putIfAbsent(teacherId, new HashMap<>());
            Map<String, Object> teacher = teacherMap.get(teacherId);

            teacher.putIfAbsent("teacherId", teacherId);
            teacher.putIfAbsent("teacherName", teacherName);
            teacher.putIfAbsent("courses", new ArrayList<>());

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> courses =
                    (List<Map<String, Object>>) teacher.get("courses");

            courses.add(Map.of(
                    "courseId", courseId,
                    "courseName", courseName
            ));
        }

        return ResponseEntity.ok(new ArrayList<>(teacherMap.values()));
    }

    /* =========================================================
       2️⃣ GET AVAILABLE WEEKS (Sunday → Saturday)
       ========================================================= */
    @GetMapping("/teacher/{teacherId}/course/{courseId}/weeks")
    public ResponseEntity<List<LocalDate>> getAvailableWeeks(
            @PathVariable Long teacherId,
            @PathVariable Long courseId) {

        List<LocalDate> weeks =
                evaluationRepository.findDistinctWeeksForTeacherCourse(
                        teacherId, courseId
                );

        return ResponseEntity.ok(weeks);
    }

    /* =========================================================
       3️⃣ COURSE + WEEK SUMMARY (CORE ANALYTICS)
       ========================================================= */
    @GetMapping("/teacher/{teacherId}/course/{courseId}/summary")
    public ResponseEntity<Map<String, Object>> getCourseWeekSummary(
            @PathVariable Long teacherId,
            @PathVariable Long courseId,
            @RequestParam LocalDate weekStart) {

        List<StudentEvaluation> evaluations =
                evaluationRepository.findByTeacherCourseWeek(
                        teacherId, courseId, weekStart
                );

       if (evaluations.isEmpty()) {
    return ResponseEntity.ok(Map.of(
            "teacherId", teacherId,
            "courseId", courseId,
            "weekStart", weekStart,
            "totalEvaluations", 0,
            "overallAverage", 0,
            "parameterAverages", List.of()
    ));
}


        /* ---------- OVERALL AVERAGE ---------- */
        double overallAverage = evaluations.stream()
                .map(StudentEvaluation::getOverallRating)
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);

        /* ---------- PARAMETER-WISE AVERAGE ---------- */
        List<Object[]> paramStats =
                responseRepository.parameterAverageForCourseWeek(
                        teacherId, courseId, weekStart
                );

        List<Map<String, Object>> parameterAverages =
                paramStats.stream()
                        .map(r -> Map.of(
                                "questionText", r[0],
                                "average", r[1]
                        ))
                        .collect(Collectors.toList());

        /* ---------- RESPONSE ---------- */
        return ResponseEntity.ok(Map.of(
                "teacherId", teacherId,
                "courseId", courseId,
                "weekStart", weekStart,
                "totalEvaluations", evaluations.size(),
                "overallAverage", Math.round(overallAverage * 100.0) / 100.0,
                "parameterAverages", parameterAverages
        ));
    }
}
