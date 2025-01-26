import { baseUrl } from "../../Configuration_Js/base-url.js";
import { studentService } from "./services/4_etudiants.js";
import { studentModel } from "./models/4_etudiants.js";

// 状态
let state = {
  students: [],
  filters: {
    search: "",
    level: "all",
    status: "all",
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: 0,
  },
  selectedStudents: new Set(),
};

// 导出所有需要的函数
export async function initialize() {
  console.log("Initializing student management...");
  try {
    console.log("Setting up event listeners...");
    setupEventListeners();
    console.log("Event listeners set up successfully");

    console.log("Fetching initial student data...");
    await fetchAndRenderStudents();
    console.log("Initial data fetch and render completed");
  } catch (error) {
    console.error("Error during initialization:", error);
    const errorContainer = document.querySelector(".error-message");
    if (errorContainer) {
      errorContainer.textContent = "Erreur lors de l'initialisation";
      errorContainer.style.display = "block";
    }
  }
}

// 将需要从HTML中调用的函数添加到window对象
window.handleEditStudent = handleEditStudent;
window.handleViewStudent = handleViewStudent;
window.handleDeleteStudent = handleDeleteStudent;
window.handlePageClick = handlePageClick;
window.handleImport = handleImport;
window.handleExport = handleExport;

// 获取并渲染学生数据
async function fetchAndRenderStudents() {
  try {
    console.log("=== fetchAndRenderStudents START ===");
    console.log(
      "1. Current state before fetch:",
      JSON.stringify(state, null, 2)
    );

    // 获取数据
    const { students, total } = await studentDB.getStudents(
      state.filters,
      state.pagination.currentPage,
      state.pagination.itemsPerPage
    );

    console.log("2. Database response:", {
      studentsCount: students?.length,
      firstStudent: students?.[0],
      total,
    });

    if (!Array.isArray(students)) {
      console.error("3. ERROR: Received invalid students data:", students);
      return;
    }

    // 更新状态
    state.students = students;
    state.pagination.totalPages = Math.ceil(
      total / state.pagination.itemsPerPage
    );

    console.log("4. Updated state:", {
      studentsCount: state.students.length,
      totalPages: state.pagination.totalPages,
    });

    // 渲染
    console.log("5. Starting render process...");
    renderStudents();
    updateTableInfo();
    renderPagination();

    console.log("=== fetchAndRenderStudents END ===");
  } catch (error) {
    console.error("ERROR in fetchAndRenderStudents:", error);
    const errorContainer = document.querySelector(".error-message");
    if (errorContainer) {
      errorContainer.textContent = "Erreur lors du chargement des étudiants";
      errorContainer.style.display = "block";
    }
  }
}

// 设置事件监听器
function setupEventListeners() {
  console.log("Setting up event listeners...");

  // 搜索和过滤器
  const searchInput = document.getElementById("search-input");
  const levelFilter = document.getElementById("level-filter");
  const statusFilter = document.getElementById("status-filter");

  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300));
  } else {
    console.error("Search input element not found");
  }

  if (levelFilter) {
    levelFilter.addEventListener("change", handleFilterChange);
  } else {
    console.error("Level filter element not found");
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", handleFilterChange);
  } else {
    console.error("Status filter element not found");
  }

  // 全选复选框
  const selectAllCheckbox = document.getElementById("select-all");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  } else {
    console.error("Select all checkbox not found");
  }

  // 分页按钮
  const prevButton = document.querySelector(
    '.pagination-btn[data-page="prev"]'
  );
  const nextButton = document.querySelector(
    '.pagination-btn[data-page="next"]'
  );

  if (prevButton && nextButton) {
    prevButton.addEventListener("click", () => handlePagination("prev"));
    nextButton.addEventListener("click", () => handlePagination("next"));
  } else {
    console.error("Pagination buttons not found");
  }

  // 模态框相关
  const closeModalBtn = document.querySelector(".close-modal");
  const cancelBtn = document.querySelector(".cancel-btn");
  const studentForm = document.getElementById("student-form");

  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  if (studentForm) {
    studentForm.addEventListener("submit", handleSaveStudent);
  }

  console.log("Event listeners setup completed");
}

// 处理搜索
function handleSearch(e) {
  state.filters.search = e.target.value.toLowerCase();
  state.pagination.currentPage = 1;
  fetchAndRenderStudents();
}

