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
import java.util.stream.Collectors;

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

    // ================= GET ALL RESPONSES =================
    @GetMapping
    public ResponseEntity<List<EvaluationResponse>> getAllResponses() {
        return ResponseEntity.ok(responseRepository.findAll());
    }

    // ================= GET RESPONSE BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<EvaluationResponse> getResponseById(@PathVariable Long id) {
        return responseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ================= GET RESPONSES BY EVALUATION =================
    @GetMapping("/evaluation/{evaluationId}")
    public ResponseEntity<List<EvaluationResponse>> getResponsesByEvaluation(@PathVariable Long evaluationId) {
        return ResponseEntity.ok(responseRepository.findByEvaluationId(evaluationId));
    }

    // ================= GET RESPONSES BY PARAMETER =================
    @GetMapping("/parameter/{parameterId}")
    public ResponseEntity<List<EvaluationResponse>> getResponsesByParameter(@PathVariable Long parameterId) {
        return ResponseEntity.ok(responseRepository.findByParameterId(parameterId));
    }

    // ================= CREATE SINGLE RESPONSE =================
    @PostMapping
    public ResponseEntity<EvaluationResponse> createResponse(
            @RequestParam Long evaluationId,
            @RequestParam Long parameterId,
            @RequestBody Map<String, Object> responseData) {

        Optional<StudentEvaluation> evaluationOpt = evaluationRepository.findById(evaluationId);
        Optional<EvaluationParameter> parameterOpt = parameterRepository.findById(parameterId);

        if (evaluationOpt.isEmpty() || parameterOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (responseRepository.existsByEvaluationIdAndParameterId(evaluationId, parameterId)) {
            return ResponseEntity.badRequest().build();
        }

        Object value = responseData.get("value");
        if (value == null) {
            return ResponseEntity.badRequest().build();
        }

        EvaluationResponse response = new EvaluationResponse();
        response.setEvaluation(evaluationOpt.get());
        response.setParameter(parameterOpt.get());

        // 🔥 FIX: ALWAYS store as String
        response.setResponseValue(String.valueOf(value));

        return ResponseEntity.ok(responseRepository.save(response));
    }

    // ================= BULK SUBMIT RESPONSES =================
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, String>> submitResponses(
            @RequestParam Long evaluationId,
            @RequestBody Map<String, Object> responses) {

        Optional<StudentEvaluation> evaluationOpt = evaluationRepository.findById(evaluationId);
        if (evaluationOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        int count = 0;

        for (Map.Entry<String, Object> entry : responses.entrySet()) {
            try {
                Long parameterId = Long.parseLong(entry.getKey());
                Object value = entry.getValue();

                if (value == null) continue;

                Optional<EvaluationParameter> parameterOpt = parameterRepository.findById(parameterId);
                if (parameterOpt.isPresent()
                        && !responseRepository.existsByEvaluationIdAndParameterId(evaluationId, parameterId)) {

                    EvaluationResponse response = new EvaluationResponse();
                    response.setEvaluation(evaluationOpt.get());
                    response.setParameter(parameterOpt.get());

                    // 🔥 FIX: ALWAYS store as String
                    response.setResponseValue(String.valueOf(value));

                    responseRepository.save(response);
                    count++;
                }
            } catch (NumberFormatException ignored) {
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Responses submitted successfully",
                "count", String.valueOf(count)
        ));
    }

    // ================= UPDATE RESPONSE =================
    @PutMapping("/{id}")
    public ResponseEntity<EvaluationResponse> updateResponse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> update) {

        return responseRepository.findById(id).map(response -> {

            if (update.containsKey("responseValue")) {
                response.setResponseValue(
                        String.valueOf(update.get("responseValue"))
                );
            }

            return ResponseEntity.ok(responseRepository.save(response));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ================= DELETE RESPONSE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteResponse(@PathVariable Long id) {
        if (!responseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        responseRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Response deleted successfully"));
    }

    // ================= PARAMETER STATISTICS =================
    @GetMapping("/parameter/{parameterId}/stats")
    public ResponseEntity<Map<String, Object>> getParameterStats(@PathVariable Long parameterId) {

        List<EvaluationResponse> responses = responseRepository.findByParameterId(parameterId);

        if (responses.isEmpty()) {
            return ResponseEntity.ok(Map.of(
                    "total", 0,
                    "message", "No responses found"
            ));
        }

        Optional<EvaluationParameter> parameterOpt = parameterRepository.findById(parameterId);
        if (parameterOpt.isPresent() && parameterOpt.get().isRatingType()) {

           List<Integer> ratings = responses.stream()
        .map(r -> {
            try {
return Integer.valueOf(String.valueOf(r.getResponseValue()));
            } catch (NumberFormatException e) {
                return null;
            }
        })
        .filter(v -> v != null)
        .collect(java.util.stream.Collectors.toList());

            double average = ratings.stream().mapToInt(i -> i).average().orElse(0.0);

            return ResponseEntity.ok(Map.of(
                    "total", responses.size(),
                    "average", Math.round(average * 100.0) / 100.0
            ));
        }

        return ResponseEntity.ok(Map.of(
                "total", responses.size(),
                "responses", responses
        ));
    }
}
