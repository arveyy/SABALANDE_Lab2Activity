// ==================== GLOBAL STATE ====================
let currentUser = null;
const STORAGE_KEY = 'ipt_demo_v1';

// Initialize database
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('App starting...');
    
    // Load data
    loadFromStorage();
    
    // Setup routing
    setupRouting();
    
    // Check if user is logged in
    checkAuthState();
    
    // Setup logout button
    setupLogoutButton();
});

// ==================== ROUTING ====================
function setupRouting() {
    // Handle hash changes
    window.addEventListener('hashchange', handleRouting);
    
    // Handle initial load
    if (!window.location.hash) {
        window.location.hash = '#/';
    } else {
        handleRouting();
    }
}

function handleRouting() {
    // Get current hash (remove #/)
    let hash = window.location.hash || '#/';
    let route = hash.replace('#/', '') || 'home';
    
    console.log('Navigating to:', route);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show current page
    let pageId = route + '-page';
    let currentPage = document.getElementById(pageId);
    
    if (currentPage) {
        currentPage.classList.add('active');
        
        // Setup page-specific content
        if (route === 'register') {
            setupRegistrationForm();
        } else if (route === 'verify-email') {
            setupVerificationPage();
        } else if (route === 'login') {
            setupLoginForm();
        } else if (route === 'profile') {
            setupProfilePage();
        } else if (route === 'accounts') {
            setupAccountsPage();
        } else if (route === 'departments') {
            setupDepartmentsPage();
        } else if (route === 'employees') {
            setupEmployeesPage();
        } else if (route === 'requests') {
            setupRequestsPage();
        }
    } else {
        // If page not found, go to home
        window.location.hash = '#/';
        return;
    }
    
    // PROTECTED ROUTES - require login
    const protectedRoutes = ['profile', 'requests', 'employees', 'accounts', 'departments'];
    
    if (protectedRoutes.includes(route) && !currentUser) {
        console.log('Protected route, redirecting to login');
        window.location.hash = '#/login';
        return;
    }
    
    // ADMIN ROUTES - require admin role
    const adminRoutes = ['employees', 'accounts', 'departments'];
    
    if (adminRoutes.includes(route) && (!currentUser || currentUser.role !== 'admin')) {
        console.log('Admin route, redirecting to home');
        window.location.hash = '#/';
        return;
    }
}

// ==================== DATA PERSISTENCE ====================
function loadFromStorage() {
    let stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
        try {
            window.db = JSON.parse(stored);
            console.log('Data loaded from storage');
        } catch (e) {
            console.error('Error loading data, seeding fresh data');
            seedInitialData();
        }
    } else {
        console.log('No stored data, seeding fresh data');
        seedInitialData();
    }
}

function seedInitialData() {
    window.db = {
        accounts: [
            {
                id: 1,
                email: 'admin@example.com',
                password: 'Password123!',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                verified: true
            },
            {
                id: 2,
                email: 'john@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
                verified: true
            }
        ],
        departments: [
            { id: 1, name: 'Engineering', description: 'Software development and engineering' },
            { id: 2, name: 'Human Resources', description: 'HR and personnel management' },
            { id: 3, name: 'Marketing', description: 'Marketing and communications' }
        ],
        employees: [
            {
                id: 1,
                employeeId: 'EMP001',
                email: 'john@example.com',
                position: 'Software Developer',
                departmentId: 1,
                hireDate: '2024-01-15'
            }
        ],
        requests: [
            {
                id: 1,
                employeeEmail: 'john@example.com',
                type: 'Equipment',
                items: [
                    { name: 'Laptop', quantity: 1 },
                    { name: 'Monitor', quantity: 2 }
                ],
                status: 'Approved',
                date: '2024-03-15'
            },
            {
                id: 2,
                employeeEmail: 'john@example.com',
                type: 'Leave',
                items: [
                    { name: 'Vacation Days', quantity: 5 }
                ],
                status: 'Pending',
                date: '2024-03-20'
            }
        ]
    };
    
    saveToStorage();
    console.log('Seed data created');
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    console.log('Data saved to storage');
}

