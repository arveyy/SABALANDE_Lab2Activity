// Storage Key
const STORAGE_KEY = 'ipt_demo_v1';

// Global State
let currentUser = null;
let currentEditId = null;

// Database Structure
window.db = {
    accounts: [],
    departments: [],
    employees: [],
    requests: []
};

// ==================== Data Persistence ====================

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            window.db = JSON.parse(stored);
        } else {
            seedInitialData();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        seedInitialData();
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function seedInitialData() {
    window.db = {
        accounts: [
            {
                id: generateId(),
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'Admin',
                verified: true
            }
        ],
        departments: [
            {
                id: generateId(),
                name: 'Engineering',
                description: 'Software development team'
            },
            {
                id: generateId(),
                name: 'HR',
                description: 'Human Resources'
            }
        ],
        employees: [],
        requests: []
    };
    saveToStorage();
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== Routing ====================

function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash || '#/';
    const route = hash.substring(2) || 'home';
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Protected routes
    const protectedRoutes = ['profile', 'requests'];
    const adminRoutes = ['employees', 'departments', 'accounts'];
    
    // Check authentication for protected routes
    if (protectedRoutes.includes(route) && !currentUser) {
        navigateTo('#/login');
        return;
    }
    
    // Check admin access
    if (adminRoutes.includes(route) && (!currentUser || currentUser.role !== 'Admin')) {
        showToast('Access denied. Admin only.', 'error');
        navigateTo('#/');
        return;
    }
    
    // Show the matching page
    const pageMap = {
        'home': 'home-page',
        'register': 'register-page',
        'verify-email': 'verify-page',
        'login': 'login-page',
        'profile': 'profile-page',
        'employees': 'employees-page',
        'departments': 'departments-page',
        'accounts': 'accounts-page',
        'requests': 'requests-page'
    };
    
    const pageId = pageMap[route] || 'home-page';
    const pageElement = document.getElementById(pageId);
    
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Render page-specific content
        if (route === 'profile') renderProfile();
        if (route === 'employees') renderEmployees();
        if (route === 'departments') renderDepartments();
        if (route === 'accounts') renderAccounts();
        if (route === 'requests') renderRequests();
    }
}

// ==================== Authentication ====================

function setAuthState(isAuth, user = null) {
    currentUser = user;
    
    if (isAuth && user) {
        document.body.classList.remove('not-authenticated');
        document.body.classList.add('authenticated');
        
        if (user.role === 'Admin') {
            document.body.classList.add('is-admin');
        } else {
            document.body.classList.remove('is-admin');
        }
        
        // Update username in nav
        const navUsername = document.getElementById('navUsername');
        if (navUsername) {
            navUsername.textContent = `${user.firstName} ${user.lastName}`;
        }
        
        localStorage.setItem('auth_token', user.email);
    } else {
        document.body.classList.remove('authenticated');
        document.body.classList.add('not-authenticated');
        document.body.classList.remove('is-admin');
        localStorage.removeItem('auth_token');
    }
}

function checkAuthState() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        const user = window.db.accounts.find(acc => acc.email === token && acc.verified);
        if (user) {
            setAuthState(true, user);
        } else {
            setAuthState(false);
        }
    }
}

function logout() {
    setAuthState(false);
    navigateTo('#/');
    showToast('Logged out successfully', 'success');
}

// ==================== Registration ====================

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    
    // Check if email exists
    const existing = window.db.accounts.find(acc => acc.email === email);
    if (existing) {
        showToast('Email already registered', 'error');
        return;
    }
    
    // Validate password
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Create new account
    const newAccount = {
        id: generateId(),
        firstName,
        lastName,
        email,
        password,
        role: 'User',
        verified: false
    };
    
    window.db.accounts.push(newAccount);
    saveToStorage();
    
    // Store email for verification
    localStorage.setItem('unverified_email', email);
    
    showToast('Account created! Please verify your email.', 'success');
    navigateTo('#/verify-email');
});

// ==================== Email Verification ====================

function renderVerifyPage() {
    const email = localStorage.getItem('unverified_email');
    if (email) {
        document.getElementById('verifyEmail').textContent = email;
    }
}

document.getElementById('simulateVerifyBtn').addEventListener('click', function() {
    const email = localStorage.getItem('unverified_email');
    if (!email) {
        showToast('No pending verification', 'error');
        return;
    }
    
    const account = window.db.accounts.find(acc => acc.email === email);
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        
        showToast('Email verified successfully!', 'success');
        
        // Show success message on login page
        setTimeout(() => {
            document.getElementById('loginSuccessMsg').style.display = 'flex';
        }, 100);
        
        navigateTo('#/login');
    }
});

