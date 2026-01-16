package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.EvaluationCategory;
import com.college.academic.evaluationsystem.repository.EvaluationCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/evaluation/categories")
public class EvaluationCategoryController {
    
    @Autowired
    private EvaluationCategoryRepository categoryRepository;
    
    // Get all categories
    @GetMapping
    public ResponseEntity<List<EvaluationCategory>> getAllCategories() {
        List<EvaluationCategory> categories = categoryRepository.findAllByOrderBySortOrderAsc();
        return ResponseEntity.ok(categories);
    }
    
    // Get active categories
    @GetMapping("/active")
    public ResponseEntity<List<EvaluationCategory>> getActiveCategories() {
        List<EvaluationCategory> categories = categoryRepository.findByIsActiveTrueOrderBySortOrderAsc();
        return ResponseEntity.ok(categories);
    }
    
    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<EvaluationCategory> getCategoryById(@PathVariable Long id) {
        Optional<EvaluationCategory> category = categoryRepository.findById(id);
        return category.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
    
    // Create new category
    @PostMapping
    public ResponseEntity<EvaluationCategory> createCategory(@RequestBody Map<String, Object> request) {
        EvaluationCategory category = new EvaluationCategory();
        category.setName((String) request.get("name"));
        category.setDescription((String) request.get("description"));
        
        if (request.get("sortOrder") != null) {
            category.setSortOrder(Integer.parseInt(request.get("sortOrder").toString()));
        }
        
        if (request.get("isActive") != null) {
            category.setIsActive(Boolean.parseBoolean(request.get("isActive").toString()));
        }
        
        EvaluationCategory savedCategory = categoryRepository.save(category);
        return ResponseEntity.ok(savedCategory);
    }
    
    // Update category
    @PutMapping("/{id}")
    public ResponseEntity<EvaluationCategory> updateCategory(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        
        return categoryRepository.findById(id).map(category -> {
            if (updates.containsKey("name")) {
                category.setName((String) updates.get("name"));
            }
            if (updates.containsKey("description")) {
                category.setDescription((String) updates.get("description"));
            }
            if (updates.containsKey("sortOrder")) {
                category.setSortOrder(Integer.parseInt(updates.get("sortOrder").toString()));
            }
            if (updates.containsKey("isActive")) {
                category.setIsActive(Boolean.parseBoolean(updates.get("isActive").toString()));
            }
            
            EvaluationCategory updated = categoryRepository.save(category);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Delete category (soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteCategory(@PathVariable Long id) {
        return categoryRepository.findById(id).map(category -> {
            category.setIsActive(false);
            categoryRepository.save(category);
            return ResponseEntity.ok(Map.of("message", "Category deactivated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    // Activate category
    @PutMapping("/{id}/activate")
    public ResponseEntity<EvaluationCategory> activateCategory(@PathVariable Long id) {
        return categoryRepository.findById(id).map(category -> {
            category.setIsActive(true);
            EvaluationCategory updated = categoryRepository.save(category);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }
}