// ==================== AUTH STATE ====================
function setAuthState(isAuth, user = null) {
    currentUser = user;
    let body = document.body;
    
    if (isAuth && user) {
        // User is logged in
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        // Check if admin
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
        
        // Update username in navbar
        document.querySelectorAll('.username-display').forEach(el => {
            el.textContent = user.firstName + ' ' + user.lastName;
        });
        
        console.log('Auth state: logged in as', user.email);
    } else {
        // User is logged out
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated', 'is-admin');
        
        // Clear any stored token
        localStorage.removeItem('auth_token');
        
        console.log('Auth state: logged out');
    }
}

function checkAuthState() {
    let token = localStorage.getItem('auth_token');
    
    if (token) {
        // Find user by email (token is email in this simple system)
        let user = window.db.accounts.find(a => a.email === token);
        
        if (user && user.verified) {
            setAuthState(true, user);
        } else {
            // Invalid token
            localStorage.removeItem('auth_token');
            setAuthState(false);
        }
    } else {
        setAuthState(false);
    }
}

function setupLogoutButton() {
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logoutBtn') {
            e.preventDefault();
            setAuthState(false);
            window.location.hash = '#/';
        }
    });
}

// ==================== REGISTRATION ====================
function setupRegistrationForm() {
    let registerSection = document.getElementById('register-page');
    
    // Create registration form HTML
    registerSection.innerHTML = `
        <h2 class="mb-4">Create Account</h2>
        <div class="row">
            <div class="col-md-6">
                <form id="registerForm">
                    <div class="mb-3">
                        <label for="firstName" class="form-label">First Name</label>
                        <input type="text" class="form-control" id="firstName" required>
                    </div>
                    <div class="mb-3">
                        <label for="lastName" class="form-label">Last Name</label>
                        <input type="text" class="form-control" id="lastName" required>
                    </div>
                    <div class="mb-3">
                        <label for="email" class="form-label">Email</label>
                        <input type="email" class="form-control" id="email" required>
                    </div>
                    <div class="mb-3">
                        <label for="password" class="form-label">Password (min 6 characters)</label>
                        <input type="password" class="form-control" id="password" minlength="6" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Register</button>
                </form>
            </div>
        </div>
    `;
    
    // Add submit handler
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        let firstName = document.getElementById('firstName').value;
        let lastName = document.getElementById('lastName').value;
        let email = document.getElementById('email').value;
        let password = document.getElementById('password').value;
        
        // Check if email exists
        let existingUser = window.db.accounts.find(a => a.email === email);
        
        if (existingUser) {
            showToast('Email already registered!', 'danger');
            return;
        }
        
        // Create new account
        let newUser = {
            id: window.db.accounts.length + 1,
            email: email,
            password: password,
            firstName: firstName,
            lastName: lastName,
            role: 'user',  // Default role
            verified: false // Not verified yet
        };
        
        window.db.accounts.push(newUser);
        saveToStorage();
        
        // Store email for verification
        localStorage.setItem('unverified_email', email);
        
        showToast('Registration successful! Please verify your email.', 'success');
        
        // Go to verify page
        window.location.hash = '#/verify-email';
    });
}

// ==================== EMAIL VERIFICATION ====================
function setupVerificationPage() {
    let verifySection = document.getElementById('verify-email-page');
    let unverifiedEmail = localStorage.getItem('unverified_email');
    
    verifySection.innerHTML = `
        <h2 class="mb-4">Verify Your Email</h2>
        <div class="alert alert-info">
            We've sent a verification email to: <strong>${unverifiedEmail || 'your email'}</strong>
        </div>
        <p>In a real app, you'd click a link in the email. For this demo:</p>
        <button class="btn btn-success" id="simulateVerifyBtn">
            ✅ Simulate Email Verification
        </button>
    `;
    
    document.getElementById('simulateVerifyBtn')?.addEventListener('click', function() {
        let email = localStorage.getItem('unverified_email');
        
        if (!email) {
            showToast('No email to verify', 'warning');
            window.location.hash = '#/register';
            return;
        }
        
        // Find and verify account
        let account = window.db.accounts.find(a => a.email === email);
        
        if (account) {
            account.verified = true;
            saveToStorage();
            
            // Clear the unverified email
            localStorage.removeItem('unverified_email');
            
            showToast('Email verified! You can now login.', 'success');
            window.location.hash = '#/login';
        } else {
            showToast('Account not found. Please register again.', 'danger');
            window.location.hash = '#/register';
        }
    });
}

