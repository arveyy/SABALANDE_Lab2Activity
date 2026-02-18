function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    let hash = window.location.hash || "#/";
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

    const route = hash.replace("#/", "");

    const protectedRoutes = [
        "profile",
        "my-requests",
        "employees",
        "accounts",
        "departments"
    ];

    if (protectedRoutes.includes(route) && !currentUser)
        return navigateTo("#/login");

    if (["employees","accounts","departments"].includes(route)) {
        if (!currentUser || currentUser.role !== "admin")
            return navigateTo("#/");
    }

    let page;

    if (!route) {
        page = document.getElementById("welcome-page");
    } else {
        page = document.getElementById(route + "-page");
        if (!page) {
            console.warn("Route not found:", route);
            return;
        }
    }

    if (page) page.classList.add("active");

    if (route === "profile")      renderProfile();
    if (route === "accounts")     renderAccountsList();
    if (route === "employees")    renderEmployees();
    if (route === "departments")  renderDepartments();
    if (route === "my-requests")  renderMyRequests();
}

window.addEventListener("hashchange", handleRouting);