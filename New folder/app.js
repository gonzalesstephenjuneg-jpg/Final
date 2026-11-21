// Constants matching Final Project.py
const PASSING_GRADE = 75;
const MAX_ATTEMPTS = 3;
const STORAGE_KEY = "student_portal_schedules";

// State
let failedAttempts = 0;
let pendingDeleteCode = null;

// Database Helper (LocalStorage abstraction; replace with fetch() calls to backend SQL API if desired)
const ScheduleDB = {
    getAll() {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    },
    saveAll(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    },
    add(item) {
        const list = this.getAll();
        if (list.some(s => s.code === item.code)) {
            return { ok: false, message: `Subject code ${item.code} already exists.` };
        }
        list.push(item);
        this.saveAll(list);
        return { ok: true, message: `${item.subject} has been added to the schedule.` };
    },
    delete(code) {
        const list = this.getAll().filter(s => s.code !== code);
        this.saveAll(list);
    }
};

// DOM Elements
const loginView = document.getElementById("login-view");
const portalView = document.getElementById("portal-view");
const loginForm = document.getElementById("login-form");
const loginAlert = document.getElementById("login-alert");
const attemptsLeftEl = document.getElementById("attempts-left");
const lockoutBox = document.getElementById("lockout-box");
const loginBtn = document.getElementById("login-btn");

// 1. Authentication Logic
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (failedAttempts >= MAX_ATTEMPTS) return;

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "admin" && password === "1234") {
        failedAttempts = 0;
        attemptsLeftEl.textContent = MAX_ATTEMPTS;
        loginAlert.classList.add("hidden");
        loginForm.reset();
        loginView.classList.add("hidden");
        portalView.classList.remove("hidden");
        renderScheduleTable();
    } else {
        failedAttempts++;
        const left = MAX_ATTEMPTS - failedAttempts;
        attemptsLeftEl.textContent = Math.max(0, left);
        showAlert(loginAlert, "Incorrect username or password.", "error");

        if (failedAttempts >= MAX_ATTEMPTS) {
            loginBtn.disabled = true;
            lockoutBox.classList.remove("hidden");
        }
    }
});

document.getElementById("reset-lockout-btn").addEventListener("click", () => {
    failedAttempts = 0;
    attemptsLeftEl.textContent = MAX_ATTEMPTS;
    loginBtn.disabled = false;
    lockoutBox.classList.add("hidden");
    loginAlert.classList.add("hidden");
    loginForm.reset();
});

document.getElementById("logout-btn").addEventListener("click", () => {
    portalView.classList.add("hidden");
    loginView.classList.remove("hidden");
});

// Navigation Tabs
document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.add("hidden"));

        btn.classList.add("active");
        document.getElementById(`tab-${btn.dataset.tab}`).classList.remove("hidden");
    });
});

// 2. Calculator Logic
const calcForm = document.getElementById("calc-form");
const calcResultEl = document.getElementById("calc-result");
const calcHistoryEl = document.getElementById("calc-history");

calcForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const num1 = parseFloat(document.getElementById("num1").value);
    const num2 = parseFloat(document.getElementById("num2").value);
    const op = document.getElementById("operator").value;

    if (isNaN(num1) || isNaN(num2)) {
        calcResultEl.textContent = "Invalid numbers!";
        return;
    }

    let result;
    if (op === "+") result = num1 + num2;
    else if (op === "-") result = num1 - num2;
    else if (op === "*") result = num1 * num2;
    else if (op === "/") {
        if (num2 === 0) {
            calcResultEl.textContent = "Cannot divide by zero!";
            return;
        }
        result = num1 / num2;
    }

    const formatted = Number.isInteger(result) ? result : Number(result.toFixed(4));
    calcResultEl.textContent = formatted;

    if (calcHistoryEl.querySelector(".empty-msg")) {
        calcHistoryEl.innerHTML = "";
    }
    const li = document.createElement("li");
    li.textContent = `${num1} ${op} ${num2} = ${formatted}`;
    calcHistoryEl.prepend(li);
});

document.getElementById("calc-clear-btn").addEventListener("click", () => {
    calcForm.reset();
    calcResultEl.textContent = "0";
});

// 3. Subject Schedule Logic
const scheduleForm = document.getElementById("schedule-form");
const scheduleAlert = document.getElementById("schedule-alert");
const scheduleTbody = document.getElementById("schedule-tbody");
const scheduleSearch = document.getElementById("schedule-search");

scheduleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = document.getElementById("sub-code").value.trim().toUpperCase();
    const subject = document.getElementById("sub-name").value.trim();
    const day = document.getElementById("sub-day").value.trim();
    const time = document.getElementById("sub-time").value.trim();
    const room = document.getElementById("sub-room").value.trim();
    const date = document.getElementById("sub-date").value;

    const res = ScheduleDB.add({ code, subject, day, time, room, date });
    showAlert(scheduleAlert, res.message, res.ok ? "success" : "error");

    if (res.ok) {
        scheduleForm.reset();
        renderScheduleTable();
    }
});

scheduleSearch.addEventListener("input", renderScheduleTable);

function renderScheduleTable() {
    const query = scheduleSearch.value.trim().toLowerCase();
    const list = ScheduleDB.getAll().filter(item =>
        item.code.toLowerCase().includes(query) ||
        item.subject.toLowerCase().includes(query)
    );

    if (list.length === 0) {
        scheduleTbody.innerHTML = `<tr><td colspan="8" class="empty-msg">The schedule is empty.</td></tr>`;
        return;
    }

    scheduleTbody.innerHTML = list.map((s, idx) => `
        <tr>
            <td>${idx + 1}</td>
            <td><strong>${escapeHtml(s.code)}</strong></td>
            <td>${escapeHtml(s.subject)}</td>
            <td>${escapeHtml(s.day)}</td>
            <td>${escapeHtml(s.time)}</td>
            <td>${escapeHtml(s.room)}</td>
            <td>${escapeHtml(s.date)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="promptDelete('${escapeHtml(s.code)}', '${escapeHtml(s.subject)}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

// Delete Modal Logic
const deleteModal = document.getElementById("delete-modal");
const deleteModalText = document.getElementById("delete-modal-text");

window.promptDelete = function(code, subject) {
    pendingDeleteCode = code;
    deleteModalText.textContent = `Delete ${subject} (code ${code})?`;
    deleteModal.classList.remove("hidden");
};

document.getElementById("cancel-delete-btn").addEventListener("click", () => {
    pendingDeleteCode = null;
    deleteModal.classList.add("hidden");
});

document.getElementById("confirm-delete-btn").addEventListener("click", () => {
    if (pendingDeleteCode) {
        ScheduleDB.delete(pendingDeleteCode);
        showAlert(scheduleAlert, `Subject ${pendingDeleteCode} has been deleted from the schedule.`, "success");
        renderScheduleTable();
    }
    pendingDeleteCode = null;
    deleteModal.classList.add("hidden");
});

// 4. Grade Average Logic
const subjectCountInput = document.getElementById("subject-count");
const gradeInputsContainer = document.getElementById("grade-inputs-container");
const gradeForm = document.getElementById("grade-form");

function buildGradeInputs(count) {
    gradeInputsContainer.innerHTML = "";
    for (let i = 1; i <= count; i++) {
        const row = document.createElement("div");
        row.className = "grade-row";
        row.innerHTML = `
            <label for="grade-${i}">Subject ${i} Grade (0-100):</label>
            <input type="number" step="any" min="0" max="100" id="grade-${i}" class="grade-input" required placeholder="0 - 100">
        `;
        gradeInputsContainer.appendChild(row);
    }
}

document.getElementById("generate-grades-btn").addEventListener("click", () => {
    const count = parseInt(subjectCountInput.value, 10);
    if (isNaN(count) || count < 1) return;
    buildGradeInputs(Math.min(count, 20));
});

gradeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const inputs = Array.from(document.querySelectorAll(".grade-input"));
    const grades = inputs.map(inp => parseFloat(inp.value));

    if (grades.some(g => isNaN(g) || g < 0 || g > 100)) {
        alert("Grade must be between 0 and 100.");
        return;
    }

    const sum = grades.reduce((acc, val) => acc + val, 0);
    const average = sum / grades.length;
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);
    const passed = average >= PASSING_GRADE;

    document.getElementById("grade-avg").textContent = average.toFixed(2);
    document.getElementById("grade-high").textContent = highest;
    document.getElementById("grade-low").textContent = lowest;

    const remarksEl = document.getElementById("grade-remarks");
    const remarksBox = document.getElementById("grade-remarks-box");
    remarksEl.textContent = passed ? "PASSED" : "FAILED";
    remarksBox.className = `remarks-banner ${passed ? "remarks-passed" : "remarks-failed"}`;
});

document.getElementById("reset-grades-btn").addEventListener("click", () => {
    gradeForm.reset();
    document.getElementById("grade-avg").textContent = "--";
    document.getElementById("grade-high").textContent = "--";
    document.getElementById("grade-low").textContent = "--";
    document.getElementById("grade-remarks").textContent = "PENDING";
    document.getElementById("grade-remarks-box").className = "remarks-banner";
});

// Utilities
function showAlert(el, msg, type) {
    el.textContent = msg;
    el.className = `alert alert-${type}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Initialize default 3 grade fields on load
buildGradeInputs(3);