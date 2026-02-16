let users = JSON.parse(localStorage.getItem('users')) || [];

function saveUsers(){
    localStorage.setItem('users', JSON.stringify(users));
}

function register(){
    const first = document.getElementById('firstName').value;
    const last = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    // Validation
    if (!first || !last || !email || !pass) {
        alert('Please fill in all fields');
        return;
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        alert('User with this email already exists');
        return;
    }

    users.push({first, last, email, pass, verified: false});
    saveUsers();
    localStorage.setItem('pendingVerify', email);
    location.href = 'verify.html';
}

function simulateVerify(){
    const email = localStorage.getItem('pendingVerify');
    users = users.map(u => {
        if(u.email === email) u.verified = true;
        return u;
    });
    saveUsers();
    localStorage.setItem('verifiedSuccess','true');
    location.href = 'login.html';
}

function login(){
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    if (!email || !pass) {
        alert('Please fill in all fields');
        return;
    }

    const user = users.find(u => u.email === email && u.pass === pass);
    if(!user){ 
        alert('Invalid credentials'); 
        return; 
    }
    if(!user.verified){ 
        alert('Email not verified'); 
        return; 
    }

    localStorage.setItem('token','fake-jwt-token');
    localStorage.setItem('currentUser', JSON.stringify(user));
    alert('Login successful');
    window.location.href = 'dashboard.html';
}

// Show success message on login page if email was just verified
if(location.pathname.includes('login.html')){
    if(localStorage.getItem('verifiedSuccess')){
        document.getElementById('successBox').style.display='block';
        localStorage.removeItem('verifiedSuccess');
    }
}

// Show email on verify page
if(location.pathname.includes('verify.html')){
    const email = localStorage.getItem('pendingVerify');
    if(email) document.getElementById('verifyEmail').innerText = email;
}