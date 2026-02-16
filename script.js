// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    // Only add event listener if the button exists
    const getStartedBtn = document.getElementById("getStarted");
    if (getStartedBtn) {
        getStartedBtn.addEventListener("click", function () {
            // Check if user is logged in
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = "dashboard.html";
            } else {
                // Redirect to login if not logged in
                window.location.href = "login.html";
            }
        });
    }
});

let users = JSON.parse(localStorage.getItem('users')) || [];

function saveUsers(){
    localStorage.setItem('users', JSON.stringify(users));
}

function goToDashboard() {
    window.location.href = "dashboard.html";
}