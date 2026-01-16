package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.dto.EvaluationParameterDTO;
import com.college.academic.evaluationsystem.model.EvaluationCategory;
import com.college.academic.evaluationsystem.model.EvaluationParameter;
import com.college.academic.evaluationsystem.repository.EvaluationCategoryRepository;
import com.college.academic.evaluationsystem.repository.EvaluationParameterRepository;
import com.college.academic.evaluationsystem.service.EvaluationManagementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation/parameters")
public class EvaluationParameterController {

    @Autowired
    private EvaluationManagementService evaluationService;

    @Autowired
    private EvaluationParameterRepository parameterRepository;

    // ✅ MISSING BEFORE — REQUIRED
    @Autowired
    private EvaluationCategoryRepository categoryRepository;

    /* ===================== READ APIs ===================== */

    private EvaluationParameterDTO toDTO(EvaluationParameter p) {
    EvaluationParameterDTO dto = new EvaluationParameterDTO();
    dto.setId(p.getId());
    dto.setQuestionText(p.getQuestionText());
    dto.setParameterType(p.getParameterType());
    dto.setIsActive(p.getIsActive());
    dto.setIsRequired(p.getIsRequired());
    dto.setSortOrder(p.getSortOrder());

    if (p.getCategory() != null) {
        dto.setCategoryId(p.getCategory().getId());
        dto.setCategoryName(p.getCategory().getName());
    }

    return dto;
}

    @GetMapping
    public ResponseEntity<List<EvaluationParameterDTO>> getAllParameters() {

        List<EvaluationParameterDTO> list = parameterRepository.findAll()
            .stream()
            .map(p -> {
                EvaluationParameterDTO dto = new EvaluationParameterDTO();
                dto.setId(p.getId());
                dto.setQuestionText(p.getQuestionText());
                dto.setParameterType(p.getParameterType());
                dto.setIsActive(p.getIsActive());
                dto.setIsRequired(p.getIsRequired());
                dto.setSortOrder(p.getSortOrder());

                if (p.getCategory() != null) {
                    dto.setCategoryId(p.getCategory().getId());
                    dto.setCategoryName(p.getCategory().getName());
                }

                return dto;
            })
            .toList();

        return ResponseEntity.ok(list);
    }

    @GetMapping("/active")
    public ResponseEntity<List<EvaluationParameter>> getActiveParameters() {
        return ResponseEntity.ok(
            parameterRepository.findByIsActiveTrueOrderByCategory_SortOrderAscSortOrderAsc()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluationParameter> getParameterById(@PathVariable Long id) {
        return parameterRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /* ===================== CREATE ===================== */

    @PostMapping
    public ResponseEntity<?> createParameter(@RequestBody Map<String, Object> request) {
        try {
            if (!request.containsKey("categoryId")) {
                return ResponseEntity.badRequest().body("categoryId is required");
            }

            Long categoryId = Long.parseLong(request.get("categoryId").toString());

            EvaluationParameter saved =
                    evaluationService.createParameter(categoryId, request);

             return ResponseEntity.ok(toDTO(saved));

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed to create parameter");
        }
    }

    /* ===================== UPDATE ===================== */

    @PutMapping("/{id}")
    public ResponseEntity<?> updateParameter(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {

        return parameterRepository.findById(id).map(parameter -> {

            if (updates.containsKey("categoryId")) {
                Long categoryId = Long.parseLong(updates.get("categoryId").toString());
                EvaluationCategory category = categoryRepository.findById(categoryId)
                        .orElseThrow(() -> new RuntimeException("Category not found"));
                parameter.setCategory(category);
            }

            if (updates.containsKey("questionText")) {
                parameter.setQuestionText((String) updates.get("questionText"));
            }

            if (updates.containsKey("parameterType")) {
                parameter.setParameterType((String) updates.get("parameterType"));
            }

            if (updates.containsKey("options")) {
                parameter.setOptions(updates.get("options").toString());
            }

            if (updates.containsKey("scaleMin")) {
                parameter.setScaleMin(Integer.parseInt(updates.get("scaleMin").toString()));
            }

            if (updates.containsKey("scaleMax")) {
                parameter.setScaleMax(Integer.parseInt(updates.get("scaleMax").toString()));
            }

            if (updates.containsKey("scaleLabels")) {
                parameter.setScaleLabels(updates.get("scaleLabels").toString());
            }

            if (updates.containsKey("sortOrder")) {
                parameter.setSortOrder(Integer.parseInt(updates.get("sortOrder").toString()));
            }

            if (updates.containsKey("isRequired")) {
                parameter.setIsRequired(Boolean.parseBoolean(updates.get("isRequired").toString()));
            }

            if (updates.containsKey("isActive")) {
                parameter.setIsActive(Boolean.parseBoolean(updates.get("isActive").toString()));
            }

            EvaluationParameter saved = parameterRepository.save(parameter);

        // ✅ RETURN DTO — NOT ENTITY
        return ResponseEntity.ok(toDTO(saved));


        }).orElse(ResponseEntity.notFound().build());
    }

    /* ===================== DELETE (SOFT) ===================== */

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteParameter(@PathVariable Long id) {

        return parameterRepository.findById(id).map(parameter -> {
            parameter.setIsActive(false);
            parameterRepository.save(parameter);
            return ResponseEntity.ok(Map.of("message", "Parameter deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
