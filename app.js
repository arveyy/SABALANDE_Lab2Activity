let currentUser = null;

// =====================
// AUTH
// =====================

function setAuthState(isAuth, user = null) {
    currentUser = user;
    document.body.classList.remove("authenticated", "not-authenticated", "is-admin");

    const loggedOut = document.querySelector(".role-logged-out");
    const loggedIn  = document.querySelector(".role-logged-in");
    const navUsername = document.getElementById("navUsername");

    if (isAuth && user) {
        document.body.classList.add("authenticated");
        if (user.role === "admin") document.body.classList.add("is-admin");
        if (loggedOut) loggedOut.style.display = "none";
        if (loggedIn)  loggedIn.style.display  = "block";
        if (navUsername) navUsername.textContent = user.first + " " + user.last;
    } else {
        document.body.classList.add("not-authenticated");
        if (loggedOut) loggedOut.style.display = "block";
        if (loggedIn)  loggedIn.style.display  = "none";
    }
}

// =====================
// REGISTER
// =====================

function register() {
    const first    = document.getElementById("firstName").value;
    const last     = document.getElementById("lastName").value;
    const email    = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (password.length < 6) return alert("Password must be at least 6 chars");
    if (window.db.accounts.find(a => a.email === email)) return alert("Email already exists");

    window.db.accounts.push({ first, last, email, password, role: "user", verified: false });
    saveToStorage();
    localStorage.setItem("pending_verification", email);
    navigateTo("#/verify");
}

// =====================
// SIMULATE VERIFICATION
// =====================

function simulateVerification() {
    const email = localStorage.getItem("pending_verification");
    if (!email) return;
    const user = window.db.accounts.find(a => a.email === email);
    if (!user) return;
    user.verified = true;
    saveToStorage();
    localStorage.removeItem("pending_verification");
    localStorage.setItem("verification_success", "true");
    navigateTo("#/login");
}

// =====================
// LOGIN
// =====================

function login() {
    const email    = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const user     = window.db.accounts.find(a => a.email === email && a.password === password);

    if (!user) return alert("Invalid credentials");
    if (!user.verified) return alert("Please verify your email first");

    localStorage.setItem("auth_token", email);
    setAuthState(true, user);
    navigateTo("#/profile");
}

function logout() {
    localStorage.removeItem("auth_token");
    setAuthState(false);
    navigateTo("#/");
}

// =====================
// PROFILE
// =====================

function renderProfile() {
    if (!currentUser) return;
    const roleName = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
    document.getElementById("profileContent").innerHTML = `
        <div class="profile-card">
            <p class="profile-name">${currentUser.first} ${currentUser.last}</p>
            <p><strong>Email:</strong> ${currentUser.email}</p>
            <p><strong>Role:</strong> ${roleName}</p>
            <button class="btn-edit-profile" onclick="openEditProfileModal()">Edit Profile</button>
        </div>
    `;
}

// =====================
// EDIT PROFILE MODAL
// =====================

function openEditProfileModal() {
    document.getElementById("editFirstName").value = currentUser.first;
    document.getElementById("editLastName").value  = currentUser.last;
    document.getElementById("editEmail").value     = currentUser.email;
    document.getElementById("editProfileModal").style.display = "flex";
}

function closeEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "none";
}

function saveProfile() {
    const first = document.getElementById("editFirstName").value.trim();
    const last  = document.getElementById("editLastName").value.trim();
    const email = document.getElementById("editEmail").value.trim();

    if (!first || !last || !email) return alert("All fields are required.");
    if (email !== currentUser.email && window.db.accounts.find(a => a.email === email))
        return alert("That email is already in use.");

    const account = window.db.accounts.find(a => a.email === currentUser.email);
    if (account) { account.first = first; account.last = last; account.email = email; }
    if (email !== currentUser.email) localStorage.setItem("auth_token", email);
    currentUser.first = first; currentUser.last = last; currentUser.email = email;
    saveToStorage();

    const nav = document.getElementById("navUsername");
    if (nav) nav.textContent = first + " " + last;
    closeEditProfileModal();
    renderProfile();
}

