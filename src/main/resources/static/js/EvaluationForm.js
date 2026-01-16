(function () {
      if (window.__evaluationFormLoaded) {
    console.warn("EvaluationForm.js already loaded, skipping...");
    return; // ✅ safe here because it's inside a function
  }
  window.__evaluationFormLoaded = true;

// Global variables
window.evaluationContext = window.evaluationContext || {
    teacherId: null,
    studentId: null,
    courseId: null,
    teacherName: '',
    courseCode: '',
    courseName: ''
};

function ctx() {
  return window.evaluationContext;
}

let formStructure = [];
let userResponses = {};


// Load evaluation form data
async function loadEvaluationForm() {
    showLoading();
    
    try {
        // Get evaluation context from session storage or URL
        const context = sessionStorage.getItem('evaluationContext');
        console.log('Session context:', context);
        if (context) {
            window.evaluationContext = JSON.parse(context);

        } else {
            // Try to get from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
          ctx().teacherId = urlParams.get('teacherId');
ctx().studentId = urlParams.get('studentId');
ctx().courseId  = urlParams.get('courseId');

        }
  
       if (!ctx().teacherId || !ctx().studentId || !ctx().courseId) {
    throw new Error('Missing evaluation parameters');
}

        
        // Check if already evaluated
        const statusResponse = await fetch(
           `/api/evaluation/status?teacherId=${ctx().teacherId}&studentId=${ctx().studentId}&courseId=${ctx().courseId}`,
            { credentials: 'include' }
        );
        
        if (statusResponse.ok) {
            const status = await statusResponse.json();
            if (status.exists && status.isSubmitted && status.canEvaluate === false) {
    showAlreadyEvaluated();
    return;
}

        }
        
        // Load teacher and course details (you need to implement these endpoints)
        await loadTeacherAndCourseDetails();
      

ctx.teacherName = ctx.teacherName || `Teacher ${ctx.teacherId}`;
ctx.courseCode  = ctx.courseCode  || `Course ${ctx.courseId}`;
ctx.courseName  = ctx.courseName  || '';

        // Load form structure from backend
        console.log('Fetching form structure...');
        const formResponse = await fetch('/api/evaluation/form-structure', {
            credentials: 'include'
        });
        console.log('Form response status:', formResponse.status);
        console.log('Form response headers:', formResponse.headers);
        if (!formResponse.ok) {
            throw new Error('Failed to load form structure');
        }
        
        const formData = await formResponse.json();
         console.log('Form data:', formData);
    if (formData.success === false) {
    throw new Error(formData.message || 'Failed to load form');
}
        
        formStructure = formData.categories || [];
        // 🔥 NORMALIZE backend data for frontend compatibility

 console.log(
            'Categories:',
            formStructure.map(c => ({
                name: c.name,
                params: c.parameters?.length
            }))
        );

        // Render the form
        renderFormHeader();
        renderFormSections();
        
        hideLoading();
        showEvaluationContainer();
        
    } catch (error) {
        console.error('Error loading evaluation form:', error);
        showError(error.message);
    }finally {
        hideLoading(); // ✅ ALWAYS EXECUTES
    }
}
// ✅ MANUAL INIT (called from dashboard loader)
window.initEvaluationForm = function () {
    console.log("initEvaluationForm() called");

    const context = JSON.parse(sessionStorage.getItem('evaluationContext'));
    if (!context) {
        showError("Missing evaluation context. Please start again.");
        return;
    }

    loadEvaluationForm();
};

// Load teacher and course details
async function loadTeacherAndCourseDetails() {
    try {
        const teacherResponse = await fetch(`/api/teachers/${ctx().teacherId}`, {
    credentials: 'include'
});

const courseResponse = await fetch(`/api/courses/${ctx().courseId}`, {
    credentials: 'include'
});

if (teacherResponse.ok) {
    const teacher = await teacherResponse.json();

    ctx().teacherName =
        teacher.fullName || teacher.name || `Teacher ${ctx().teacherId}`;
}


if (courseResponse.ok) {
    const course = await courseResponse.json();
    ctx().courseCode = course.code || `Course ${ctx().courseId}`;
    ctx().courseName = course.name || '';
}
    } catch (error) {
        console.warn('Could not load teacher/course details:', error);
        // Use defaults if endpoints not implemented
       ctx().teacherName = `Teacher ${ctx().teacherId}`;
ctx().courseCode  = `Course ${ctx().courseId}`;
    }
}

// Render form header
function renderFormHeader() {
    const header = document.getElementById('formHeader');
    const initials = getInitials(ctx().teacherName);
    
    header.innerHTML = `
        <div class="teacher-avatar">
            <span>${initials}</span>
        </div>
        <div class="teacher-info-header">
            <h2>${ctx().teacherName}</h2>
            <div class="course-info">
                <span>${ctx().courseCode}</span>

                ${ctx().courseName ? `<span class="course-name">${ctx().courseName}</span>` : ''}
            </div>
            <p class="evaluation-instruction">
                <i class="fas fa-info-circle"></i>
                Please provide honest feedback to help improve teaching quality.
            </p>
        </div>
    `;
}

// Render form sections dynamically
function renderFormSections() {
    const form = document.getElementById('evaluationForm');
    form.innerHTML = '';
    
    formStructure.forEach((category, categoryIndex) => {
        const section = document.createElement('div');
        section.className = 'survey-section';
        section.id = `category-${category.id}`;
        
        let sectionHTML = `
            <h2 class="section-title">${categoryIndex + 1}. ${category.name}</h2>
        `;
        
        if (category.description) {
            sectionHTML += `<p class="section-subtitle">${category.description}</p>`;
        }
        
        // Render parameters for this category
        if (category.parameters && category.parameters.length > 0) {
            category.parameters.forEach((parameter, paramIndex) => {
                sectionHTML += renderParameter(parameter, paramIndex + 1);
            });
        }
        
        section.innerHTML = sectionHTML;
        form.appendChild(section);
    });
    
    // Add event listeners after rendering
    attachEventListeners();
}

// Render a single parameter
function renderParameter(parameter, number) {
    let html = '';
    
    switch(parameter.type) {
        case 'rating':
        case 'overall_rating':
            html = renderRatingParameter(parameter, number);
            break;
            
        case 'multiple_choice':
            html = renderMultipleChoiceParameter(parameter, number);
            break;
            
        case 'text_area':
            html = renderTextAreaParameter(parameter, number);
            break;
            
        case 'select':
        case 'grade_prediction':
            html = renderSelectParameter(parameter, number);
            break;
            
        default:
            html = `<p>Unknown parameter type: ${parameter.type}</p>`;
    }
    
    return html;
}

// Render rating parameter
function renderRatingParameter(parameter, number) {
    const scaleMin = parameter.scaleMin || 1;
    const scaleMax = parameter.scaleMax || 5;
    const scaleLabels = parameter.scaleLabels || { min: 'Poor', max: 'Excellent' };
    
    let scaleNumbers = '';
    for (let i = scaleMin; i <= scaleMax; i++) {
        scaleNumbers += `<span class="scale-number" data-value="${i}">${i}</span>`;
    }
    
    return `
        <div class="rating-question" data-parameter-id="${parameter.id}" data-required="${parameter.isRequired}">
            <p class="question-text">
                <span class="question-number">${number}.</span>
                ${parameter.questionText}
                ${parameter.isRequired ? '<span class="required-indicator">*</span>' : ''}
            </p>
            <div class="rating-scale">
                <div class="scale-numbers">
                    ${scaleNumbers}
                </div>
                <div class="scale-labels">
                    <span class="scale-label">${scaleLabels.min}</span>
                    <span class="scale-label">${scaleLabels.max}</span>
                </div>
                <input type="hidden" name="param_${parameter.id}" id="param_${parameter.id}">
            </div>
            <div class="validation-message" id="validation_${parameter.id}" style="display:none; color:red; font-size:12px; margin-top:5px;"></div>
        </div>
    `;
}

// Render multiple choice parameter
function renderMultipleChoiceParameter(parameter, number) {
    const options = parameter.options || ['Always', 'Often', 'Sometimes', 'Rarely', 'Never'];
    
    let optionsHTML = '';
    options.forEach((option, index) => {
        optionsHTML += `
            <label class="option-item">
                <input type="radio" name="param_${parameter.id}" value="${option}" 
                       id="param_${parameter.id}_${index}">
                <span class="option-text">${option}</span>
            </label>
        `;
    });
    
    return `
        <div class="multiple-choice-question" data-parameter-id="${parameter.id}" data-required="${parameter.isRequired}">
            <p class="question-text">
                <span class="question-number">${number}.</span>
                ${parameter.questionText}
                ${parameter.isRequired ? '<span class="required-indicator">*</span>' : ''}
            </p>
            <div class="options-grid">
                ${optionsHTML}
            </div>
            <div class="validation-message" id="validation_${parameter.id}" style="display:none; color:red; font-size:12px; margin-top:5px;"></div>
        </div>
    `;
}

// Render text area parameter
function renderTextAreaParameter(parameter, number) {
    return `
        <div class="text-area-question" data-parameter-id="${parameter.id}" data-required="${parameter.isRequired}">
            <p class="question-text">
                <span class="question-number">${number}.</span>
                ${parameter.questionText}
                ${parameter.isRequired ? '<span class="required-indicator">*</span>' : ''}
            </p>
            <textarea class="text-input" 
                     id="param_${parameter.id}" 
                     name="param_${parameter.id}"
                     placeholder="Type your response here..."
                     rows="4"
                     oninput="onTextAreaChange(${parameter.id}, this.value)"></textarea>
            <div class="validation-message" id="validation_${parameter.id}" style="display:none; color:red; font-size:12px; margin-top:5px;"></div>
        </div>
    `;
}

// Render select parameter
function renderSelectParameter(parameter, number) {
    const options = parameter.options || ['A', 'B', 'C', 'D', 'F'];
    const isGradePrediction = parameter.type === 'grade_prediction';
    
    let optionsHTML = '<option value="" disabled selected>Please Select</option>';
    options.forEach(option => {
        optionsHTML += `<option value="${option}">${option}</option>`;
    });
    
    return `
        <div class="select-question" data-parameter-id="${parameter.id}" data-required="${parameter.isRequired}">
            <p class="question-text">
                <span class="question-number">${number}.</span>
                ${parameter.questionText}
                ${parameter.isRequired ? '<span class="required-indicator">*</span>' : ''}
            </p>
            <select class="grade-select" 
                   id="param_${parameter.id}" 
                   name="param_${parameter.id}"
                   onchange="onSelectChange(${parameter.id}, this.value)">
                ${optionsHTML}
            </select>
            <div class="validation-message" id="validation_${parameter.id}" style="display:none; color:red; font-size:12px; margin-top:5px;"></div>
        </div>
    `;
}

// Attach event listeners
function attachEventListeners() {
    // Rating scale clicks
    document.querySelectorAll('.scale-number').forEach(scaleNumber => {
        scaleNumber.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const question = this.closest('.rating-question');
            const paramId = question.getAttribute('data-parameter-id');
            
            // Update UI
            question.querySelectorAll('.scale-number').forEach(num => {
                num.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Store value
            userResponses[paramId] = parseInt(value);
            document.getElementById(`param_${paramId}`).value = value;
            
            // Clear validation
            clearValidation(paramId);
            checkFormCompletion();
        });
    });
    
    // Radio button clicks
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const name = this.name;
            const paramId = name.replace('param_', '');
            const value = this.value;
            
            // Store value
            userResponses[paramId] = value;
            
            // Update UI
            document.querySelectorAll(`input[name="${name}"]`).forEach(rb => {
                rb.closest('.option-item').classList.remove('selected');
            });
            this.closest('.option-item').classList.add('selected');
            
            // Clear validation
            clearValidation(paramId);
            checkFormCompletion();
        });
    });
    
    // Text area changes
    document.querySelectorAll('.text-input').forEach(textarea => {
        textarea.addEventListener('input', function() {
            const paramId = this.id.replace('param_', '');
            const value = this.value.trim();
            
            if (value) {
                userResponses[paramId] = value;
                clearValidation(paramId);
            } else {
                delete userResponses[paramId];
            }
            
            checkFormCompletion();
        });
    });
    
    // Select changes
    document.querySelectorAll('.grade-select').forEach(select => {
        select.addEventListener('change', function() {
            const paramId = this.id.replace('param_', '');
            const value = this.value;
            
            if (value) {
                userResponses[paramId] = value;
                clearValidation(paramId);
            } else {
                delete userResponses[paramId];
            }
            
            checkFormCompletion();
        });
    });
}