// ==================== LOGIN ====================
function setupLoginForm() {
    let loginSection = document.getElementById('login-page');
    
    loginSection.innerHTML = `
        <h2 class="mb-4">Login</h2>
        <div class="row">
            <div class="col-md-6">
                <form id="loginForm">
                    <div class="mb-3">
                        <label for="loginEmail" class="form-label">Email</label>
                        <input type="email" class="form-control" id="loginEmail" required>
                    </div>
                    <div class="mb-3">
                        <label for="loginPassword" class="form-label">Password</label>
                        <input type="password" class="form-control" id="loginPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                </form>
                <div id="loginError" class="text-danger mt-3" style="display: none;"></div>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        let email = document.getElementById('loginEmail').value;
        let password = document.getElementById('loginPassword').value;
        let errorDiv = document.getElementById('loginError');
        
        // Find account
        let account = window.db.accounts.find(a => 
            a.email === email && 
            a.password === password
        );
        
        if (!account) {
            errorDiv.textContent = 'Invalid email or password';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (!account.verified) {
            errorDiv.textContent = 'Please verify your email first';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Login successful
        localStorage.setItem('auth_token', account.email);
        setAuthState(true, account);
        
        // Clear error and redirect
        errorDiv.style.display = 'none';
        showToast('Login successful!', 'success');
        window.location.hash = '#/profile';
    });
}

// ==================== PROFILE ====================
function setupProfilePage() {
    if (!currentUser) return;
    
    let profileSection = document.getElementById('profile-page');
    
    profileSection.innerHTML = `
        <h2 class="mb-4">My Profile</h2>
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${currentUser.firstName} ${currentUser.lastName}</h5>
                <p class="card-text">
                    <strong>Email:</strong> ${currentUser.email}<br>
                    <strong>Role:</strong> ${currentUser.role}<br>
                    <strong>Verified:</strong> ${currentUser.verified ? '✅ Yes' : '❌ No'}<br>
                    <strong>Account ID:</strong> ${currentUser.id}
                </p>
                <button class="btn btn-primary" id="editProfileBtn">Edit Profile</button>
            </div>
        </div>
    `;
    
    document.getElementById('editProfileBtn')?.addEventListener('click', function() {
        showToast('Edit profile feature coming soon!', 'info');
    });
}

// ==================== ADMIN: ACCOUNTS MANAGEMENT ====================
function setupAccountsPage() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    let accountsSection = document.getElementById('accounts-page');
    
    // Build accounts table
    let accountsHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Manage Accounts</h2>
            <button class="btn btn-success" id="addAccountBtn">+ Add Account</button>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Verified</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add each account row
    window.db.accounts.forEach(account => {
        accountsHtml += `
            <tr>
                <td>${account.firstName} ${account.lastName}</td>
                <td>${account.email}</td>
                <td>
                    <span class="badge bg-${account.role === 'admin' ? 'danger' : 'secondary'}">
                        ${account.role}
                    </span>
                </td>
                <td>${account.verified ? '✅' : '❌'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-account" data-id="${account.id}">Edit</button>
                    <button class="btn btn-sm btn-warning reset-pw" data-id="${account.id}">Reset PW</button>
                    ${account.id !== currentUser.id ? 
                        `<button class="btn btn-sm btn-danger delete-account" data-id="${account.id}">Delete</button>` : 
                        ''}
                </td>
            </tr>
        `;
    });
    
    accountsHtml += `
                </tbody>
            </table>
        </div>
        
        <!-- Add/Edit Account Modal -->
        <div class="modal fade" id="accountModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitle">Add Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="accountForm">
                            <input type="hidden" id="accountId">
                            <div class="mb-3">
                                <label for="accFirstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" id="accFirstName" required>
                            </div>
                            <div class="mb-3">
                                <label for="accLastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" id="accLastName" required>
                            </div>
                            <div class="mb-3">
                                <label for="accEmail" class="form-label">Email</label>
                                <input type="email" class="form-control" id="accEmail" required>
                            </div>
                            <div class="mb-3" id="passwordField">
                                <label for="accPassword" class="form-label">Password</label>
                                <input type="password" class="form-control" id="accPassword" minlength="6">
                                <small class="text-muted">Leave blank to keep current password when editing</small>
                            </div>
                            <div class="mb-3">
                                <label for="accRole" class="form-label">Role</label>
                                <select class="form-control" id="accRole">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" class="form-check-input" id="accVerified">
                                <label class="form-check-label" for="accVerified">Verified</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveAccountBtn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    accountsSection.innerHTML = accountsHtml;
    
    // Setup event listeners
    setupAccountEventListeners();
}

function setupAccountEventListeners() {
    // Add button
    document.getElementById('addAccountBtn')?.addEventListener('click', function() {
        document.getElementById('modalTitle').textContent = 'Add Account';
        document.getElementById('accountForm').reset();
        document.getElementById('accountId').value = '';
        document.getElementById('passwordField').style.display = 'block';
        document.getElementById('accPassword').required = true;
        
        let modal = new bootstrap.Modal(document.getElementById('accountModal'));
        modal.show();
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-account').forEach(btn => {
        btn.addEventListener('click', function() {
            let accountId = parseInt(this.dataset.id);
            let account = window.db.accounts.find(a => a.id === accountId);
            
            if (account) {
                document.getElementById('modalTitle').textContent = 'Edit Account';
                document.getElementById('accountId').value = account.id;
                document.getElementById('accFirstName').value = account.firstName;
                document.getElementById('accLastName').value = account.lastName;
                document.getElementById('accEmail').value = account.email;
                document.getElementById('accRole').value = account.role;
                document.getElementById('accVerified').checked = account.verified;
                
                // Password field - not required for edit
                document.getElementById('passwordField').style.display = 'none';
                document.getElementById('accPassword').required = false;
                
                let modal = new bootstrap.Modal(document.getElementById('accountModal'));
                modal.show();
            }
        });
    });
    
    // Save button
    document.getElementById('saveAccountBtn')?.addEventListener('click', function() {
        let id = document.getElementById('accountId').value;
        let firstName = document.getElementById('accFirstName').value;
        let lastName = document.getElementById('accLastName').value;
        let email = document.getElementById('accEmail').value;
        let role = document.getElementById('accRole').value;
        let verified = document.getElementById('accVerified').checked;
        
        if (!firstName || !lastName || !email) {
            showToast('Please fill all required fields', 'warning');
            return;
        }
        
        if (id) {
            // Edit existing
            let account = window.db.accounts.find(a => a.id === parseInt(id));
            if (account) {
                account.firstName = firstName;
                account.lastName = lastName;
                account.email = email;
                account.role = role;
                account.verified = verified;
                
                // Update password if provided
                let password = document.getElementById('accPassword').value;
                if (password) {
                    if (password.length < 6) {
                        showToast('Password must be at least 6 characters', 'warning');
                        return;
                    }
                    account.password = password;
                }
                
                showToast('Account updated successfully', 'success');
            }
        } else {
            // Add new
            let password = document.getElementById('accPassword').value;
            if (!password || password.length < 6) {
                showToast('Password must be at least 6 characters', 'warning');
                return;
            }
            
            // Check if email exists
            if (window.db.accounts.find(a => a.email === email)) {
                showToast('Email already exists', 'danger');
                return;
            }
            
            let newAccount = {
                id: window.db.accounts.length + 1,
                firstName: firstName,
                lastName: lastName,
                email: email,
                password: password,
                role: role,
                verified: verified
            };
            
            window.db.accounts.push(newAccount);
            showToast('Account created successfully', 'success');
        }
        
        saveToStorage();
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
        setupAccountsPage(); // Refresh the page
    });
    
    // Reset password buttons
    document.querySelectorAll('.reset-pw').forEach(btn => {
        btn.addEventListener('click', function() {
            let accountId = parseInt(this.dataset.id);
            let account = window.db.accounts.find(a => a.id === accountId);
            
            if (account) {
                let newPassword = prompt('Enter new password (min 6 characters):');
                if (newPassword && newPassword.length >= 6) {
                    account.password = newPassword;
                    saveToStorage();
                    showToast('Password updated successfully', 'success');
                } else if (newPassword) {
                    showToast('Password must be at least 6 characters', 'warning');
                }
            }
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-account').forEach(btn => {
        btn.addEventListener('click', function() {
            let accountId = parseInt(this.dataset.id);
            
            if (confirm('Are you sure you want to delete this account?')) {
                // Remove account
                window.db.accounts = window.db.accounts.filter(a => a.id !== accountId);
                saveToStorage();
                showToast('Account deleted successfully', 'success');
                setupAccountsPage(); // Refresh
            }
        });
    });
}

// ==================== ADMIN: DEPARTMENTS MANAGEMENT ====================
function setupDepartmentsPage() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    let deptSection = document.getElementById('departments-page');
    
    let deptHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Manage Departments</h2>
            <button class="btn btn-success" id="addDeptBtn">+ Add Department</button>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.db.departments.forEach(dept => {
        deptHtml += `
            <tr>
                <td>${dept.id}</td>
                <td>${dept.name}</td>
                <td>${dept.description}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-dept" data-id="${dept.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-dept" data-id="${dept.id}">Delete</button>
                </td>
            </tr>
        `;
    });
    
    deptHtml += `
                </tbody>
            </table>
        </div>
        
        <!-- Add/Edit Department Modal -->
        <div class="modal fade" id="deptModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deptModalTitle">Add Department</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="deptForm">
                            <input type="hidden" id="deptId">
                            <div class="mb-3">
                                <label for="deptName" class="form-label">Department Name</label>
                                <input type="text" class="form-control" id="deptName" required>
                            </div>
                            <div class="mb-3">
                                <label for="deptDesc" class="form-label">Description</label>
                                <textarea class="form-control" id="deptDesc" rows="3" required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveDeptBtn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    deptSection.innerHTML = deptHtml;
    setupDeptEventListeners();
}

function setupDeptEventListeners() {
    // Add button
    document.getElementById('addDeptBtn')?.addEventListener('click', function() {
        document.getElementById('deptModalTitle').textContent = 'Add Department';
        document.getElementById('deptForm').reset();
        document.getElementById('deptId').value = '';
        
        let modal = new bootstrap.Modal(document.getElementById('deptModal'));
        modal.show();
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-dept').forEach(btn => {
        btn.addEventListener('click', function() {
            let deptId = parseInt(this.dataset.id);
            let dept = window.db.departments.find(d => d.id === deptId);
            
            if (dept) {
                document.getElementById('deptModalTitle').textContent = 'Edit Department';
                document.getElementById('deptId').value = dept.id;
                document.getElementById('deptName').value = dept.name;
                document.getElementById('deptDesc').value = dept.description;
                
                let modal = new bootstrap.Modal(document.getElementById('deptModal'));
                modal.show();
            }
        });
    });
    
    // Save button
    document.getElementById('saveDeptBtn')?.addEventListener('click', function() {
        let id = document.getElementById('deptId').value;
        let name = document.getElementById('deptName').value;
        let description = document.getElementById('deptDesc').value;
        
        if (!name || !description) {
            showToast('Please fill all fields', 'warning');
            return;
        }
        
        if (id) {
            // Edit
            let dept = window.db.departments.find(d => d.id === parseInt(id));
            if (dept) {
                dept.name = name;
                dept.description = description;
                showToast('Department updated successfully', 'success');
            }
        } else {
            // Add
            let newDept = {
                id: window.db.departments.length + 1,
                name: name,
                description: description
            };
            window.db.departments.push(newDept);
            showToast('Department added successfully', 'success');
        }
        
        saveToStorage();
        bootstrap.Modal.getInstance(document.getElementById('deptModal')).hide();
        setupDepartmentsPage();
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-dept').forEach(btn => {
        btn.addEventListener('click', function() {
            let deptId = parseInt(this.dataset.id);
            
            if (confirm('Are you sure you want to delete this department?')) {
                window.db.departments = window.db.departments.filter(d => d.id !== deptId);
                saveToStorage();
                showToast('Department deleted successfully', 'success');
                setupDepartmentsPage();
            }
        });
    });
}

// ==================== ADMIN: EMPLOYEES MANAGEMENT ====================
function setupEmployeesPage() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    let empSection = document.getElementById('employees-page');
    
    let empHtml = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Manage Employees</h2>
            <button class="btn btn-success" id="addEmpBtn">+ Add Employee</button>
        </div>
        
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Hire Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.db.employees.forEach(emp => {
        // Find user account and department
        let user = window.db.accounts.find(a => a.email === emp.email);
        let dept = window.db.departments.find(d => d.id === emp.departmentId);
        
        empHtml += `
            <tr>
                <td>${emp.employeeId}</td>
                <td>${user ? user.firstName + ' ' + user.lastName : 'Unknown'}</td>
                <td>${emp.email}</td>
                <td>${emp.position}</td>
                <td>${dept ? dept.name : 'Unknown'}</td>
                <td>${emp.hireDate}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-emp" data-id="${emp.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-emp" data-id="${emp.id}">Delete</button>
                </td>
            </tr>
        `;
    });
    
    empHtml += `
                </tbody>
            </table>
        </div>
        
        <!-- Add/Edit Employee Modal -->
        <div class="modal fade" id="empModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="empModalTitle">Add Employee</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="empForm">
                            <input type="hidden" id="empId">
                            <div class="mb-3">
                                <label for="empEmployeeId" class="form-label">Employee ID</label>
                                <input type="text" class="form-control" id="empEmployeeId" required>
                            </div>
                            <div class="mb-3">
                                <label for="empEmail" class="form-label">User Email</label>
                                <select class="form-control" id="empEmail" required>
                                    <option value="">Select User</option>
                                    ${window.db.accounts.map(a => 
                                        `<option value="${a.email}">${a.firstName} ${a.lastName} (${a.email})</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="empPosition" class="form-label">Position</label>
                                <input type="text" class="form-control" id="empPosition" required>
                            </div>
                            <div class="mb-3">
                                <label for="empDepartment" class="form-label">Department</label>
                                <select class="form-control" id="empDepartment" required>
                                    <option value="">Select Department</option>
                                    ${window.db.departments.map(d => 
                                        `<option value="${d.id}">${d.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="empHireDate" class="form-label">Hire Date</label>
                                <input type="date" class="form-control" id="empHireDate" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveEmpBtn">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    empSection.innerHTML = empHtml;
    setupEmpEventListeners();
}

function setupEmpEventListeners() {
    // Add button
    document.getElementById('addEmpBtn')?.addEventListener('click', function() {
        document.getElementById('empModalTitle').textContent = 'Add Employee';
        document.getElementById('empForm').reset();
        document.getElementById('empId').value = '';
        
        let modal = new bootstrap.Modal(document.getElementById('empModal'));
        modal.show();
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-emp').forEach(btn => {
        btn.addEventListener('click', function() {
            let empId = parseInt(this.dataset.id);
            let emp = window.db.employees.find(e => e.id === empId);
            
            if (emp) {
                document.getElementById('empModalTitle').textContent = 'Edit Employee';
                document.getElementById('empId').value = emp.id;
                document.getElementById('empEmployeeId').value = emp.employeeId;
                document.getElementById('empEmail').value = emp.email;
                document.getElementById('empPosition').value = emp.position;
                document.getElementById('empDepartment').value = emp.departmentId;
                document.getElementById('empHireDate').value = emp.hireDate;
                
                let modal = new bootstrap.Modal(document.getElementById('empModal'));
                modal.show();
            }
        });
    });
    
    // Save button
    document.getElementById('saveEmpBtn')?.addEventListener('click', function() {
        let id = document.getElementById('empId').value;
        let employeeId = document.getElementById('empEmployeeId').value;
        let email = document.getElementById('empEmail').value;
        let position = document.getElementById('empPosition').value;
        let departmentId = parseInt(document.getElementById('empDepartment').value);
        let hireDate = document.getElementById('empHireDate').value;
        
        if (!employeeId || !email || !position || !departmentId || !hireDate) {
            showToast('Please fill all fields', 'warning');
            return;
        }
        
        if (id) {
            // Edit
            let emp = window.db.employees.find(e => e.id === parseInt(id));
            if (emp) {
                emp.employeeId = employeeId;
                emp.email = email;
                emp.position = position;
                emp.departmentId = departmentId;
                emp.hireDate = hireDate;
                showToast('Employee updated successfully', 'success');
            }
        } else {
            // Check if employee ID or email already exists
            if (window.db.employees.find(e => e.employeeId === employeeId)) {
                showToast('Employee ID already exists', 'danger');
                return;
            }
            
            // Add
            let newEmp = {
                id: window.db.employees.length + 1,
                employeeId: employeeId,
                email: email,
                position: position,
                departmentId: departmentId,
                hireDate: hireDate
            };
            window.db.employees.push(newEmp);
            showToast('Employee added successfully', 'success');
        }
        
        saveToStorage();
        bootstrap.Modal.getInstance(document.getElementById('empModal')).hide();
        setupEmployeesPage();
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-emp').forEach(btn => {
        btn.addEventListener('click', function() {
            let empId = parseInt(this.dataset.id);
            
            if (confirm('Are you sure you want to delete this employee record?')) {
                window.db.employees = window.db.employees.filter(e => e.id !== empId);
                saveToStorage();
                showToast('Employee deleted successfully', 'success');
                setupEmployeesPage();
            }
        });
    });
}

// ==================== USER REQUESTS ====================
function setupRequestsPage() {
    if (!currentUser) return;
    
    let requestsSection = document.getElementById('requests-page');
    
    // Filter requests for current user
    let userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
    
    requestsSection.innerHTML = `
        <h2 class="mb-4">My Requests</h2>
        <button class="btn btn-primary mb-4" id="newRequestBtn">+ New Request</button>
        
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Items</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${userRequests.length === 0 ? 
                        '<tr><td colspan="4" class="text-center">No requests found</td></tr>' :
                        userRequests.map(req => `
                            <tr>
                                <td>${req.date}</td>
                                <td>${req.type}</td>
                                <td>
                                    <ul class="list-unstyled mb-0">
                                        ${req.items.map(item => 
                                            `<li>${item.name} x${item.quantity}</li>`
                                        ).join('')}
                                    </ul>
                                </td>
                                <td>
                                    <span class="badge bg-${
                                        req.status === 'Approved' ? 'success' : 
                                        req.status === 'Rejected' ? 'danger' : 
                                        'warning'
                                    }">
                                        ${req.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')
                    }
                </tbody>
            </table>
        </div>
        
        <!-- New Request Modal -->
        <div class="modal fade" id="requestModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Request</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="requestForm">
                            <div class="mb-3">
                                <label for="requestType" class="form-label">Request Type</label>
                                <select class="form-control" id="requestType" required>
                                    <option value="Equipment">Equipment</option>
                                    <option value="Leave">Leave</option>
                                    <option value="Resources">Resources</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Items</label>
                                <div id="itemsContainer">
                                    <div class="item-row mb-2">
                                        <div class="row">
                                            <div class="col-5">
                                                <input type="text" class="form-control" placeholder="Item name" id="itemName0" required>
                                            </div>
                                            <div class="col-3">
                                                <input type="number" class="form-control" placeholder="Qty" id="itemQty0" min="1" required>
                                            </div>
                                            <div class="col-2">
                                                <button type="button" class="btn btn-danger remove-item" style="display: none;">×</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button type="button" class="btn btn-sm btn-secondary mt-2" id="addItemBtn">+ Add Item</button>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submitRequestBtn">Submit Request</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    setupRequestEventListeners();
}

function setupRequestEventListeners() {
    let itemCount = 1;
    
    // New request button
    document.getElementById('newRequestBtn')?.addEventListener('click', function() {
        // Reset form
        document.getElementById('requestForm').reset();
        document.getElementById('itemsContainer').innerHTML = `
            <div class="item-row mb-2">
                <div class="row">
                    <div class="col-5">
                        <input type="text" class="form-control" placeholder="Item name" id="itemName0" required>
                    </div>
                    <div class="col-3">
                        <input type="number" class="form-control" placeholder="Qty" id="itemQty0" min="1" required>
                    </div>
                    <div class="col-2">
                        <button type="button" class="btn btn-danger remove-item" style="display: none;">×</button>
                    </div>
                </div>
            </div>
        `;
        itemCount = 1;
        
        let modal = new bootstrap.Modal(document.getElementById('requestModal'));
        modal.show();
    });
    
    // Add item button
    document.getElementById('addItemBtn')?.addEventListener('click', function() {
        let container = document.getElementById('itemsContainer');
        let newRow = document.createElement('div');
        newRow.className = 'item-row mb-2';
        newRow.innerHTML = `
            <div class="row">
                <div class="col-5">
                    <input type="text" class="form-control" placeholder="Item name" id="itemName${itemCount}" required>
                </div>
                <div class="col-3">
                    <input type="number" class="form-control" placeholder="Qty" id="itemQty${itemCount}" min="1" required>
                </div>
                <div class="col-2">
                    <button type="button" class="btn btn-danger remove-item">×</button>
                </div>
            </div>
        `;
        container.appendChild(newRow);
        
        // Show remove buttons on all items except first
        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.style.display = 'block';
        });
        
        itemCount++;
    });
    
    // Remove item (event delegation)
    document.getElementById('itemsContainer')?.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item')) {
            e.target.closest('.item-row').remove();
            
            // If only one item left, hide its remove button
            if (document.querySelectorAll('.item-row').length === 1) {
                document.querySelector('.remove-item').style.display = 'none';
            }
        }
    });
    
    // Submit request
    document.getElementById('submitRequestBtn')?.addEventListener('click', function() {
        let type = document.getElementById('requestType').value;
        let items = [];
        let itemRows = document.querySelectorAll('.item-row');
        
        // Validate at least one item
        if (itemRows.length === 0) {
            showToast('Please add at least one item', 'warning');
            return;
        }
        
        // Collect items
        let valid = true;
        itemRows.forEach((row, index) => {
            let name = document.getElementById(`itemName${index}`).value;
            let qty = document.getElementById(`itemQty${index}`).value;
            
            if (!name || !qty) {
                valid = false;
                return;
            }
            
            items.push({
                name: name,
                quantity: parseInt(qty)
            });
        });
        
        if (!valid) {
            showToast('Please fill all item fields', 'warning');
            return;
        }
        
        // Create request
        let newRequest = {
            id: window.db.requests.length + 1,
            employeeEmail: currentUser.email,
            type: type,
            items: items,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0]
        };
        
        window.db.requests.push(newRequest);
        saveToStorage();
        
        // Close modal and refresh
        bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
        showToast('Request submitted successfully', 'success');
        setupRequestsPage(); // Refresh the page
    });
}

// ==================== UTILITIES ====================
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(toastContainer);
    }
    
    // Create toast
    let toastId = 'toast-' + Date.now();
    let toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialize and show toast
    let toastElement = document.getElementById(toastId);
    let toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();
    
    // Remove after hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        this.remove();
    });
}