// 处理过滤器变化
function handleFilterChange(e) {
  const { id, value } = e.target;
  const filterType = id.split("-")[0];
  state.filters[filterType] = value;
  state.pagination.currentPage = 1;
  fetchAndRenderStudents();
}

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 处理全选
function handleSelectAll(e) {
  const isChecked = e.target.checked;
  const checkboxes = document.querySelectorAll("tbody input[type='checkbox']");

  checkboxes.forEach((checkbox) => {
    checkbox.checked = isChecked;
    const studentId = parseInt(checkbox.dataset.id);
    if (isChecked) {
      state.selectedStudents.add(studentId);
    } else {
      state.selectedStudents.delete(studentId);
    }
  });
}

// 处理学生选择
function handleStudentSelect(e) {
  const checkbox = e.target;
  const studentId = parseInt(checkbox.dataset.id);

  if (checkbox.checked) {
    state.selectedStudents.add(studentId);
  } else {
    state.selectedStudents.delete(studentId);
    document.getElementById("select-all").checked = false;
  }
}

// 渲染学生列表
function renderStudents() {
  console.log("=== renderStudents START ===");
  const tbody = document.getElementById("students-list");

  console.log("1. Found tbody element:", !!tbody);
  console.log("2. Current students in state:", {
    count: state.students.length,
    data: state.students,
  });

  if (!tbody) {
    console.error("3. ERROR: Table body element not found: students-list");
    return;
  }

  if (!Array.isArray(state.students)) {
    console.error("3. ERROR: Invalid students data in state:", state.students);
    return;
  }

  try {
    // 清空现有内容
    console.log("4. Clearing existing content");
    tbody.innerHTML = "";

    if (state.students.length === 0) {
      console.log("5. No students to display");
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center">Aucun étudiant trouvé</td>
        </tr>
      `;
      return;
    }

    console.log("5. Rendering students table rows");
    const html = state.students
      .map((student) => {
        console.log("6. Processing student:", student.id);
        // 确保 current_courses 是数组
        const currentCourses = Array.isArray(student.current_courses)
          ? student.current_courses
          : [];

        // 确保 overall_progress 是数字
        const progress =
          typeof student.overall_progress === "number"
            ? student.overall_progress
            : 0;

        return `
          <tr class="${
            student.academic_status === "inactive" ? "inactive" : ""
          }">
            <td>
              <input type="checkbox" class="student-select" data-id="${
                student.id
              }" />
            </td>
            <td>
              <div class="student-name">
                <div class="student-avatar">${getInitials(
                  student.first_name,
                  student.last_name
                )}</div>
                <div>
                  <div>${student.first_name} ${student.last_name}</div>
                  <div class="student-number">${
                    student.student_number || ""
                  }</div>
                </div>
              </div>
            </td>
            <td>${student.email || ""}</td>
            <td>${formatStudyLevel(student.study_level || "")}</td>
            <td>
              <div class="student-courses">
                ${currentCourses
                  .slice(0, 2)
                  .map(
                    (course) =>
                      `<span class="course-badge">${
                        course.title || course
                      }</span>`
                  )
                  .join("")}
                ${
                  currentCourses.length > 2
                    ? `<span class="course-badge">+${
                        currentCourses.length - 2
                      }</span>`
                    : ""
                }
              </div>
            </td>
            <td class="progress-cell">
              <div class="progress-bar">
                <div class="progress" style="width: ${progress}%"></div>
              </div>
              <span>${progress}%</span>
            </td>
            <td>
              <span class="status-badge ${
                student.academic_status === "active"
                  ? "status-active"
                  : "status-inactive"
              }">
                ${formatStatus(student.academic_status || "inactive")}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn edit" onclick="handleEditStudent(${
                  student.id
                })">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn view" onclick="handleViewStudent(${
                  student.id
                })">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn delete" onclick="handleDeleteStudent(${
                  student.id
                })">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");

    console.log("7. Setting innerHTML");
    tbody.innerHTML = html;

    console.log("8. Table HTML updated successfully");
  } catch (error) {
    console.error("ERROR in renderStudents:", error);
  }

  console.log("=== renderStudents END ===");

  // 重新添加事件监听器
  const checkboxes = document.querySelectorAll(".student-select");
  console.log("Found checkboxes:", checkboxes.length);

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleStudentSelect);
  });
}

// 更新表格信息
function updateTableInfo() {
  const showingCount = document.querySelector(".showing-count");
  const totalCount = document.querySelector(".total-count");
  if (showingCount && totalCount) {
    showingCount.textContent = state.students.length;
    totalCount.textContent =
      state.pagination.totalPages * state.pagination.itemsPerPage;
  }
}

