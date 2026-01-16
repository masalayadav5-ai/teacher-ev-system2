// Authentication helper functions
window.Auth = window.Auth ||{
    // Get current user
    getCurrentUser: async function() {
        try {
            const response = await fetch('/api/auth/current-user', {
                credentials: 'include'
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Auth error:', error);
            return null;
        }
    },
    
    // Check if user is authenticated
    isAuthenticated: async function() {
        const user = await this.getCurrentUser();
        return user !== null;
    },
    
    // Get user role
    getUserRole: async function() {
        const user = await this.getCurrentUser();
        return user ? user.role : null;
    },
    
    // Redirect to login if not authenticated
    requireAuth: async function() {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            window.location.href = '/login';
            return false;
        }
        return true;
    },
    
    // Logout
    logout: function() {
        fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/login';
        });
    }
};

// Make Auth globally available
window.Auth = Auth;