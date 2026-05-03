const API = {
  students: "/api/students",
  search: "/api/students/search",
  dashboardSummary: "/api/students/dashboard-summary",
  login: "/api/auth/login",
  me: "/api/auth/me",
  logout: "/api/auth/logout",
};

let visibleStudents = [];
let dashboardChart;

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || "Something went wrong. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function getCurrentUser() {
  try {
    return await apiFetch(API.me, { method: "GET" });
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

async function requireLogin() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }

  bindCurrentUser(user.username);
  return user;
}

function bindCurrentUser(username) {
  const badge = document.getElementById("userBadge");
  if (badge) {
    badge.textContent = username;
  }
}

async function bootDashboardPage() {
  await requireLogin();
  await loadDashboard();
}

async function bootStudentsPage() {
  await requireLogin();
  await loadStudents();
}

async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

  message.textContent = "";

  if (!username || !password) {
    message.textContent = "Enter both username and password.";
    return;
  }

  try {
    await apiFetch(API.login, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    window.location.href = "dashboard.html";
  } catch (error) {
    message.textContent = error.message;
  }
}

async function logout() {
  try {
    await fetch(API.logout, {
      method: "POST",
      credentials: "same-origin",
    });
  } finally {
    window.location.href = "login.html";
  }
}

async function fetchStudents(query = "") {
  const url = query.trim()
    ? `${API.search}?q=${encodeURIComponent(query.trim())}`
    : API.students;

  return apiFetch(url, { method: "GET" });
}

