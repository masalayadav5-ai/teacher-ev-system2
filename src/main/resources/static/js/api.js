// API Service
window.API = window.API || {
    // Base URL
    baseURL: '/api',
    
    // Generic fetch with error handling
    fetch: async function(url, options = {}) {
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(`${this.baseURL}${url}`, finalOptions);
            
            // Handle 401 Unauthorized
            if (response.status === 401) {
                window.location.href = '/login';
                return null;
            }
            
            // Handle 403 Forbidden
            if (response.status === 403) {
                throw new Error('Access denied');
            }
            
            // Parse JSON response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
    
    // GET request
    get: function(url) {
        return this.fetch(url, { method: 'GET' });
    },
    
    // POST request
    post: function(url, data) {
        return this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // PUT request
    put: function(url, data) {
        return this.fetch(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // DELETE request
    delete: function(url) {
        return this.fetch(url, { method: 'DELETE' });
    },
    
    // Evaluation API methods
    evaluation: {
        // Get form structure
        getFormStructure: function() {
            return API.get('/evaluation/form-structure');
        },
        
        // Check evaluation status
        checkStatus: function(teacherId, studentId, courseId) {
            return API.get(`/evaluation/status?teacherId=${teacherId}&studentId=${studentId}&courseId=${courseId}`);
        },
        
        // Submit evaluation
        submit: function(data) {
            return API.post('/evaluation/complete-submit', data);
        },
        
        // Get student's courses
        getStudentCourses: function(studentId) {
            return API.get(`/student/${studentId}/courses`);
        }
    }
};

// Make API globally available
window.API = API;