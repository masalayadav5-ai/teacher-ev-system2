package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.Course;
import com.college.academic.evaluationsystem.model.EvaluationResponse;
import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.model.Teacher;
import com.college.academic.evaluationsystem.model.TeacherCourseHistory;
import com.college.academic.evaluationsystem.repository.EvaluationResponseRepository;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
import com.college.academic.evaluationsystem.repository.TeacherCourseHistoryRepository;
import com.college.academic.evaluationsystem.repository.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
@Autowired
private TeacherCourseHistoryRepository historyRepository;


@GetMapping("/teachers")
public ResponseEntity<List<Map<String, Object>>> getAllTeachersWithCourses(
        @RequestParam(defaultValue = "current") String mode) {

List<TeacherCourseHistory> history;

if ("both".equals(mode)) {
    history = new ArrayList<>();
    history.addAll(historyRepository.findAllActive());
    history.addAll(historyRepository.findAllPrevious());
} else if ("previous".equals(mode)) {
    history = historyRepository.findAllPrevious();
} else {
    history = historyRepository.findAllActive();
}


    Map<Long, Map<String, Object>> teacherMap = new LinkedHashMap<>();

    for (TeacherCourseHistory h : history) {
        Teacher t = h.getTeacher();
        Course c = h.getCourse();

        teacherMap.putIfAbsent(t.getId(), new HashMap<>());
        Map<String, Object> teacher = teacherMap.get(t.getId());

       teacher.putIfAbsent("teacherId", t.getId());          // 🔥 USE DB ID ONLY
teacher.putIfAbsent("teacherCode", t.getTeacherId()); // optional display
       // numeric ID (optional)
        teacher.putIfAbsent("teacherName", t.getFullName());
        teacher.putIfAbsent("courses", new ArrayList<>());

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> courses =
                (List<Map<String, Object>>) teacher.get("courses");

        courses.add(Map.of(
                "courseId", c.getId(),
                "courseName", c.getName()
        ));
    }
System.out.println("MODE: " + mode);
System.out.println("HISTORY SIZE: " + history.size());

    return ResponseEntity.ok(new ArrayList<>(teacherMap.values()));
}




    /* =========================================================
       2️⃣ GET AVAILABLE WEEKS (Sunday → Saturday)
       ========================================================= */
@GetMapping("/teacher/{teacherId}/course/{courseId}/weeks")
public ResponseEntity<List<LocalDate>> getAvailableWeeks(
        @PathVariable Long teacherId,
        @PathVariable Long courseId,
        @RequestParam(defaultValue = "current") String mode) {
try{
    boolean valid = mode.equals("previous")
            ? historyRepository.findPreviousCourses(teacherId)
                .stream().anyMatch(h -> h.getCourse().getId().equals(courseId))
            : historyRepository.findActiveCourses(teacherId)
                .stream().anyMatch(h -> h.getCourse().getId().equals(courseId));

    if (!valid) return ResponseEntity.ok(List.of());


TeacherCourseHistory history;

if ("previous".equals(mode)) {
    history = historyRepository.findPreviousCourses(teacherId)
        .stream()
        .filter(h -> h.getCourse().getId().equals(courseId))
        .max(Comparator.comparing(TeacherCourseHistory::getRemovedAt))
        .orElse(null);
} else {
    history = historyRepository.findActiveCourses(teacherId)
        .stream()
        .filter(h -> h.getCourse().getId().equals(courseId))
        .findFirst()
        .orElse(null);
}


if (history == null) {
    return ResponseEntity.ok(List.of());
}
System.out.println("======== WEEKS DEBUG ========");
System.out.println("MODE        = " + mode);
System.out.println("TEACHER ID  = " + teacherId);
System.out.println("COURSE ID   = " + courseId);
System.out.println("ASSIGNED AT = " + history.getAssignedAt());
System.out.println("REMOVED AT  = " + history.getRemovedAt());
List<LocalDate> rawWeeks =
    evaluationRepository.findDistinctWeeksForTeacherCourseWindowed(
        teacherId,
        courseId,
        history.getAssignedAt(),
        history.getRemovedAt()
    );

List<LocalDate> normalizedWeeks = rawWeeks.stream()
    .map(d -> d.with(java.time.temporal.TemporalAdjusters.previousOrSame(
        java.time.DayOfWeek.SUNDAY)))
    .distinct()
    .sorted(Comparator.reverseOrder())
    .toList();

return ResponseEntity.ok(normalizedWeeks);
}catch (Exception e) {
    e.printStackTrace();   // 🔥 ADD THIS
    return ResponseEntity.ok(List.of());
  }
}



    /* =========================================================
       3️⃣ COURSE + WEEK SUMMARY (CORE ANALYTICS)
       ========================================================= */

