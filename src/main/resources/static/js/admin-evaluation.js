const categoryTypeMap = {
    "Teacher Performance Rating": ["rating"],
    "Learning Experience": ["multiple_choice"],
    "Course Feedback": ["text_area"],
    "Overall Assessment": ["overall_rating", "grade_prediction"]
};

let editingParameterId = null;

// Test the categories endpoint
fetch('/api/evaluation/categories')
    .then(response => {
        console.log('Categories endpoint status:', response.status);
        return response.text(); // Try text first to see what's returned
    })
    .then(text => {
        console.log('Categories response:', text);
        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', json);
        } catch (e) {
            console.log('Not valid JSON:', e.message);
        }
    })
    .catch(error => {
        console.error('Error testing categories endpoint:', error);
    });

// Test the parameters endpoint
fetch('/api/evaluation/parameters')
    .then(response => {
        console.log('Parameters endpoint status:', response.status);
        return response.text();
    })
    .then(text => {
        console.log('Parameters response:', text);
    })
    .catch(error => {
        console.error('Error testing parameters endpoint:', error);
    });
// admin-evaluation.js - Fixed version with error handling

// Global state
let categories = [];
let existingParameters = [];

function initAdminEvaluation() {
    console.log('Admin Evaluation INIT called');

    setupEventListeners();
    loadCategories();
    loadExistingParameters();
}


// Setup all event listeners
function setupEventListeners() {
    // Parameter type change
    const typeSelect = document.getElementById('parameterType');
    if (typeSelect) {
        typeSelect.addEventListener('change', toggleParameterOptions);
    }
    
    // Form submission
    const form = document.getElementById('addParameterForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Retry button if you add one
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', function() {
            loadCategories();
            loadExistingParameters();
        });
    }
    const categorySelect = document.getElementById('categorySelect');
if (categorySelect) {
    categorySelect.addEventListener('change', handleCategoryChange);
}

}

function handleCategoryChange() {
    const categorySelect = document.getElementById('categorySelect');
    const typeSelect = document.getElementById('parameterType');
    const hint = document.getElementById("typeHint");

    const selectedCategoryId = categorySelect.value;
    console.log("Category changed →", selectedCategoryId);

    // Reset if no category
    if (!selectedCategoryId) {
        resetParameterTypeDropdown();
        hint.textContent = "";
        return;
    }

    const selectedCategory = categories.find(c => c.id == selectedCategoryId);
    if (!selectedCategory) {
        console.warn("Selected category not found in categories[]");
        return;
    }

    const allowedTypes = categoryTypeMap[selectedCategory.name];
    console.log("Allowed types:", allowedTypes);

    if (!allowedTypes) {
        resetParameterTypeDropdown();
        hint.textContent = "";
        return;
    }

    // 🔥 Filter dropdown options
    filterParameterTypeOptions(allowedTypes);

    // 🔥 Auto-select if only 1 option
    if (allowedTypes.length === 1) {
        typeSelect.value = allowedTypes[0];
        typeSelect.disabled = true;
        hint.textContent = "Parameter type is auto-selected for this category.";
    } else {
        typeSelect.value = "";
        typeSelect.disabled = false;
        hint.textContent = "Choose one of the allowed parameter types for this category.";
    }

    toggleParameterOptions();
}



function filterParameterTypeOptions(allowedTypes) {
    const typeSelect = document.getElementById('parameterType');

    const allOptions = [
        { value: "", label: "Select Type" },
        { value: "rating", label: "Rating Scale (1-5)" },
        { value: "multiple_choice", label: "Multiple Choice" },
        { value: "text_area", label: "Text Area" },
        { value: "overall_rating", label: "Overall Rating" },
        { value: "grade_prediction", label: "Grade Prediction" }
    ];

    // Clear existing
    typeSelect.innerHTML = "";

    // Add only allowed
    allOptions.forEach(opt => {
        if (opt.value === "" || allowedTypes.includes(opt.value)) {
            const option = document.createElement("option");
            option.value = opt.value;
            option.textContent = opt.label;
            typeSelect.appendChild(option);
        }
    });
}

function resetParameterTypeDropdown() {
    const typeSelect = document.getElementById('parameterType');

    typeSelect.innerHTML = `
        <option value="">Select Type</option>
        <option value="rating">Rating Scale (1-5)</option>
        <option value="multiple_choice">Multiple Choice</option>
        <option value="text_area">Text Area</option>
        <option value="overall_rating">Overall Rating</option>
        <option value="grade_prediction">Grade Prediction</option>
    `;

    typeSelect.disabled = false;
    toggleParameterOptions();
}

