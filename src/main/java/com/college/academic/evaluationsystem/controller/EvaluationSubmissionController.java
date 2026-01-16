package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.*;
import com.college.academic.evaluationsystem.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/evaluation")
public class EvaluationSubmissionController {
    
    @Autowired
    private StudentEvaluationRepository evaluationRepository;
    
    @Autowired
    private EvaluationResponseRepository responseRepository;
    
    @Autowired
    private EvaluationParameterRepository parameterRepository;
    
    @Autowired
    private EvaluationCategoryRepository categoryRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    private LocalDate getCurrentWeekStart() {
    return LocalDate.now()
            .with(java.time.DayOfWeek.MONDAY);
}

    // Get evaluation form structure with categories
    @GetMapping("/form-structure")
    public ResponseEntity<?> getEvaluationFormStructure() {
        try {
            // Get active categories with their parameters
            List<EvaluationCategory> categories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
            
            // Transform to frontend-friendly format
            List<Map<String, Object>> formStructure = categories.stream()
                .map(category -> {
                    Map<String, Object> categoryData = new HashMap<>();
                    categoryData.put("id", category.getId());
                    categoryData.put("name", category.getName());
                    categoryData.put("description", category.getDescription());
                    categoryData.put("sortOrder", category.getSortOrder());
                    
                    // Get active parameters for this category
                    List<EvaluationParameter> activeParameters = category.getParameters().stream()
                        .filter(param -> param.getIsActive() != null && param.getIsActive())
                        .sorted(Comparator.comparing(EvaluationParameter::getSortOrder))
                        .collect(Collectors.toList());
                    
                    List<Map<String, Object>> parameters = activeParameters.stream()
                        .map(param -> convertParameterToMap(param))
                        .collect(Collectors.toList());
                    
                    categoryData.put("parameters", parameters);
                    return categoryData;
                })
                .filter(category -> !((List<?>) category.get("parameters")).isEmpty()) // Remove empty categories
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "categories", formStructure,
                "timestamp", LocalDateTime.now().toString()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error loading form structure: " + e.getMessage()
            ));
        }
    }
    
    // Get evaluation form data with pre-check
    @GetMapping("/form-data")
    public ResponseEntity<Map<String, Object>> getEvaluationFormData(
            @RequestParam Long teacherId,
            @RequestParam Long studentId,
            @RequestParam Long courseId) {
        
        try {
            // Check if already evaluated
            boolean exists = evaluationRepository.existsByTeacherAndStudentAndCourse(teacherId, studentId, courseId);
            if (exists) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "alreadyEvaluated", true,
                    "message", "You have already evaluated this teacher for this course"
                ));
            }
            
            // Get form structure
            ResponseEntity<?> formStructureResponse = getEvaluationFormStructure();
            
            if (formStructureResponse.getBody() instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = (Map<String, Object>) formStructureResponse.getBody();
                
                if (Boolean.TRUE.equals(body.get("success"))) {
                    Map<String, Object> response = new HashMap<>(body);
                    response.put("teacherId", teacherId);
                    response.put("studentId", studentId);
                    response.put("courseId", courseId);
                    response.put("alreadyEvaluated", false);
                    
                    return ResponseEntity.ok(response);
                }
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to load form structure"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error: " + e.getMessage()
            ));
        }
    }
    
    // Complete evaluation submission
    @PostMapping("/complete-submit")
    @Transactional
    public ResponseEntity<Map<String, Object>> completeSubmit(
            @RequestBody Map<String, Object> request) {
        
        try {
            // Extract data
            Long teacherId = Long.parseLong(request.get("teacherId").toString());
            Long studentId = Long.parseLong(request.get("studentId").toString());
            Long courseId = Long.parseLong(request.get("courseId").toString());
            
            Double overallRating = null;
            if (request.get("overallRating") != null) {
                overallRating = Double.parseDouble(request.get("overallRating").toString());
            }
            
            String predictedGrade = (String) request.get("predictedGrade");
            
            @SuppressWarnings("unchecked")
            Map<String, Object> responses = (Map<String, Object>) request.get("responses");
            
          
            Optional<StudentEvaluation> lastEvalOpt =
    evaluationRepository.findTopByTeacherIdAndStudentIdAndCourseIdOrderBySubmittedAtDesc(
        teacherId, studentId, courseId
    );

if (lastEvalOpt.isPresent() && lastEvalOpt.get().getSubmittedAt() != null) {
    LocalDateTime nextAllowedAt = lastEvalOpt.get().getSubmittedAt().plusDays(7);

    if (LocalDateTime.now().isBefore(nextAllowedAt)) {
        return ResponseEntity.badRequest().body(Map.of(
            "success", false,
            "message", "You can evaluate again after 7 days.",
            "nextAllowedAt", nextAllowedAt.toString()
        ));
    }
}

            
            // 1. Create evaluation
        StudentEvaluation evaluation = new StudentEvaluation();
evaluation.setTeacherId(teacherId);
evaluation.setStudentId(studentId);
evaluation.setCourseId(courseId);
evaluation.setIsSubmitted(false);

// 🔥 FIX 1 (REQUIRED)
evaluation.setWeekStart(getCurrentWeekStart());

evaluation = evaluationRepository.save(evaluation);

            
            // 2. Save all responses
            List<String> savedResponses = new ArrayList<>();
            for (Map.Entry<String, Object> entry : responses.entrySet()) {
                try {
                    Long parameterId = Long.parseLong(entry.getKey());
                    Object value = entry.getValue();
                    
                    EvaluationParameter parameter = parameterRepository.findById(parameterId)
                        .orElseThrow(() -> new IllegalArgumentException("Invalid parameter ID: " + parameterId));
                    
                    EvaluationResponse response = new EvaluationResponse();
                    response.setEvaluation(evaluation);
                    response.setParameter(parameter);
                    response.setResponseValue(value);
                    
                    responseRepository.save(response);
                    savedResponses.add(parameterId.toString());
                    
                } catch (NumberFormatException e) {
                    // Skip invalid parameter IDs
                    continue;
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Error saving response for parameter " + entry.getKey() + ": " + e.getMessage()
                    ));
                }
            }
            
            // 3. Update evaluation
            evaluation.setOverallRating(overallRating);
            evaluation.setPredictedGrade(predictedGrade);
            evaluation.submitEvaluation();
            evaluationRepository.save(evaluation);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Evaluation submitted successfully",
                "evaluationId", evaluation.getId(),
                "submittedAt", evaluation.getSubmittedAt(),
                "responsesCount", savedResponses.size(),
                "overallRating", overallRating,
                "predictedGrade", predictedGrade
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error submitting evaluation: " + e.getMessage()
            ));
        }
    }
    
    // Check evaluation status