@GetMapping("/teacher/{teacherId}/course/{courseId}/summary")
public ResponseEntity<Map<String, Object>> getCourseWeekSummary(
        @PathVariable Long teacherId,
        @PathVariable Long courseId,
        @RequestParam LocalDate weekStart,
        @RequestParam(defaultValue = "current") String mode
) {

  boolean valid = historyRepository.findByTeacherDbId(teacherId)
        .stream()
        .anyMatch(h ->
                h.getCourse().getId().equals(courseId) &&
                ("previous".equals(mode)
                    ? h.getRemovedAt() != null
                    : h.getRemovedAt() == null)
        );

if (!valid) {
    return ResponseEntity.ok(Map.of(
            "teacherId", teacherId,
            "courseId", courseId,
            "weekStart", weekStart,
            "totalEvaluations", 0,
            "overallAverage", 0,
            "parameterAverages", List.of()
    ));
}


TeacherCourseHistory history;

if ("previous".equals(mode)) {
    history = historyRepository.findPreviousCourses(teacherId)
        .stream()
        .filter(h -> h.getCourse().getId().equals(courseId))
        .max(Comparator.comparing(TeacherCourseHistory::getRemovedAt))
        .orElse(null);
} else {
    history = historyRepository.findActiveCourses(teacherId)
        .stream()
        .filter(h -> h.getCourse().getId().equals(courseId))
        .findFirst()
        .orElse(null);
}


if (history == null) {
    return ResponseEntity.ok(Map.of(
        "teacherId", teacherId,
        "courseId", courseId,
        "weekStart", weekStart,
        "totalEvaluations", 0,
        "overallAverage", 0,
        "parameterAverages", List.of()
    ));
}

LocalDateTime assignedAt = history.getAssignedAt();
LocalDateTime removedAt  = history.getRemovedAt();
LocalDateTime weekStartDT = weekStart.atStartOfDay();
LocalDateTime weekEndDT   = weekStart.plusDays(6).atTime(23, 59, 59);

if (weekEndDT.isBefore(assignedAt) ||
    (removedAt != null && weekStartDT.isAfter(removedAt))) {

    return ResponseEntity.ok(Map.of(
        "teacherId", teacherId,
        "courseId", courseId,
        "weekStart", weekStart,
        "totalEvaluations", 0,
        "overallAverage", 0,
        "parameterAverages", List.of()
    ));
}
// null if active
System.out.println("======== SUMMARY DEBUG ========");
System.out.println("MODE        = " + mode);
System.out.println("TEACHER ID  = " + teacherId);
System.out.println("COURSE ID   = " + courseId);
System.out.println("WEEK START  = " + weekStart);
System.out.println("ASSIGNED AT = " + assignedAt);
System.out.println("REMOVED AT  = " + removedAt);

LocalDate weekEnd = weekStart.plusDays(6);

List<StudentEvaluation> evaluations =
  evaluationRepository.findForAssignmentWindow(
    teacherId,
    courseId,
    weekStart,
    weekEnd,
    assignedAt,
    removedAt
);

System.out.println("EVALUATIONS FOUND = " + evaluations.size());

for (StudentEvaluation e : evaluations) {
    System.out.println(
        "  -> ID=" + e.getId() +
        " | weekStart=" + e.getWeekStart() +
        " | submittedAt=" + e.getSubmittedAt() +
        " | isSubmitted=" + e.getIsSubmitted()
    );
}



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

@GetMapping("/teacher/{teacherId}/course/{courseId}/week/{weekStart}/responses")
public ResponseEntity<List<Map<String, Object>>> getIndividualEvaluations(
        @PathVariable Long teacherId,
        @PathVariable Long courseId,
        @PathVariable LocalDate weekStart,
        @RequestParam(defaultValue = "current") String mode
) {

    TeacherCourseHistory history;

    if ("previous".equals(mode)) {
        history = historyRepository.findPreviousCourses(teacherId)
            .stream()
            .filter(h -> h.getCourse().getId().equals(courseId))
            .max(Comparator.comparing(TeacherCourseHistory::getRemovedAt))
            .orElse(null);
    } else {
        history = historyRepository.findActiveCourses(teacherId)
            .stream()
            .filter(h -> h.getCourse().getId().equals(courseId))
            .findFirst()
            .orElse(null);
    }

    if (history == null) {
        return ResponseEntity.ok(List.of());
    }

    LocalDateTime assignedAt = history.getAssignedAt();
    LocalDateTime removedAt  = history.getRemovedAt();

    // 🔥 HARD WINDOW CHECK (prevents leakage across reassignments)
  LocalDateTime weekStartDT = weekStart.atStartOfDay();
LocalDateTime weekEndDT   = weekStart.plusDays(6).atTime(23, 59, 59);

// Only reject if ENTIRE week is outside assignment window
if (weekEndDT.isBefore(assignedAt) ||
    (removedAt != null && weekStartDT.isAfter(removedAt))) {

    System.out.println("❌ WEEK OUTSIDE WINDOW — FILTERED");
    return ResponseEntity.ok(List.of());
}
System.out.println("WEEK START DT = " + weekStartDT);
System.out.println("WEEK END DT   = " + weekEndDT);
System.out.println("ASSIGNED AT   = " + assignedAt);
System.out.println("REMOVED AT    = " + removedAt);


   LocalDate weekEnd = weekStart.plusDays(6);

List<StudentEvaluation> evaluations =
    evaluationRepository.findForAssignmentWindow(
    teacherId,
    courseId,
    weekStart,
    weekEnd,
    assignedAt,
    removedAt
);



    List<Map<String, Object>> result = new ArrayList<>();

    for (StudentEvaluation eval : evaluations) {

        List<EvaluationResponse> responses =
                responseRepository.findByEvaluationId(eval.getId());

        List<Map<String, String>> responseList = responses.stream()
                .map(r -> Map.of(
                        "questionText", r.getParameter().getQuestionText(),
                        "value", r.getResponseValue()
                ))
                .toList();

        result.add(Map.of(
                "evaluationId", eval.getId(),
                "studentId", eval.getStudentId(),
                "submittedAt", eval.getSubmittedAt(),
                "overallRating", eval.getOverallRating(),
                "predictedGrade", eval.getPredictedGrade(),
                "responses", responseList
        ));
    }

    return ResponseEntity.ok(result);
}

}