// Load categories from API
async function loadCategories() {
    try {
        console.log('Loading categories...');
        
        // Show loading state
        showLoading('categories');
        
        const response = await fetch('/api/evaluation/categories', {
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        console.log('Categories response status:', response.status);
        
        if (!response.ok) {
            // Try alternative endpoint
            const altResponse = await fetch('/api/evaluation/form-structure', {
                credentials: 'include'
            });
            
            if (altResponse.ok) {
                const data = await altResponse.json();
                if (data.categories) {
                    categories = data.categories;
                    populateCategoryDropdown();
                    hideLoading('categories');
                    return;
                }
            }
            
            throw new Error(`HTTP ${response.status}: Failed to load categories`);
        }
        
       const text = await response.text();
console.log('Categories RAW response:', text);

let data;
try {
    data = JSON.parse(text);
} catch (e) {
    throw new Error('Backend returned invalid JSON');
}

        
        // Handle different response formats
        if (Array.isArray(data)) {
            categories = data;
        } else if (data.categories) {
            categories = data.categories;
        } else if (data.success && data.categories) {
            categories = data.categories;
        } else {
            throw new Error('Invalid response format');
        }
        
        populateCategoryDropdown();
        hideLoading('categories');
        
    } catch (error) {
        console.error('Error loading categories:', error);
        showError('categories', 'Failed to load categories: ' + error.message);
        
        // Try to use default categories as fallback
        useDefaultCategories();
    }
}

// Use default categories if API fails
function useDefaultCategories() {
    console.log('Using default categories');
    
    categories = [
        { id: 1, name: 'Teacher Performance Rating', description: 'Rate teacher performance' },
        { id: 2, name: 'Learning Experience', description: 'Learning experience questions' },
        { id: 3, name: 'Overall Assessment', description: 'Final rating and grade' }
    ];
    
    populateCategoryDropdown();
    hideLoading('categories');
}

// Populate category dropdown
function populateCategoryDropdown() {
    const categorySelect = document.getElementById('categorySelect');
    if (!categorySelect) {
        console.error('categorySelect element not found');
        return;
    }
    
    // Clear existing options except the first one
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    if (!categories || categories.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No categories available';
        option.disabled = true;
        categorySelect.appendChild(option);
        return;
    }
    
    // Sort categories by id or name
    const sortedCategories = [...categories].sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Add category options
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = `${category.name}`;
        if (category.description) {
            option.title = category.description;
        }
        categorySelect.appendChild(option);
    });
    // 🔥 Re-apply rules if a category is already selected
const selected = categorySelect.value;
if (selected) {
    handleCategoryChange();
}

    console.log(`Populated ${sortedCategories.length} categories`);
}