@GetMapping("/status")
public ResponseEntity<Map<String, Object>> checkEvaluationStatus(
        @RequestParam Long teacherId,
        @RequestParam Long studentId,
        @RequestParam Long courseId) {

    try {
        Optional<StudentEvaluation> lastEvalOpt =
                evaluationRepository
                        .findTopByTeacherIdAndStudentIdAndCourseIdOrderBySubmittedAtDesc(
                                teacherId, studentId, courseId
                        );

        Map<String, Object> response = new HashMap<>();

        if (lastEvalOpt.isEmpty()) {
            response.put("exists", false);
            response.put("canEvaluate", true);
            return ResponseEntity.ok(response);
        }

        StudentEvaluation lastEval = lastEvalOpt.get();

        response.put("exists", true);
        response.put("isSubmitted", Boolean.TRUE.equals(lastEval.getIsSubmitted()));

        LocalDateTime submittedAt = lastEval.getSubmittedAt();
        response.put("submittedAt", submittedAt);

        if (submittedAt == null) {
            response.put("canEvaluate", true);
            return ResponseEntity.ok(response);
        }

        LocalDateTime nextAllowedAt = submittedAt.plusDays(7);
        response.put("nextAllowedAt", nextAllowedAt);
        response.put("canEvaluate", LocalDateTime.now().isAfter(nextAllowedAt));

        return ResponseEntity.ok(response);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.ok(Map.of(
                "exists", false,
                "canEvaluate", true
        ));
    }
}


    // Helper method to convert parameter to map
    private Map<String, Object> convertParameterToMap(EvaluationParameter parameter) {
        Map<String, Object> paramData = new HashMap<>();
        paramData.put("id", parameter.getId());
        paramData.put("questionText", parameter.getQuestionText());
        paramData.put("type", parameter.getParameterType());
        paramData.put("isRequired", parameter.getIsRequired() != null ? parameter.getIsRequired() : true);
        paramData.put("sortOrder", parameter.getSortOrder());
        
        // Add type-specific data
        switch(parameter.getParameterType()) {
            case "rating":
            case "overall_rating":
                paramData.put("scaleMin", parameter.getScaleMin() != null ? parameter.getScaleMin() : 1);
                paramData.put("scaleMax", parameter.getScaleMax() != null ? parameter.getScaleMax() : 5);
                try {
                    if (parameter.getScaleLabels() != null && !parameter.getScaleLabels().isEmpty()) {
                        paramData.put("scaleLabels", objectMapper.readValue(parameter.getScaleLabels(), Map.class));
                    } else {
                        paramData.put("scaleLabels", Map.of("min", "Poor", "max", "Excellent"));
                    }
                } catch (Exception e) {
                    paramData.put("scaleLabels", Map.of("min", "Poor", "max", "Excellent"));
                }
                break;
                
            case "multiple_choice":
            case "select":
            case "grade_prediction":
                try {
                    if (parameter.getOptions() != null && !parameter.getOptions().isEmpty()) {
                        paramData.put("options", objectMapper.readValue(parameter.getOptions(), List.class));
                    } else {
                        // Default options for grade prediction
                        if ("grade_prediction".equals(parameter.getParameterType())) {
                            paramData.put("options", Arrays.asList("A", "B", "C", "D", "F"));
                        } else {
                            paramData.put("options", Arrays.asList("Always", "Often", "Sometimes", "Rarely", "Never"));
                        }
                    }
                } catch (Exception e) {
                    paramData.put("options", Arrays.asList("Option 1", "Option 2", "Option 3"));
                }
                break;
                
            case "text_area":
                // No additional data needed for text areas
                break;
        }
        
        return paramData;
    }
}