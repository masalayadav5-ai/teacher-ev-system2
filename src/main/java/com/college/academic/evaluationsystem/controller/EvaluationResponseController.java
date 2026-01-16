package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.EvaluationParameter;
import com.college.academic.evaluationsystem.model.EvaluationResponse;
import com.college.academic.evaluationsystem.model.StudentEvaluation;
import com.college.academic.evaluationsystem.repository.EvaluationParameterRepository;
import com.college.academic.evaluationsystem.repository.EvaluationResponseRepository;
import com.college.academic.evaluationsystem.repository.StudentEvaluationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/evaluation/responses")
public class EvaluationResponseController {
    
    @Autowired
    private EvaluationResponseRepository responseRepository;
    
    @Autowired
    private StudentEvaluationRepository evaluationRepository;
    
    @Autowired
    private EvaluationParameterRepository parameterRepository;
    
    // Get all responses
    @GetMapping
    public ResponseEntity<List<EvaluationResponse>> getAllResponses() {
        List<EvaluationResponse> responses = responseRepository.findAll();
        return ResponseEntity.ok(responses);
    }
    
    // Get response by ID
    @GetMapping("/{id}")
    public ResponseEntity<EvaluationResponse> getResponseById(@PathVariable Long id) {
        Optional<EvaluationResponse> response = responseRepository.findById(id);
        return response.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
    
    // Get responses by evaluation
    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<EvaluationResponse>> getResponsesByEvaluation(@PathVariable Long evaluationId) {
        List<EvaluationResponse> responses = responseRepository.findByEvaluationId(evaluationId);
        return ResponseEntity.ok(responses);
    }
    
    // Get responses by parameter
    @GetMapping("/parameter/{parameterId}")
    public ResponseEntity<List<EvaluationResponse>> getResponsesByParameter(@PathVariable Long parameterId) {
        List<EvaluationResponse> responses = responseRepository.findByParameterId(parameterId);
        return ResponseEntity.ok(responses);
    }
    
    // Create response
    @PostMapping
    public ResponseEntity<EvaluationResponse> createResponse(
            @RequestParam Long evaluationId,
            @RequestParam Long parameterId,
            @RequestBody Map<String, Object> responseData) {
        
        Optional<StudentEvaluation> evaluationOpt = evaluationRepository.findById(evaluationId);
        Optional<EvaluationParameter> parameterOpt = parameterRepository.findById(parameterId);
        
        if (!evaluationOpt.isPresent() || !parameterOpt.isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        
        // Check if response already exists
        if (responseRepository.existsByEvaluationIdAndParameterId(evaluationId, parameterId)) {
            return ResponseEntity.badRequest().build();
        }
        
        EvaluationResponse response = new EvaluationResponse();
        response.setEvaluation(evaluationOpt.get());
        response.setParameter(parameterOpt.get());
        
        // Set response value based on type
        Object value = responseData.get("value");
        if (value != null) {
            response.setResponseValue(value);
        }
        
        EvaluationResponse saved = responseRepository.save(response);
        return ResponseEntity.ok(saved);
    }
    
    // Submit multiple responses at once (for evaluation submission)
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> submitResponses(
            @RequestParam Long evaluationId,
            @RequestBody Map<String, Object> responses) {
        
        Optional<StudentEvaluation> evaluationOpt = evaluationRepository.findById(evaluationId);
        if (!evaluationOpt.isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        
        int count = 0;
        for (Map.Entry<String, Object> entry : responses.entrySet()) {
            try {
                Long parameterId = Long.parseLong(entry.getKey());
                Object value = entry.getValue();
                
                Optional<EvaluationParameter> parameterOpt = parameterRepository.findById(parameterId);
                if (parameterOpt.isPresent()) {
                    // Check if response already exists
                    if (!responseRepository.existsByEvaluationIdAndParameterId(evaluationId, parameterId)) {
                        EvaluationResponse response = new EvaluationResponse();
                        response.setEvaluation(evaluationOpt.get());
                        response.setParameter(parameterOpt.get());
                        response.setResponseValue(value);
                        responseRepository.save(response);
                        count++;
                    }
                }
            } catch (NumberFormatException e) {
                // Skip invalid parameter IDs
            }
        }
        
        return ResponseEntity.ok(Map.of(
            "message", "Responses submitted successfully",
            "count", String.valueOf(count)
        ));
    }
    
    // Update response
    @PutMapping("/{id}")
    public ResponseEntity<EvaluationResponse> updateResponse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> update) {
        
        return responseRepository.findById(id).map(response -> {
            if (update.containsKey("ratingValue")) {
                response.setRatingValue(Integer.parseInt(update.get("ratingValue").toString()));
            }
            if (update.containsKey("textResponse")) {
                response.setTextResponse((String) update.get("textResponse"));
            }
            if (update.containsKey("selectedOption")) {
                response.setSelectedOption((String) update.get("selectedOption"));
            }
            
            EvaluationResponse updated = responseRepository.save(response);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Delete response
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteResponse(@PathVariable Long id) {
        if (responseRepository.existsById(id)) {
            responseRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Response deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
    
    // Get statistics for a parameter
    @GetMapping("/parameter/{parameterId}/stats")
    public ResponseEntity<Map<String, Object>> getParameterStats(@PathVariable Long parameterId) {
        List<EvaluationResponse> responses = responseRepository.findByParameterId(parameterId);
        
        if (responses.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                "total", 0,
                "message", "No responses found"
            ));
        }
        
        // For rating parameters, calculate average
        Optional<EvaluationParameter> parameterOpt = parameterRepository.findById(parameterId);
        if (parameterOpt.isPresent() && parameterOpt.get().isRatingType()) {
            double average = responses.stream()
                .filter(r -> r.getRatingValue() != null)
                .mapToInt(EvaluationResponse::getRatingValue)
                .average()
                .orElse(0.0);
            
            Map<Integer, Long> distribution = responses.stream()
                .filter(r -> r.getRatingValue() != null)
                .collect(java.util.stream.Collectors.groupingBy(
                    EvaluationResponse::getRatingValue,
                    java.util.stream.Collectors.counting()
                ));
            
            return ResponseEntity.ok(Map.of(
                "total", responses.size(),
                "average", Math.round(average * 100.0) / 100.0,
                "distribution", distribution
            ));
        }
        
        return ResponseEntity.ok(Map.of(
            "total", responses.size(),
            "responses", responses
        ));
    }
}