// =====================
// DROPDOWN
// =====================

function toggleUserMenu() {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) dropdown.classList.toggle("show");
}

document.addEventListener("click", function(e) {
    const menu = document.querySelector(".user-menu");
    const dropdown = document.getElementById("userDropdown");
    if (dropdown && menu && !menu.contains(e.target)) {
        dropdown.classList.remove("show");
    }
});

// =====================
// EMPLOYEES
// =====================

let editingEmployeeId = null;

function renderEmployees() {
    const tbody = document.getElementById("employeeTableBody");
    if (!window.db.employees || window.db.employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No employees.</td></tr>`;
        return;
    }
    tbody.innerHTML = window.db.employees.map(emp => `
        <tr>
            <td>${emp.empId}</td>
            <td>${emp.name}</td>
            <td>${emp.position}</td>
            <td>${emp.dept}</td>
            <td>
                <button class="btn-tbl-edit" onclick="editEmployee(${emp.id})">Edit</button>
                <button class="btn-tbl-delete" onclick="deleteEmployee(${emp.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function showEmployeeForm() {
    editingEmployeeId = null;
    document.getElementById("empId").value       = "";
    document.getElementById("empEmail").value    = "";
    document.getElementById("empPosition").value = "";
    document.getElementById("empHireDate").value = "";
    populateDeptDropdown("empDept");
    document.getElementById("employeeForm").style.display = "block";
}

function cancelEmployeeForm() {
    document.getElementById("employeeForm").style.display = "none";
    editingEmployeeId = null;
}

function populateDeptDropdown(selectId) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    sel.innerHTML = window.db.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join("");
}

function saveEmployee() {
    const empId    = document.getElementById("empId").value.trim();
    const email    = document.getElementById("empEmail").value.trim();
    const position = document.getElementById("empPosition").value.trim();
    const dept     = document.getElementById("empDept").value;
    const hireDate = document.getElementById("empHireDate").value;

    if (!empId || !email || !position) return alert("Employee ID, Email and Position are required.");

    const account = window.db.accounts.find(a => a.email === email);
    const name    = account ? account.first + " " + account.last : email;

    if (editingEmployeeId !== null) {
        const idx = window.db.employees.findIndex(e => e.id === editingEmployeeId);
        if (idx !== -1) window.db.employees[idx] = { id: editingEmployeeId, empId, email, name, position, dept, hireDate };
    } else {
        window.db.employees.push({ id: Date.now(), empId, email, name, position, dept, hireDate });
    }

    saveToStorage();
    cancelEmployeeForm();
    renderEmployees();
}

function editEmployee(id) {
    const emp = window.db.employees.find(e => e.id === id);
    if (!emp) return;
    editingEmployeeId = id;
    document.getElementById("empId").value       = emp.empId;
    document.getElementById("empEmail").value    = emp.email;
    document.getElementById("empPosition").value = emp.position;
    document.getElementById("empHireDate").value = emp.hireDate;
    populateDeptDropdown("empDept");
    document.getElementById("empDept").value = emp.dept;
    document.getElementById("employeeForm").style.display = "block";
}

function deleteEmployee(id) {
    if (!confirm("Delete this employee?")) return;
    window.db.employees = window.db.employees.filter(e => e.id !== id);
    saveToStorage();
    renderEmployees();
}

// =====================
// DEPARTMENTS
// =====================

let editingDeptId = null;

