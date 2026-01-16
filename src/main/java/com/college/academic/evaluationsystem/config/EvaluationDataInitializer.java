package com.college.academic.evaluationsystem.config;

import com.college.academic.evaluationsystem.model.EvaluationCategory;
import com.college.academic.evaluationsystem.model.EvaluationParameter;
import com.college.academic.evaluationsystem.repository.EvaluationCategoryRepository;
import com.college.academic.evaluationsystem.repository.EvaluationParameterRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Map;

@Configuration
public class EvaluationDataInitializer {
    
    @Autowired
    private EvaluationCategoryRepository categoryRepository;
    
    @Autowired
    private EvaluationParameterRepository parameterRepository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @PostConstruct
    @Transactional
    public void initializeData() {
        if (categoryRepository.count() == 0) {
            createDefaultCategoriesAndParameters();
        }
    }
    
    private void createDefaultCategoriesAndParameters() {
        try {
            // Category 1: Teacher Performance Rating
            EvaluationCategory category1 = new EvaluationCategory();
            category1.setName("Teacher Performance Rating");
            category1.setDescription("Please rate the teacher's performance");
            category1.setSortOrder(1);
            category1 = categoryRepository.save(category1);
            
            // Category 2: Learning Experience
            EvaluationCategory category2 = new EvaluationCategory();
            category2.setName("Learning Experience");
            category2.setDescription("Questions about your learning experience");
            category2.setSortOrder(2);
            category2 = categoryRepository.save(category2);
            
            // Category 3: Course Feedback
            EvaluationCategory category3 = new EvaluationCategory();
            category3.setName("Course Feedback");
            category3.setDescription("Additional feedback about the course");
            category3.setSortOrder(3);
            category3 = categoryRepository.save(category3);
            
            // Category 4: Overall Assessment
            EvaluationCategory category4 = new EvaluationCategory();
            category4.setName("Overall Assessment");
            category4.setDescription("Final rating and grade prediction");
            category4.setSortOrder(4);
            category4 = categoryRepository.save(category4);
            
            // Create default parameters
            createDefaultParameters(category1, category2, category3, category4);
            
            System.out.println("Default evaluation categories and parameters created successfully.");
            
        } catch (Exception e) {
            System.err.println("Error creating default evaluation data: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    private void createDefaultParameters(EvaluationCategory cat1, EvaluationCategory cat2, 
                                         EvaluationCategory cat3, EvaluationCategory cat4) 
            throws JsonProcessingException {
        
        // Category 1: Rating parameters
        String scaleLabels = objectMapper.writeValueAsString(
            Map.of("min", "Strongly Disagree", "max", "Strongly Agree"));
        
        createParameter(cat1, 
            "The teacher demonstrates knowledge of subject matter that extends beyond the textbook.",
            "rating", scaleLabels, 1);
        
        createParameter(cat1,
            "The teacher was able to address and answer all my questions.",
            "rating", scaleLabels, 2);
        
        createParameter(cat1,
            "The teacher clearly explained the course material.",
            "rating", scaleLabels, 3);
        
        createParameter(cat1,
            "The teacher's involving and guiding all students in assessing their own learning speed was great.",
            "rating", scaleLabels, 4);
        
        // Category 2: Multiple choice parameters
        String options = objectMapper.writeValueAsString(
            Arrays.asList("Always", "Often", "Sometimes", "Rarely", "Never"));
        
        createParameter(cat2,
            "Do you feel encouraged to participate the lessons?",
            "multiple_choice", options, 1);
        
        createParameter(cat2,
            "Does the teacher use instructional time effectively?",
            "multiple_choice", options, 2);
        
        createParameter(cat2,
            "Homework that are assigned by the teacher was helpful for my understanding the lessons.",
            "multiple_choice", options, 3);
        
        // Category 3: Text area parameters
        createParameter(cat3,
            "Are there any areas the teacher can improve?",
            "text_area", null, 1);
        
        createParameter(cat3,
            "Additional Notes",
            "text_area", null, 2);
        
        // Category 4: Final assessment
        String overallScale = objectMapper.writeValueAsString(
            Map.of("min", "Poor", "max", "Excellent"));
        
        createParameter(cat4,
            "Overall, please rate your teacher",
            "overall_rating", overallScale, 1);
        
        String gradeOptions = objectMapper.writeValueAsString(
            Arrays.asList("A", "B", "C", "D", "F"));
        
        createParameter(cat4,
            "What do you predict your final grade for this course to be?",
            "grade_prediction", gradeOptions, 2);
    }
    
    private void createParameter(EvaluationCategory category, String questionText, 
                                 String parameterType, String data, int sortOrder) {
        EvaluationParameter parameter = new EvaluationParameter();
        parameter.setCategory(category);
        parameter.setQuestionText(questionText);
        parameter.setParameterType(parameterType);
        parameter.setSortOrder(sortOrder);
        parameter.setIsRequired(true);
        parameter.setIsActive(true);
        
        if (parameterType.equals("rating") || parameterType.equals("overall_rating")) {
            parameter.setScaleLabels(data);
            parameter.setScaleMin(1);
            parameter.setScaleMax(5);
        } else if (parameterType.equals("multiple_choice") || parameterType.equals("grade_prediction")) {
            parameter.setOptions(data);
        }
        
        parameterRepository.save(parameter);
    }
}