// 渲染分页
function renderPagination() {
  const paginationNumbers = document.querySelector(".pagination-numbers");
  if (!paginationNumbers) return;

  let paginationHTML = "";
  for (let i = 1; i <= state.pagination.totalPages; i++) {
    paginationHTML += `
      <button class="page-number ${
        i === state.pagination.currentPage ? "active" : ""
      }" onclick="handlePageClick(${i})">${i}</button>
    `;
  }
  paginationNumbers.innerHTML = paginationHTML;
}

// 处理分页
function handlePagination(direction) {
  if (direction === "prev" && state.pagination.currentPage > 1) {
    state.pagination.currentPage--;
  } else if (
    direction === "next" &&
    state.pagination.currentPage < state.pagination.totalPages
  ) {
    state.pagination.currentPage++;
  }
  fetchAndRenderStudents();
}

// 处理页码点击
function handlePageClick(page) {
  state.pagination.currentPage = page;
  fetchAndRenderStudents();
}

// 获取姓名首字母
function getInitials(firstName, lastName) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
}

// 打开模态框
async function openModal(studentId = null) {
  const modal = document.getElementById("student-modal");
  const form = document.getElementById("student-form");
  form.reset();

  if (studentId) {
    const student = state.students.find((s) => s.id === studentId);
    if (student) {
      form.firstName.value = student.first_name;
      form.lastName.value = student.last_name;
      form.email.value = student.email;
      form.level.value = student.study_level;
      form.birthDate.value = student.birth_date?.split("T")[0] || "";
      form.phone.value = student.phone || "";
      form.address.value = student.address || "";
      form.dataset.studentId = student.id;
    }
  } else {
    delete form.dataset.studentId;
  }

  modal.style.display = "block";
}

// 关闭模态框
function closeModal() {
  document.getElementById("student-modal").style.display = "none";
}

// 处理保存学生
async function handleSaveStudent(e) {
  e.preventDefault();
  const form = document.getElementById("student-form");

  // 基本信息
  const studentData = {
    first_name: form.firstName.value.trim(),
    last_name: form.lastName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    birth_date: form.birthDate.value,
    address: form.address.value.trim(),
    study_level: form.level.value.toUpperCase(),

    // 学术信息
    major: form.major?.value?.trim() || null,
    department: form.department?.value?.trim() || null,
    student_number:
      form.studentNumber?.value?.trim() || generateStudentNumber(),
    entry_year: new Date().getFullYear(),
    academic_status: "active",

    // 课程相关
    current_courses: [],
    course_history: [],
    overall_progress: 0,
    course_grades: {},

    // 其他信息
    achievements: [],
    language_preferences: ["fr"],
    notes: form.notes?.value?.trim() || null,
    special_requirements: form.specialRequirements?.value?.trim() || null,

    // 时间戳
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    if (form.dataset.studentId) {
      // 更新现有学生
      const updatedData = { ...studentData };
      delete updatedData.created_at; // 不更新创建时间
      await studentDB.updateStudent(form.dataset.studentId, updatedData);
    } else {
      // 创建新学生
      await studentDB.createStudent(studentData);
    }

    closeModal();
    await fetchAndRenderStudents();
  } catch (error) {
    console.error("Error saving student:", error);
    // 显示错误提示
    const errorContainer = document.querySelector(".error-message");
    if (errorContainer) {
      errorContainer.textContent =
        "Erreur lors de l'enregistrement de l'étudiant";
      errorContainer.style.display = "block";
    }
  }
}

// 生成学生编号
function generateStudentNumber() {
  const year = new Date().getFullYear().toString();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `${year}${random}`;
}

// 处理导入
function handleImport() {
  console.log("导入学生数据");
  // TODO: 实现导入功能
}

// 处理导出
function handleExport() {
  console.log("导出学生数据");
  // TODO: 实现导出功能
}

// 处理编辑学生
function handleEditStudent(studentId) {
  openModal(studentId);
}

// 处理查看学生
function handleViewStudent(studentId) {
  // 实现查看学生详情的逻辑
}

// 处理删除学生
async function handleDeleteStudent(studentId) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) return;

  try {
    await studentDB.deleteStudent(studentId);
    await fetchAndRenderStudents();
  } catch (error) {
    console.error("Error deleting student:", error);
    // 显示错误提示
  }
}

// 格式化学习级别
function formatStudyLevel(level) {
  const levelMap = {
    L1: "Licence 1",
    L2: "Licence 2",
    L3: "Licence 3",
    M1: "Master 1",
    M2: "Master 2",
  };
  return levelMap[level] || level;
}

// 格式化状态
function formatStatus(status) {
  const statusMap = {
    active: "Actif",
    inactive: "Inactif",
    suspended: "Suspendu",
  };
  return statusMap[status] || status;
}
