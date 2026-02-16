// Check authentication on dashboard load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please log in first');
        window.location.href = 'login.html';
        return;
    }

    // Display user welcome message
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('userWelcome').textContent = `Welcome, ${currentUser.first}!`;
    }

    // Load initial data
    loadEmployees();
    loadDepartments();
    loadRequests();
});

// Data storage
let employees = JSON.parse(localStorage.getItem('employees')) || [];
let departments = JSON.parse(localStorage.getItem('departments')) || [];
let requests = JSON.parse(localStorage.getItem('requests')) || [];

function saveData() {
    localStorage.setItem('employees', JSON.stringify(employees));
    localStorage.setItem('departments', JSON.stringify(departments));
    localStorage.setItem('requests', JSON.stringify(requests));
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function showSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Show selected section
    document.getElementById(section + 'Section').style.display = 'block';
}

function showAddForm(type) {
    document.getElementById('add' + capitalize(type) + 'Form').style.display = 'block';
}

function hideAddForm(type) {
    document.getElementById('add' + capitalize(type) + 'Form').style.display = 'none';
    // Clear form fields
    const form = document.getElementById('add' + capitalize(type) + 'Form');
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => input.value = '');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Employee functions
function addEmployee() {
    const name = document.getElementById('empName').value;
    const position = document.getElementById('empPosition').value;
    const department = document.getElementById('empDepartment').value;

    if (!name || !position || !department) {
        alert('Please fill in all fields');
        return;
    }

    const employee = {
        id: Date.now(),
        name,
        position,
        department
    };

    employees.push(employee);
    saveData();
    loadEmployees();
    hideAddForm('employee');
}

function loadEmployees() {
    const container = document.getElementById('employeesList');
    container.innerHTML = '';

    employees.forEach(emp => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info">
                <h4>${emp.name}</h4>
                <p>${emp.position} - ${emp.department}</p>
            </div>
            <div class="item-actions">
                <button class="btn-danger" onclick="deleteEmployee(${emp.id})">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        employees = employees.filter(emp => emp.id !== id);
        saveData();
        loadEmployees();
    }
}

// Department functions
function addDepartment() {
    const name = document.getElementById('deptName').value;
    const manager = document.getElementById('deptManager').value;

    if (!name || !manager) {
        alert('Please fill in all fields');
        return;
    }

    const department = {
        id: Date.now(),
        name,
        manager
    };

    departments.push(department);
    saveData();
    loadDepartments();
    hideAddForm('department');
}

function loadDepartments() {
    const container = document.getElementById('departmentsList');
    container.innerHTML = '';

    departments.forEach(dept => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info">
                <h4>${dept.name}</h4>
                <p>Manager: ${dept.manager}</p>
            </div>
            <div class="item-actions">
                <button class="btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function deleteDepartment(id) {
    if (confirm('Are you sure you want to delete this department?')) {
        departments = departments.filter(dept => dept.id !== id);
        saveData();
        loadDepartments();
    }
}

// Request functions
function addRequest() {
    const title = document.getElementById('reqTitle').value;
    const description = document.getElementById('reqDescription').value;
    const priority = document.getElementById('reqPriority').value;

    if (!title || !description) {
        alert('Please fill in all fields');
        return;
    }

    const request = {
        id: Date.now(),
        title,
        description,
        priority,
        status: 'Pending',
        date: new Date().toLocaleDateString()
    };

    requests.push(request);
    saveData();
    loadRequests();
    hideAddForm('request');
}

function loadRequests() {
    const container = document.getElementById('requestsList');
    container.innerHTML = '';

    requests.forEach(req => {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.innerHTML = `
            <div class="item-info">
                <h4>${req.title}</h4>
                <p>${req.description}</p>
                <p><strong>Priority:</strong> ${req.priority} | <strong>Status:</strong> ${req.status} | <strong>Date:</strong> ${req.date}</p>
            </div>
            <div class="item-actions">
                <button class="btn-primary" onclick="toggleRequestStatus(${req.id})">${req.status === 'Pending' ? 'Complete' : 'Reopen'}</button>
                <button class="btn-danger" onclick="deleteRequest(${req.id})">Delete</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function toggleRequestStatus(id) {
    const request = requests.find(req => req.id === id);
    if (request) {
        request.status = request.status === 'Pending' ? 'Completed' : 'Pending';
        saveData();
        loadRequests();
    }
}

function deleteRequest(id) {
    if (confirm('Are you sure you want to delete this request?')) {
        requests = requests.filter(req => req.id !== id);
        saveData();
        loadRequests();
    }
}