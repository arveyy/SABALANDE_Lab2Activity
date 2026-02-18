const STORAGE_KEY = 'ipt_demo_v1';
window.db = {};

function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        window.db = {
            accounts: [
                { first: "Admin", last: "User", email: "admin@example.com", password: "Password123!", role: "admin", verified: true }
            ],
            departments: [
                { id: 1, name: "Engineering", description: "Software team" },
                { id: 2, name: "HR", description: "Human Resources" }
            ],
            employees: [],
            requests: []
        };
        saveToStorage();
        return;
    }

    window.db = JSON.parse(raw);

    // migrate: ensure departments have description field
    if (window.db.departments) {
        window.db.departments = window.db.departments.map(d => ({
            description: "",
            ...d
        }));
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window.db));
}

loadFromStorage();