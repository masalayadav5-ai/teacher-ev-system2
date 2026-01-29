package com.college.academic.evaluationsystem.service;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;

import java.util.List;
import java.util.Map;

@Service
public class EvaluationManagementService {

    @Autowired private EvaluationCategoryRepository categoryRepository;
    @Autowired private EvaluationParameterRepository parameterRepository;
    @Autowired private StudentEvaluationRepository evaluationRepository;
    @Autowired private EvaluationResponseRepository responseRepository;

    /* ===================== CATEGORY ===================== */

    public EvaluationCategory createCategory(String name, String description) {
        EvaluationCategory category = new EvaluationCategory();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    /* ===================== PARAMETER ===================== */

    @Transactional
    public EvaluationParameter createParameter(Long categoryId, Map<String, Object> data) {

        EvaluationCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found"));

        if (!data.containsKey("questionText") || data.get("questionText") == null) {
            throw new IllegalArgumentException("questionText is required");
        }

        if (!data.containsKey("parameterType") || data.get("parameterType") == null) {
            throw new IllegalArgumentException("parameterType is required");
        }

        EvaluationParameter parameter = new EvaluationParameter();
        parameter.setCategory(category);
        parameter.setQuestionText(data.get("questionText").toString());
        parameter.setParameterType(data.get("parameterType").toString());

        if (data.containsKey("options")) {
            parameter.setOptions(data.get("options").toString());
        }

        if (data.containsKey("scaleMin")) {
            parameter.setScaleMin(Integer.parseInt(data.get("scaleMin").toString()));
        }

        if (data.containsKey("scaleMax")) {
            parameter.setScaleMax(Integer.parseInt(data.get("scaleMax").toString()));
        }

        if (data.containsKey("scaleLabels")) {
            parameter.setScaleLabels(data.get("scaleLabels").toString());
        }

        if (data.containsKey("isRequired")) {
            parameter.setIsRequired(Boolean.parseBoolean(data.get("isRequired").toString()));
        }

        if (data.containsKey("sortOrder")) {
            parameter.setSortOrder(Integer.parseInt(data.get("sortOrder").toString()));
        }

        if (data.containsKey("isActive")) {
            parameter.setIsActive(Boolean.parseBoolean(data.get("isActive").toString()));
        }

        return parameterRepository.save(parameter);
    }

    /* ===================== FORM STRUCTURE ===================== */

    public List<EvaluationCategory> getFormStructure() {
        return categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    /* ===================== EVALUATION SUBMIT ===================== */

    @Transactional
public StudentEvaluation submitEvaluation(
        Long teacherId,
        Long studentId,
        Long courseId,
        Map<String, Object> responses,
        Double overallRating,
        String predictedGrade
) {

    // 🔥 NEW: week-based logic
    LocalDate weekStart = LocalDate.now()
        .with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY));

    if (evaluationRepository
        .existsByTeacherIdAndStudentIdAndCourseIdAndWeekStart(
            teacherId, studentId, courseId, weekStart)) {

        throw new IllegalStateException("Already evaluated this week");
    }

    StudentEvaluation evaluation = new StudentEvaluation();
    evaluation.setTeacherId(teacherId);
    evaluation.setStudentId(studentId);
    evaluation.setCourseId(courseId);
    evaluation.setWeekStart(weekStart);   // 🔥 REQUIRED
    evaluation.setIsSubmitted(false);

    evaluationRepository.save(evaluation);

    for (Map.Entry<String, Object> entry : responses.entrySet()) {
        try {
            Long parameterId = Long.parseLong(entry.getKey());
            Object value = entry.getValue();

            EvaluationParameter parameter = parameterRepository.findById(parameterId)
                    .orElseThrow(() -> new IllegalArgumentException("Invalid parameter"));

            EvaluationResponse response = new EvaluationResponse();
            response.setEvaluation(evaluation);
            response.setParameter(parameter);
            response.setResponseValue(value);

            responseRepository.save(response);

        } catch (Exception ignored) {
            // skip invalid entries
        }
    }

    evaluation.setOverallRating(overallRating);
    evaluation.setPredictedGrade(predictedGrade);
    evaluation.submitEvaluation();

    return evaluationRepository.save(evaluation);
}

}