// Display existing parameters
function displayExistingParameters() {
    const container = document.getElementById('parameterManagement');
    if (!container) {
        console.error('parameterManagement container not found');
        return;
    }
    
    if (!existingParameters || existingParameters.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list fa-3x"></i>
                <h3>No Parameters Yet</h3>
                <p>Add your first evaluation parameter using the form below.</p>
            </div>
        `;
        return;
    }
    
    // Group parameters by category
    const parametersByCategory = {};
    existingParameters.forEach(param => {
        const categoryId = param.categoryId || param.category?.id || 'uncategorized';
        if (!parametersByCategory[categoryId]) {
            parametersByCategory[categoryId] = [];
        }
        parametersByCategory[categoryId].push(param);
    });
    
    let html = '<div class="parameters-list">';
    
    // Display each category's parameters
    Object.keys(parametersByCategory).forEach(categoryId => {
        const categoryParams = parametersByCategory[categoryId];
        const category = categories.find(c => c.id == categoryId) || { name: 'Uncategorized' };
        
        html += `
            <div class="category-section">
                <h3>${category.name}</h3>
                <div class="parameters-grid">
        `;
        
        categoryParams.forEach(param => {
            html += `
                <div class="parameter-card">
                    <div class="parameter-header">
                      <span class="parameter-type">${param.parameterType || 'Unknown'}</span>

                        <span class="parameter-status ${param.isActive ? 'active' : 'inactive'}">
                            ${param.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="parameter-body">
                        <p class="parameter-question">${param.questionText || 'No question text'}</p>
                        <div class="parameter-meta">
                            <span>Required: ${param.isRequired ? 'Yes' : 'No'}</span>
                            <span>Order: ${param.sortOrder || 0}</span>
                        </div>
                    </div>
                    <div class="parameter-actions">
                        <button class="btn-edit" onclick="editParameter(${param.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteParameter(${param.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

// Toggle parameter options based on type
function toggleParameterOptions() {
    const type = document.getElementById('parameterType').value;
    
    // Hide all option sections
    const sections = ['ratingOptions', 'multipleChoiceOptions', 'gradeOptions'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    
    // Show relevant section
    switch(type) {
        case 'rating':
        case 'overall_rating':
            document.getElementById('ratingOptions').style.display = 'block';
            break;
        case 'multiple_choice':
            document.getElementById('multipleChoiceOptions').style.display = 'block';
            break;
        case 'grade_prediction':
            document.getElementById('gradeOptions').style.display = 'block';
            break;
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Get form values
        const categoryId = document.getElementById('categorySelect').value;
        const questionText = document.getElementById('questionText').value.trim();
        const parameterType = document.getElementById('parameterType').value;
        const sortOrder = parseInt(document.getElementById('sortOrder').value) || 0;
        const isRequired = document.getElementById('isRequired').checked;
        const isActive = document.getElementById('isActive').checked;
        
        // Validate
        if (!categoryId) {
            alert('Please select a category');
            return;
        }
        if (!questionText) {
            alert('Please enter question text');
            return;
        }
        if (!parameterType) {
            alert('Please select parameter type');
            return;
        }
        
       const parameterData = {
    categoryId: categoryId,
    questionText: questionText,

    // 🔥 REQUIRED by backend
    parameterType: parameterType,

    // (optional but safe if controller still reads `type`)
    type: parameterType,

    sortOrder: sortOrder,
    isRequired: isRequired,
    isActive: isActive
};

        // Add type-specific options
        switch(parameterType) {
            case 'rating':
            case 'overall_rating':
                const scaleMin = document.getElementById('scaleMinLabel').value.trim() || 'Poor';
                const scaleMax = document.getElementById('scaleMaxLabel').value.trim() || 'Excellent';
                parameterData.scaleLabels = { min: scaleMin, max: scaleMax };
                parameterData.scaleMin = 1;
                parameterData.scaleMax = 5;
                break;
                
            case 'multiple_choice':
                const optionsText = document.getElementById('mcOptions').value.trim();
                if (!optionsText) {
                    alert('Please enter multiple choice options (comma-separated)');
                    return;
                }
                parameterData.options = optionsText.split(',').map(opt => opt.trim()).filter(opt => opt);
                break;
                
            case 'grade_prediction':
                const grades = [];
                ['A', 'B', 'C', 'D', 'F'].forEach(grade => {
                    if (document.getElementById(`grade${grade}`).checked) {
                        grades.push(grade);
                    }
                });
                if (grades.length === 0) {
                    alert('Please select at least one grade option');
                    return;
                }
                parameterData.options = grades;
                break;
        }
        
        console.log('Submitting parameter:', parameterData);
        
        // Submit to API
      // Decide ADD or EDIT
const url = editingParameterId
    ? `/api/evaluation/parameters/${editingParameterId}`
    : '/api/evaluation/parameters';

const method = editingParameterId ? 'PUT' : 'POST';

// Submit to API
const response = await fetch(url, {
    method: method,
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(parameterData),
    credentials: 'include'
});

        
        const result = await response.json();
        
        if (response.ok && result.success !== false) {

  showSuccess(editingParameterId ? 'Parameter updated successfully' : 'Parameter added successfully');


    editingParameterId = null; // 🔥 RESET EDIT MODE

    document.getElementById('addParameterForm').reset();

    // Optional: reset button text if you change it during edit
    document.querySelector('.submit-button').innerHTML =
        '<i class="fas fa-plus"></i> Add Parameter';

    toggleParameterOptions();
    loadExistingParameters();
}
 else {
            throw new Error(result.message || 'Failed to add parameter');
        }
        
    } catch (error) {
        console.error('Error adding parameter:', error);
        alert('Error: ' + error.message);
    }
}

async function loadExistingParameters() {
    console.log('Loading existing parameters...');

    const container = document.getElementById('parameterManagement');
    if (!container) return;

    // ✅ show loading UI
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading parameters...</p>
        </div>
    `;

    try {
        const response = await fetch('/api/evaluation/parameters', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load parameters`);
        }

        const data = await response.json();

        existingParameters = Array.isArray(data)
            ? data
            : (data.parameters || []);

        displayExistingParameters();

    } catch (error) {
        console.error('Error loading parameters:', error);
        existingParameters = [];
        displayExistingParameters(); // still render empty state
        // optional message box:
        // showError('parameterManagement', 'Failed to load parameters');
    }
}



function hideLoading(section) {
    // Loading states are replaced when content loads
}

function showError(section, message) {
    const container = document.getElementById('parameterManagement');
    if (container && section === 'parameters') {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle fa-3x"></i>
                <h3>Error Loading</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="loadExistingParameters()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        `;
    }
    
    console.error(`${section} error:`, message);
}


function editParameter(id) {
    const param = existingParameters.find(p => p.id === id);
    if (!param) {
        showError('parameterManagement', 'Parameter not found');
        return;
    }

    editingParameterId = id;

    document.getElementById('categorySelect').value = param.categoryId;
    document.getElementById('questionText').value = param.questionText;
    document.getElementById('parameterType').value = param.parameterType;
    document.getElementById('sortOrder').value = param.sortOrder || 0;
    document.getElementById('isRequired').checked = param.isRequired;
    document.getElementById('isActive').checked = param.isActive;

    toggleParameterOptions();
loadExistingParameters();
    document.querySelector('.submit-button').innerHTML =
        '<i class="fas fa-save"></i> Update Parameter';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}



async function deleteParameter(id) {
    if (!confirm('Are you sure you want to delete this parameter?')) return;

    try {
        // 🔥 Show loading state
        showLoading('parameterManagement');

        const response = await fetch(`/api/evaluation/parameters/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        showSuccess('Parameter deleted successfully');

        // 🔥 Reload and re-render
        await loadExistingParameters();

    } catch (error) {
        console.error(error);
        showError('parameterManagement', 'Error deleting parameter');
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