function renderDepartments() {
    const tbody = document.getElementById("deptTableBody");
    if (!window.db.departments || window.db.departments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="table-empty">No departments.</td></tr>`;
        return;
    }
    tbody.innerHTML = window.db.departments.map(d => `
        <tr>
            <td>${d.name}</td>
            <td>${d.description || ""}</td>
            <td>
                <button class="btn-tbl-edit" onclick="editDept(${d.id})">Edit</button>
                <button class="btn-tbl-delete" onclick="deleteDept(${d.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function showDeptForm() {
    editingDeptId = null;
    document.getElementById("deptName").value = "";
    document.getElementById("deptDesc").value = "";
    document.getElementById("deptForm").style.display = "block";
}

function cancelDeptForm() {
    document.getElementById("deptForm").style.display = "none";
    editingDeptId = null;
}

function saveDepartment() {
    const name = document.getElementById("deptName").value.trim();
    const desc = document.getElementById("deptDesc").value.trim();
    if (!name) return alert("Department name is required.");

    if (editingDeptId !== null) {
        const dept = window.db.departments.find(d => d.id === editingDeptId);
        if (dept) { dept.name = name; dept.description = desc; }
    } else {
        window.db.departments.push({ id: Date.now(), name, description: desc });
    }

    saveToStorage();
    cancelDeptForm();
    renderDepartments();
}

function editDept(id) {
    const dept = window.db.departments.find(d => d.id === id);
    if (!dept) return;
    editingDeptId = id;
    document.getElementById("deptName").value = dept.name;
    document.getElementById("deptDesc").value = dept.description || "";
    document.getElementById("deptForm").style.display = "block";
}

function deleteDept(id) {
    if (!confirm("Delete this department?")) return;
    window.db.departments = window.db.departments.filter(d => d.id !== id);
    saveToStorage();
    renderDepartments();
}

// =====================
// ACCOUNTS
// =====================

let editingAccountEmail = null;

function renderAccountsList() {
    const tbody = document.getElementById("accountTableBody");
    tbody.innerHTML = window.db.accounts.map(acc => `
        <tr>
            <td>${acc.first} ${acc.last}</td>
            <td>${acc.email}</td>
            <td>${acc.role.charAt(0).toUpperCase() + acc.role.slice(1)}</td>
            <td style="text-align:center;">${acc.verified ? "✔" : ""}</td>
            <td>
                <button class="btn-tbl-edit" onclick="editAccount('${acc.email}')">Edit</button>
                <button class="btn-tbl-reset" onclick="resetPassword('${acc.email}')">Reset Password</button>
                <button class="btn-tbl-delete" onclick="deleteAccount('${acc.email}')">Delete</button>
            </td>
        </tr>
    `).join("");
}

function showAccountForm() {
    editingAccountEmail = null;
    document.getElementById("accFirst").value    = "";
    document.getElementById("accLast").value     = "";
    document.getElementById("accEmail").value    = "";
    document.getElementById("accPassword").value = "";
    document.getElementById("accRole").value     = "user";
    document.getElementById("accVerified").checked = false;
    document.getElementById("accountForm").style.display = "block";
}

function cancelAccountForm() {
    document.getElementById("accountForm").style.display = "none";
    editingAccountEmail = null;
}

function saveAccount() {
    const first    = document.getElementById("accFirst").value.trim();
    const last     = document.getElementById("accLast").value.trim();
    const email    = document.getElementById("accEmail").value.trim();
    const password = document.getElementById("accPassword").value.trim();
    const role     = document.getElementById("accRole").value;
    const verified = document.getElementById("accVerified").checked;

    if (!first || !last || !email) return alert("First name, last name and email are required.");
    if (!editingAccountEmail && !password) return alert("Password is required for new accounts.");

    if (editingAccountEmail) {
        const acc = window.db.accounts.find(a => a.email === editingAccountEmail);
        if (acc) {
            acc.first = first; acc.last = last; acc.email = email;
            acc.role = role; acc.verified = verified;
            if (password) acc.password = password;
        }
    } else {
        if (window.db.accounts.find(a => a.email === email)) return alert("Email already exists.");
        window.db.accounts.push({ first, last, email, password, role, verified });
    }

    saveToStorage();
    cancelAccountForm();
    renderAccountsList();
}

function editAccount(email) {
    const acc = window.db.accounts.find(a => a.email === email);
    if (!acc) return;
    editingAccountEmail = email;
    document.getElementById("accFirst").value    = acc.first;
    document.getElementById("accLast").value     = acc.last;
    document.getElementById("accEmail").value    = acc.email;
    document.getElementById("accPassword").value = "";
    document.getElementById("accRole").value     = acc.role;
    document.getElementById("accVerified").checked = acc.verified;
    document.getElementById("accountForm").style.display = "block";
}

function resetPassword(email) {
    const newPass = prompt("Enter new password for " + email + ":");
    if (!newPass || newPass.length < 6) return alert("Password must be at least 6 chars.");
    const acc = window.db.accounts.find(a => a.email === email);
    if (acc) { acc.password = newPass; saveToStorage(); alert("Password reset successfully."); }
}

function deleteAccount(email) {
    if (email === currentUser.email) return alert("You cannot delete your own account.");
    if (!confirm("Delete account " + email + "?")) return;
    window.db.accounts = window.db.accounts.filter(a => a.email !== email);
    saveToStorage();
    renderAccountsList();
}

// =====================
// MY REQUESTS
// =====================

function renderMyRequests() {
    if (!currentUser) return;
    const myRequests = (window.db.requests || []).filter(r => r.ownerEmail === currentUser.email);
    const container  = document.getElementById("myRequestsList");

    if (myRequests.length === 0) {
        container.innerHTML = `
            <p style="color:#374151; margin-bottom:14px;">You have no requests yet.</p>
            <button class="btn-success" onclick="openNewRequestModal()">Create One</button>
        `;
        return;
    }

    container.innerHTML = myRequests.map(r => `
        <div class="item-card">
            <div class="item-info">
                <h4>${r.type}</h4>
                <p>${r.items.length} item(s) &mdash; <em>${r.status}</em></p>
            </div>
        </div>
    `).join("");
}

// =====================
// NEW REQUEST MODAL
// =====================

let requestItems = [];

function openNewRequestModal() {
    requestItems = [{ name: "", qty: 1 }];
    document.getElementById("requestType").value = "";
    renderRequestItems();
    document.getElementById("newRequestModal").style.display = "flex";
}

function closeNewRequestModal() {
    document.getElementById("newRequestModal").style.display = "none";
    requestItems = [];
}

function renderRequestItems() {
    const container = document.getElementById("requestItemsList");
    container.innerHTML = requestItems.map((item, i) => `
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
            <input
                type="text"
                class="input"
                style="flex:1; margin-bottom:0;"
                placeholder="Item name"
                value="${item.name}"
                oninput="requestItems[${i}].name = this.value"
            >
            <input
                type="number"
                class="input"
                style="width:60px; margin-bottom:0; text-align:center;"
                min="1"
                value="${item.qty}"
                oninput="requestItems[${i}].qty = parseInt(this.value) || 1"
            >
            <button
                onclick="${i === 0 ? 'addRequestItem()' : 'removeRequestItem(' + i + ')'}"
                class="${i === 0 ? 'req-btn-add' : 'req-btn-remove'}"
            >${i === 0 ? '+' : '✕'}</button>
        </div>
    `).join("");
}

function addRequestItem() {
    requestItems.push({ name: "", qty: 1 });
    renderRequestItems();
}

function removeRequestItem(index) {
    requestItems.splice(index, 1);
    renderRequestItems();
}

function submitRequest() {
    const type = document.getElementById("requestType").value.trim();
    if (!type) return alert("Please enter a request type.");
    const validItems = requestItems.filter(i => i.name.trim() !== "");
    if (validItems.length === 0) return alert("Add at least one item.");

    if (!window.db.requests) window.db.requests = [];
    window.db.requests.push({
        id: Date.now(),
        ownerEmail: currentUser.email,
        type,
        items: validItems,
        status: "pending"
    });

    saveToStorage();
    closeNewRequestModal();
    renderMyRequests();
}

// =====================
// INIT
// =====================

window.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        const user = window.db.accounts.find(a => a.email === token);
        if (user) setAuthState(true, user);
    }

    const success = localStorage.getItem("verification_success");
    if (success) {
        const msg = document.getElementById("verificationSuccess");
        if (msg) msg.style.display = "block";
        localStorage.removeItem("verification_success");
    }

    const pendingEmail = localStorage.getItem("pending_verification");
    if (pendingEmail) {
        const span = document.getElementById("verifyEmailText");
        if (span) span.textContent = pendingEmail;
    }

    handleRouting();
});