// Check if form is complete
function checkFormCompletion() {
    let allRequiredAnswered = true;
    
    formStructure.forEach(category => {
        if (category.parameters) {
            category.parameters.forEach(parameter => {
                if (parameter.isRequired && !userResponses[parameter.id]) {
                    allRequiredAnswered = false;
                }
            });
        }
    });
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = !allRequiredAnswered;
    
    return allRequiredAnswered;
}

// Submit evaluation
// In EvaluationForm.js - Update the submitEvaluation function:
window.submitEvaluation = async function() {
    if (!checkFormCompletion()) {
        showValidationError('Please answer all required questions.');
        return;
    }
    
    try {
        // Disable submit button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        // Find overall rating and predicted grade from userResponses
        let overallRating = null;
        let predictedGrade = null;
        
        // This assumes your parameters have specific IDs for overall rating and grade prediction
        // You need to adjust based on your actual parameter IDs
        for (const [paramId, value] of Object.entries(userResponses)) {
            // You'll need to check parameter type from formStructure
            const param = findParameterById(paramId);
            if (param) {
                if (param.type === 'overall_rating') {
                    overallRating = parseFloat(value);
                } else if (param.type === 'grade_prediction') {
                    predictedGrade = value;
                }
            }
        }
        
        // Prepare data for submission
        const submissionData = {
            teacherId: ctx().teacherId,
            studentId: ctx().studentId,
            courseId: ctx().courseId,
            responses: userResponses,
            overallRating: overallRating,
            predictedGrade: predictedGrade
        };
        
        console.log('Submitting:', submissionData);
        
        // Submit to backend
        const response = await fetch('/api/evaluation/complete-submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(submissionData),
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess("Evaluation submitted successfully!");
// optional: go back after 1.5s
setTimeout(() => {
  loadPage('/pages/evaldashboard.html'); // if you use dashboard loader
  // OR: window.history.back();
}, 1500);

            // Clear session storage
            sessionStorage.removeItem('evaluationContext');
        } else {
            throw new Error(result.message || 'Submission failed');
        }
        
    } catch (error) {
        console.error('Error submitting evaluation:', error);
        alert('Error submitting evaluation: ' + error.message);
        
        // Re-enable submit button
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Evaluation';
    }
}

