let currentUser = null;

// =====================
// AUTH & REGISTER
// =====================

function setAuthState(isAuth, user = null) {
    currentUser = user;

    document.body.classList.remove("authenticated","not-authenticated","is-admin");

    const loggedOut = document.querySelector(".role-logged-out");
    const loggedIn = document.querySelector(".role-logged-in");
    const adminSection = document.querySelector(".role-admin");
    const navUsername = document.getElementById("navUsername");

    if (isAuth && user) {
        document.body.classList.add("authenticated");
        if (user.role === "admin") document.body.classList.add("is-admin");

        if (loggedOut) loggedOut.style.display = "none";
        if (loggedIn) loggedIn.style.display = "block";

        if (navUsername) navUsername.textContent = user.first + " " + user.last;

        if (adminSection) {
            adminSection.style.display = user.role === "admin" ? "block" : "none";
        }

    } else {
        document.body.classList.add("not-authenticated");
        if (loggedOut) loggedOut.style.display = "block";
        if (loggedIn) loggedIn.style.display = "none";
    }
}

function register() {
    const first = document.getElementById("firstName").value;
    const last = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (password.length < 6) return alert("Password must be at least 6 chars");

    if (window.db.accounts.find(a => a.email === email)) return alert("Email already exists");

    window.db.accounts.push({first,last,email,password,role:"user",verified:true});
    saveToStorage();

    localStorage.setItem("auth_token", email);
    const user = window.db.accounts.find(a => a.email === email);
    setAuthState(true, user);
    navigateTo("#/profile");
}

function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const user = window.db.accounts.find(a => a.email === email && a.password === password && a.verified);
    if (!user) return alert("Invalid credentials");

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

    document.getElementById("profileContent").innerHTML = `
        <p><strong>Name:</strong> ${currentUser.first} ${currentUser.last}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Role:</strong> ${currentUser.role}</p>
        <button class="btn-primary" onclick="alert('Edit not implemented')">Edit Profile</button>
    `;
}

// =====================
// ADMIN PAGES
// =====================

function renderAccountsList() {
    const div = document.getElementById("accountsList");
    div.innerHTML = window.db.accounts.map(u =>
        `<div class="item-card">
            <div class="item-info">
                <h4>${u.first} ${u.last}</h4>
                <p>${u.email} - ${u.role}</p>
            </div>
        </div>`).join("");
}

function renderDepartments() {
    const div = document.getElementById("departmentsList");
    div.innerHTML = window.db.departments.map(d =>
        `<div class="item-card">${d.name}</div>`).join("");
}

function renderEmployees() {
    const div = document.getElementById("employeesList");
    div.innerHTML = window.db.employees.map(e =>
        `<div class="item-card">${e.first} ${e.last}</div>`).join("");
}

// =====================
// REQUESTS
// =====================

function renderMyRequests() {
    if (!currentUser) return;
    const div = document.getElementById("myRequestsList");
    const myReqs = window.db.requests.filter(r => r.userEmail === currentUser.email);
    div.innerHTML = myReqs.length ? myReqs.map(r => `<div class="item-card">${r.title}</div>`).join("") : "<p>No requests yet.</p>";
}

// =====================
// USER DROPDOWN
// =====================

function toggleUserMenu() {
    const dropdown = document.getElementById("userDropdown");
    if (!dropdown) return;
    dropdown.classList.toggle("show");
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
    handleRouting();
});