async function loadStudents() {
  const query = document.getElementById("searchInput")?.value || "";
  const table = document.getElementById("studentTable");
  const emptyState = document.getElementById("emptyState");

  if (!table) {
    return;
  }

  try {
    const students = await fetchStudents(query);
    visibleStudents = students;
    table.innerHTML = "";

    students.forEach((student) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${student.id}</td>
        <td>
          <div class="student-cell">
            <strong>${escapeHtml(student.fullName)}</strong>
            <span>${escapeHtml(student.enrollmentNumber)}</span>
          </div>
        </td>
        <td><span class="course-pill">${escapeHtml(student.course)}</span></td>
        <td>
          <div class="student-cell">
            <strong>${escapeHtml(student.email)}</strong>
            <span>${escapeHtml(student.phoneNumber)}</span>
          </div>
        </td>
        <td>${student.age}</td>
        <td>
          <div class="actions">
            <button class="btn btn-sm btn-outline-primary" onclick="startEdit(${student.id})">Edit</button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteStudent(${student.id})">Delete</button>
          </div>
        </td>
      `;
      table.appendChild(row);
    });

    emptyState.classList.toggle("d-none", students.length > 0);
  } catch (error) {
    showToast(error.message, "danger");
  }
}

function buildStudentPayload() {
  return {
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    course: document.getElementById("course").value.trim(),
    enrollmentNumber: document.getElementById("enrollmentNumber").value.trim(),
    age: Number(document.getElementById("age").value),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
  };
}

function validateStudentForm(payload) {
  const namePattern = /^[A-Za-z ]+$/;
  const enrollmentPattern = /^[A-Za-z0-9-]+$/;
  const phonePattern = /^[0-9]{10}$/;

  if (payload.fullName.length < 3 || !namePattern.test(payload.fullName)) {
    return "Full name must be at least 3 characters and contain only letters and spaces.";
  }
  if (!payload.email || !payload.email.includes("@")) {
    return "Enter a valid email address.";
  }
  if (payload.course.length < 2) {
    return "Course name must be at least 2 characters.";
  }
  if (!enrollmentPattern.test(payload.enrollmentNumber)) {
    return "Enrollment number may contain only letters, numbers, and hyphens.";
  }
  if (!Number.isInteger(payload.age) || payload.age < 16 || payload.age > 100) {
    return "Age must be between 16 and 100.";
  }
  if (!phonePattern.test(payload.phoneNumber)) {
    return "Phone number must contain exactly 10 digits.";
  }

  return null;
}

async function saveStudent(event) {
  event.preventDefault();

  const id = document.getElementById("studentId").value;
  const payload = buildStudentPayload();
  const validationError = validateStudentForm(payload);

  if (validationError) {
    showToast(validationError, "warning");
    return;
  }

  try {
    await apiFetch(id ? `${API.students}/${id}` : API.students, {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });

    showToast(id ? "Student updated successfully." : "Student created successfully.", "success");
    resetForm();
    await loadStudents();
  } catch (error) {
    const firstValidationMessage = error.payload?.validationErrors
      ? Object.values(error.payload.validationErrors)[0]
      : null;
    showToast(firstValidationMessage || error.message, "danger");
  }
}

function startEdit(id) {
  const student = visibleStudents.find((item) => item.id === id);
  if (!student) {
    showToast("Student could not be selected.", "danger");
    return;
  }

  document.getElementById("studentId").value = id;
  document.getElementById("fullName").value = student.fullName;
  document.getElementById("email").value = student.email;
  document.getElementById("course").value = student.course;
  document.getElementById("enrollmentNumber").value = student.enrollmentNumber;
  document.getElementById("age").value = student.age;
  document.getElementById("phoneNumber").value = student.phoneNumber;
  document.getElementById("saveButton").textContent = "Update Student";
  document.getElementById("cancelButton").classList.remove("d-none");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  document.getElementById("studentForm")?.reset();
  document.getElementById("studentId").value = "";
  document.getElementById("saveButton").textContent = "Add Student";
  document.getElementById("cancelButton").classList.add("d-none");
}

async function deleteStudent(id) {
  const confirmed = window.confirm("Delete this student record?");
  if (!confirmed) {
    return;
  }

  try {
    await apiFetch(`${API.students}/${id}`, { method: "DELETE" });
    showToast("Student deleted successfully.", "success");
    await loadStudents();
  } catch (error) {
    showToast(error.message, "danger");
  }
}

async function loadDashboard() {
  try {
    const summary = await apiFetch(API.dashboardSummary, { method: "GET" });
    document.getElementById("totalStudents").textContent = summary.totalStudents;
    document.getElementById("totalCourses").textContent = summary.totalCourses;
    document.getElementById("averageAge").textContent = summary.averageAge;
    document.getElementById("latestStudent").textContent = summary.latestStudent?.fullName || "No students yet";
    document.getElementById("latestCourse").textContent = summary.latestStudent
      ? `${summary.latestStudent.course} | ${summary.latestStudent.enrollmentNumber}`
      : "Add your first student to begin";

    renderCourseList(summary.courseBreakdown);
    renderChart(summary.courseBreakdown.map((item) => item.course), summary.courseBreakdown.map((item) => item.totalStudents));
  } catch (error) {
    showToast(error.message, "danger");
  }
}

function renderCourseList(courseBreakdown) {
  const list = document.getElementById("courseList");
  if (!list) {
    return;
  }

  list.innerHTML = "";

  if (!courseBreakdown.length) {
    list.innerHTML = "<li><span>No course data available</span><strong>0</strong></li>";
    return;
  }

  courseBreakdown.forEach((item) => {
    const row = document.createElement("li");
    row.innerHTML = `<span>${escapeHtml(item.course)}</span><strong>${item.totalStudents}</strong>`;
    list.appendChild(row);
  });
}

function renderChart(labels, data) {
  const chartCanvas = document.getElementById("studentChart");
  if (!chartCanvas || !window.Chart) {
    return;
  }

  if (dashboardChart) {
    dashboardChart.destroy();
  }

  dashboardChart = new Chart(chartCanvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Students",
        data,
        backgroundColor: ["#0f766e", "#2563eb", "#ea580c", "#7c3aed", "#dc2626", "#0891b2"],
        borderRadius: 12,
        maxBarThickness: 56,
      }],
    },
    options: {
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(148, 163, 184, 0.22)" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  });
}

function showToast(message, tone = "danger") {
  const toast = document.getElementById("appMessage");
  if (!toast) {
    alert(message);
    return;
  }

  toast.className = `alert app-alert alert-${tone}`;
  toast.textContent = message;
  toast.classList.remove("d-none");
  setTimeout(() => toast.classList.add("d-none"), 3500);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