// Helper function to find parameter by ID
function findParameterById(paramId) {
    for (const category of formStructure) {
        if (category.parameters) {
            for (const param of category.parameters) {
                if (param.id == paramId) {
                    return param;
                }
            }
        }
    }
    return null;
}

// Helper functions
function getInitials(name) {
  if (!name || typeof name !== 'string') {
    return '??';
  }
  return name
    .trim()
    .split(/\s+/)
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}


function clearValidation(paramId) {
    const validationEl = document.getElementById(`validation_${paramId}`);
    if (validationEl) {
        validationEl.style.display = 'none';
        validationEl.textContent = '';
    }
    
    const errorsContainer = document.getElementById('validationErrors');
    if (errorsContainer) {
        errorsContainer.style.display = 'none';
    }
}

function showValidationError(message) {
    const errorsContainer = document.getElementById('validationErrors');
    if (errorsContainer) {
        errorsContainer.querySelector('p').textContent = message;
        errorsContainer.style.display = 'flex';
        errorsContainer.scrollIntoView({ behavior: 'smooth' });
    }
}
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2 text-muted">Loading...</p>
                </td>
            </tr>
        `;
    }
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="mt-2">${message}</p>
                </td>
            </tr>
        `;
    }
}

function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: message,
        timer: 1500,
        showConfirmButton: false
    });
}