// ==================== Login ====================

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    const account = window.db.accounts.find(
        acc => acc.email === email && acc.password === password && acc.verified
    );
    
    if (account) {
        setAuthState(true, account);
        showToast(`Welcome back, ${account.firstName}!`, 'success');
        navigateTo('#/profile');
    } else {
        showToast('Invalid credentials or email not verified', 'error');
    }
});

// ==================== Profile ====================

function renderProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profileEmail').textContent = currentUser.email;
    
    const roleSpan = document.getElementById('profileRole');
    roleSpan.textContent = currentUser.role;
    roleSpan.className = 'badge ' + (currentUser.role === 'Admin' ? 'badge-admin' : 'badge-user');
}

// ==================== Accounts Management ====================

function renderAccounts() {
    const tbody = document.getElementById('accountsTableBody');
    tbody.innerHTML = '';
    
    window.db.accounts.forEach(account => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${account.firstName} ${account.lastName}</td>
            <td>${account.email}</td>
            <td><span class="badge ${account.role === 'Admin' ? 'badge-admin' : 'badge-user'}">${account.role}</span></td>
            <td>${account.verified ? '<i class="fas fa-check-circle" style="color: #28a745;"></i>' : '<i class="fas fa-times-circle" style="color: #dc3545;"></i>'}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="editAccount('${account.id}')" data-testid="edit-account-btn-${account.id}">Edit</button>
                <button class="btn btn-warning btn-sm" onclick="resetPassword('${account.id}')" data-testid="reset-password-btn-${account.id}">Reset Password</button>
                <button class="btn btn-danger btn-sm" onclick="deleteAccount('${account.id}')" data-testid="delete-account-btn-${account.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openAccountModal(accountId = null) {
    const modal = document.getElementById('accountModal');
    const form = document.getElementById('accountForm');
    const title = document.getElementById('accountModalTitle');
    
    form.reset();
    currentEditId = accountId;
    
    if (accountId) {
        const account = window.db.accounts.find(a => a.id === accountId);
        if (account) {
            title.textContent = 'Edit Account';
            document.getElementById('accFirstName').value = account.firstName;
            document.getElementById('accLastName').value = account.lastName;
            document.getElementById('accEmail').value = account.email;
            document.getElementById('accRole').value = account.role;
            document.getElementById('accVerified').checked = account.verified;
            document.getElementById('accPassword').removeAttribute('required');
        }
    } else {
        title.textContent = 'Add Account';
        document.getElementById('accPassword').setAttribute('required', 'required');
    }
    
    modal.classList.add('active');
}

function closeAccountModal() {
    document.getElementById('accountModal').classList.remove('active');
    currentEditId = null;
}

function editAccount(id) {
    openAccountModal(id);
}

function resetPassword(id) {
    if (id === currentUser.id) {
        showToast('Cannot reset your own password', 'error');
        return;
    }
    
    const newPassword = prompt('Enter new password (minimum 6 characters):');
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    const account = window.db.accounts.find(a => a.id === id);
    if (account) {
        account.password = newPassword;
        saveToStorage();
        showToast('Password reset successfully', 'success');
    }
}

function deleteAccount(id) {
    if (id === currentUser.id) {
        showToast('Cannot delete your own account', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this account?')) {
        window.db.accounts = window.db.accounts.filter(a => a.id !== id);
        saveToStorage();
        renderAccounts();
        showToast('Account deleted', 'success');
    }
}

document.getElementById('addAccountBtn').addEventListener('click', () => openAccountModal());

document.getElementById('accountForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('accFirstName').value.trim();
    const lastName = document.getElementById('accLastName').value.trim();
    const email = document.getElementById('accEmail').value.trim().toLowerCase();
    const password = document.getElementById('accPassword').value;
    const role = document.getElementById('accRole').value;
    const verified = document.getElementById('accVerified').checked;
    
    if (currentEditId) {
        // Edit existing
        const account = window.db.accounts.find(a => a.id === currentEditId);
        if (account) {
            // Check email uniqueness
            const emailExists = window.db.accounts.find(
                a => a.email === email && a.id !== currentEditId
            );
            if (emailExists) {
                showToast('Email already exists', 'error');
                return;
            }
            
            account.firstName = firstName;
            account.lastName = lastName;
            account.email = email;
            if (password) account.password = password;
            account.role = role;
            account.verified = verified;
            
            showToast('Account updated', 'success');
        }
    } else {
        // Create new
        if (!password || password.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        // Check email uniqueness
        const emailExists = window.db.accounts.find(a => a.email === email);
        if (emailExists) {
            showToast('Email already exists', 'error');
            return;
        }
        
        window.db.accounts.push({
            id: generateId(),
            firstName,
            lastName,
            email,
            password,
            role,
            verified
        });
        
        showToast('Account created', 'success');
    }
    
    saveToStorage();
    closeAccountModal();
    renderAccounts();
});

// Modal close buttons
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// ==================== Departments Management ====================

function renderDepartments() {
    const tbody = document.getElementById('departmentsTableBody');
    tbody.innerHTML = '';
    
    window.db.departments.forEach(dept => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.description || ''}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="editDepartment('${dept.id}')" data-testid="edit-dept-btn-${dept.id}">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteDepartment('${dept.id}')" data-testid="delete-dept-btn-${dept.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openDeptModal(deptId = null) {
    const modal = document.getElementById('deptModal');
    const form = document.getElementById('deptForm');
    const title = document.getElementById('deptModalTitle');
    
    form.reset();
    currentEditId = deptId;
    
    if (deptId) {
        const dept = window.db.departments.find(d => d.id === deptId);
        if (dept) {
            title.textContent = 'Edit Department';
            document.getElementById('deptName').value = dept.name;
            document.getElementById('deptDesc').value = dept.description || '';
        }
    } else {
        title.textContent = 'Add Department';
    }
    
    modal.classList.add('active');
}

function closeDeptModal() {
    document.getElementById('deptModal').classList.remove('active');
    currentEditId = null;
}

function editDepartment(id) {
    openDeptModal(id);
}

function deleteDepartment(id) {
    // Check if any employees are in this department
    const hasEmployees = window.db.employees.some(e => e.departmentId === id);
    if (hasEmployees) {
        showToast('Cannot delete department with employees', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this department?')) {
        window.db.departments = window.db.departments.filter(d => d.id !== id);
        saveToStorage();
        renderDepartments();
        showToast('Department deleted', 'success');
    }
}

document.getElementById('addDeptBtn').addEventListener('click', () => openDeptModal());

document.getElementById('deptForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('deptName').value.trim();
    const description = document.getElementById('deptDesc').value.trim();
    
    if (currentEditId) {
        const dept = window.db.departments.find(d => d.id === currentEditId);
        if (dept) {
            dept.name = name;
            dept.description = description;
            showToast('Department updated', 'success');
        }
    } else {
        window.db.departments.push({
            id: generateId(),
            name,
            description
        });
        showToast('Department created', 'success');
    }
    
    saveToStorage();
    closeDeptModal();
    renderDepartments();
});

// ==================== Employees Management ====================

function renderEmployees() {
    const tbody = document.getElementById('employeesTableBody');
    tbody.innerHTML = '';
    
    if (window.db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No employees.</td></tr>';
        return;
    }
    
    window.db.employees.forEach(emp => {
        const user = window.db.accounts.find(a => a.id === emp.userId);
        const dept = window.db.departments.find(d => d.id === emp.departmentId);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${emp.employeeId}</td>
            <td>${user ? `${user.firstName} ${user.lastName}` : 'Unknown'}<br><small>${emp.email}</small></td>
            <td>${emp.position}</td>
            <td>${dept ? dept.name : 'Unknown'}</td>
            <td>${emp.hireDate}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="editEmployee('${emp.id}')" data-testid="edit-emp-btn-${emp.id}">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteEmployee('${emp.id}')" data-testid="delete-emp-btn-${emp.id}">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateDeptDropdown() {
    const select = document.getElementById('empDept');
    select.innerHTML = '<option value="">Select Department</option>';
    
    window.db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        select.appendChild(option);
    });
}

function openEmployeeModal(empId = null) {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const title = document.getElementById('employeeModalTitle');
    
    form.reset();
    currentEditId = empId;
    populateDeptDropdown();
    
    if (empId) {
        const emp = window.db.employees.find(e => e.id === empId);
        if (emp) {
            title.textContent = 'Edit Employee';
            document.getElementById('empId').value = emp.employeeId;
            document.getElementById('empEmail').value = emp.email;
            document.getElementById('empPosition').value = emp.position;
            document.getElementById('empDept').value = emp.departmentId;
            document.getElementById('empHireDate').value = emp.hireDate;
        }
    } else {
        title.textContent = 'Add Employee';
    }
    
    modal.classList.add('active');
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').classList.remove('active');
    currentEditId = null;
}

function editEmployee(id) {
    openEmployeeModal(id);
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        window.db.employees = window.db.employees.filter(e => e.id !== id);
        saveToStorage();
        renderEmployees();
        showToast('Employee deleted', 'success');
    }
}

document.getElementById('addEmployeeBtn').addEventListener('click', () => openEmployeeModal());

document.getElementById('employeeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('empId').value.trim();
    const email = document.getElementById('empEmail').value.trim().toLowerCase();
    const position = document.getElementById('empPosition').value.trim();
    const departmentId = document.getElementById('empDept').value;
    const hireDate = document.getElementById('empHireDate').value;
    
    // Validate email exists in accounts
    const user = window.db.accounts.find(a => a.email === email);
    if (!user) {
        showToast('User email not found in accounts', 'error');
        return;
    }
    
    if (currentEditId) {
        const emp = window.db.employees.find(e => e.id === currentEditId);
        if (emp) {
            emp.employeeId = employeeId;
            emp.email = email;
            emp.userId = user.id;
            emp.position = position;
            emp.departmentId = departmentId;
            emp.hireDate = hireDate;
            showToast('Employee updated', 'success');
        }
    } else {
        window.db.employees.push({
            id: generateId(),
            employeeId,
            email,
            userId: user.id,
            position,
            departmentId,
            hireDate
        });
        showToast('Employee added', 'success');
    }
    
    saveToStorage();
    closeEmployeeModal();
    renderEmployees();
});

// ==================== Requests Management ====================

function renderRequests() {
    const tbody = document.getElementById('requestsTableBody');
    tbody.innerHTML = '';
    
    const userRequests = window.db.requests.filter(r => r.employeeEmail === currentUser.email);
    
    if (userRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">You have no requests yet.</td></tr>';
        return;
    }
    
    userRequests.forEach(req => {
        const tr = document.createElement('tr');
        const statusClass = req.status === 'Approved' ? 'badge-success' : 
                           req.status === 'Rejected' ? 'badge-danger' : 'badge-warning';
        
        const itemsList = req.items.map(item => `${item.name} (${item.qty})`).join(', ');
        
        tr.innerHTML = `
            <td>${req.date}</td>
            <td>${req.type}</td>
            <td>${itemsList}</td>
            <td><span class="badge ${statusClass}">${req.status}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function openRequestModal() {
    const modal = document.getElementById('requestModal');
    const form = document.getElementById('requestForm');
    const itemsContainer = document.getElementById('requestItems');
    
    form.reset();
    itemsContainer.innerHTML = `
        <div class="request-item">
            <input type="text" class="form-control item-name" placeholder="Item name" required data-testid="request-item-name-0">
            <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required data-testid="request-item-qty-0">
            <button type="button" class="btn btn-icon btn-success add-item-btn" data-testid="add-item-btn">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Setup add/remove item buttons
    setupRequestItemButtons();
}

function closeRequestModal() {
    document.getElementById('requestModal').classList.remove('active');
}

function setupRequestItemButtons() {
    const container = document.getElementById('requestItems');
    
    // Remove old listeners by cloning
    container.querySelectorAll('.add-item-btn, .remove-item-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });
    
    // Add item button
    container.querySelectorAll('.add-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const items = container.querySelectorAll('.request-item');
            const newIndex = items.length;
            
            const newItem = document.createElement('div');
            newItem.className = 'request-item';
            newItem.innerHTML = `
                <input type="text" class="form-control item-name" placeholder="Item name" required data-testid="request-item-name-${newIndex}">
                <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required data-testid="request-item-qty-${newIndex}">
                <button type="button" class="btn btn-icon btn-danger remove-item-btn" data-testid="remove-item-btn-${newIndex}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            container.appendChild(newItem);
            setupRequestItemButtons();
        });
    });
    
    // Remove item button
    container.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (container.querySelectorAll('.request-item').length > 1) {
                this.closest('.request-item').remove();
            } else {
                showToast('Must have at least one item', 'error');
            }
        });
    });
}

document.getElementById('newRequestBtn').addEventListener('click', () => openRequestModal());

document.getElementById('requestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = document.getElementById('reqType').value;
    const itemElements = document.querySelectorAll('.request-item');
    
    const items = [];
    itemElements.forEach(item => {
        const name = item.querySelector('.item-name').value.trim();
        const qty = parseInt(item.querySelector('.item-qty').value);
        if (name && qty > 0) {
            items.push({ name, qty });
        }
    });
    
    if (items.length === 0) {
        showToast('Please add at least one item', 'error');
        return;
    }
    
    const newRequest = {
        id: generateId(),
        type,
        items,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        employeeEmail: currentUser.email
    };
    
    window.db.requests.push(newRequest);
    saveToStorage();
    
    closeRequestModal();
    renderRequests();
    showToast('Request submitted successfully', 'success');
});

// ==================== Toast Notifications ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== Initialization ====================

function init() {
    loadFromStorage();
    checkAuthState();
    
    // Set initial hash if empty
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    
    // Handle routing
    handleRouting();
    
    // Render verify page if on that route
    if (window.location.hash === '#/verify-email') {
        renderVerifyPage();
    }
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
    
    // Hash change listener
    window.addEventListener('hashchange', handleRouting);
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}