// UI State Management
function showLoading() {
    document.getElementById('loadingState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('alreadyEvaluated').style.display = 'none';
    document.getElementById('evaluationContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingState').style.display = 'none';
}

function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('evaluationContainer').style.display = 'none';
}

function showAlreadyEvaluated() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('evaluationContainer').style.display = 'none';

    document.getElementById('alreadyEvaluated').style.display = 'flex';
}


function showEvaluationContainer() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('alreadyEvaluated').style.display = 'none';

    const container = document.getElementById('evaluationContainer');
    container.style.display = 'block';
}


// Event handler functions for inline event handlers
window.onTextAreaChange = function(paramId, value) {
    if (value.trim()) {
        userResponses[paramId] = value.trim();
        clearValidation(paramId);
    } else {
        delete userResponses[paramId];
    }
    checkFormCompletion();
};

window.onSelectChange = function(paramId, value) {
    if (value) {
        userResponses[paramId] = value;
        clearValidation(paramId);
    } else {
        delete userResponses[paramId];
    }
    checkFormCompletion();
};

console.log('=== EvaluationForm.js Loading Debug ===');
console.log('Script URL:', document.currentScript ? document.currentScript.src : 'Unknown');
console.log('Load count:', window.evalLoadCount = (window.evalLoadCount || 0) + 1);
console.trace('Loading stack trace');

if (window.evalLoadCount > 1) {
    console.error('ERROR: Script loaded multiple times!');
  
}

})();