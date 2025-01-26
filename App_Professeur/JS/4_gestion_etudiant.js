import { baseUrl } from "../../Configuration_Js/base-url.js";
import { studentDB } from "./database/4_etudiants.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";
import { studentService } from "./services/student-service.js";

// 状态管理
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

// 初始化函数
export async function initialize() {
  console.log("=== Student Management Initialization START ===");
  try {
    // 1. 初始化数据库连接
    console.log("1. Checking database connection...");
    if (!studentDB || !studentDB.db) {
      throw new Error("Database connection not initialized");
    }
    console.log("Database connection verified");

    // 2. 设置事件监听器
    console.log("2. Setting up event listeners...");
    setupEventListeners();
    console.log("Event listeners setup completed");

    // 3. 获取并显示初始数据
    console.log("3. Fetching initial student data...");
    await fetchAndRenderStudents();
    console.log("Initial data fetch and render completed");

    console.log("=== Student Management Initialization END ===");
  } catch (error) {
    console.error("Initialization failed:", error);
    const errorContainer = document.querySelector(".error-message");
    if (errorContainer) {
      errorContainer.textContent = "Erreur lors de l'initialisation";
      errorContainer.style.display = "block";
    }
    throw error;
  }
}

// 获取并渲染学生数据
async function fetchAndRenderStudents() {
  try {
    console.log("=== Fetching Students START ===");

    // 1. 从数据库获取数据
    const { students, total } = await studentDB.getStudents(
      state.filters,
      state.pagination.currentPage,
      state.pagination.itemsPerPage
    );

    console.log("Students data received:", {
      count: students?.length,
      total,
      firstStudent: students?.[0],
    });

    // 2. 更新状态
    state.students = students || [];
    state.pagination.totalPages = Math.ceil(
      total / state.pagination.itemsPerPage
    );

    // 3. 渲染界面
    renderStudents();
    updateTableInfo();
    renderPagination();

    console.log("=== Fetching Students END ===");
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}

// 渲染学生列表
function renderStudents() {
  console.log("=== Rendering Students START ===");
  const tbody = document.getElementById("students-list");

  if (!tbody) {
    console.error("Table body element not found");
    return;
  }

  try {
    tbody.innerHTML = "";

    if (state.students.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center">Aucun étudiant trouvé</td></tr>';
      return;
    }

    const html = state.students
      .map((student) => {
        const isSelected = state.selectedStudents.has(student.id.toString());
        return `
        <tr>
          <td>
            <input type="checkbox" 
                   class="student-select" 
                   data-id="${student.id}"
                   ${isSelected ? "checked" : ""}
            >
        </td>
          <td>${student.first_name} ${student.last_name}</td>
          <td>${student.email || ""}</td>
          <td>${student.study_level || ""}</td>
          <td>${student.current_courses?.length || 0} cours</td>
          <td>${student.overall_progress || 0}%</td>
          <td>
            <span class="status-badge ${
              student.academic_status === "active"
                ? "status-active"
                : "status-inactive"
            }">
              ${student.academic_status === "active" ? "Actif" : "Inactif"}
          </span>
        </td>
        <td>
            <div class="action-buttons">
              <button class="action-btn delete" onclick="handleDeleteStudent(${
                student.id
              })">
                <i class="fas fa-trash-alt"></i>
                Supprimer
            </button>
          </div>
        </td>
      </tr>
      `;
      })
      .join("");

    tbody.innerHTML = html;
    updateSelectAllCheckbox();
    console.log("Table rendered successfully");
  } catch (error) {
    console.error("Error rendering students:", error);
    throw error;
  }
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

  let html = "";
  for (let i = 1; i <= state.pagination.totalPages; i++) {
    html += `
      <button class="page-number ${
        i === state.pagination.currentPage ? "active" : ""
      }"
              onclick="handlePageClick(${i})">${i}</button>
    `;
  }
  paginationNumbers.innerHTML = html;
}

// 设置事件监听器
function setupEventListeners() {
  // 搜索和过滤器
  const searchInput = document.getElementById("search-input");
  const levelFilter = document.getElementById("level-filter");
  const statusFilter = document.getElementById("status-filter");

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce((e) => {
        state.filters.search = e.target.value;
        state.pagination.currentPage = 1;
        fetchAndRenderStudents();
      }, 300)
    );
  }

  // 添加级别过滤器监听器
  if (levelFilter) {
    levelFilter.addEventListener("change", (e) => {
      console.log("Level filter changed:", e.target.value);
      state.filters.level = e.target.value;
      state.pagination.currentPage = 1;
      fetchAndRenderStudents();
    });
  }

  // 添加状态过滤器监听器
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      console.log("Status filter changed:", e.target.value);
      state.filters.status = e.target.value;
      state.pagination.currentPage = 1;
      fetchAndRenderStudents();
    });
  }

  // 分页按钮监听器
  const prevButton = document.querySelector(
    '.pagination-btn[data-page="prev"]'
  );
  const nextButton = document.querySelector(
    '.pagination-btn[data-page="next"]'
  );

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        fetchAndRenderStudents();
      }
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      if (state.pagination.currentPage < state.pagination.totalPages) {
        state.pagination.currentPage++;
        fetchAndRenderStudents();
      }
    });
  }

  // 添加全选复选框监听器
  const selectAllCheckbox = document.getElementById("select-all");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      const checkboxes = document.querySelectorAll(".student-select");

      state.selectedStudents.clear();
      checkboxes.forEach((checkbox) => {
        checkbox.checked = isChecked;
        if (isChecked) {
          state.selectedStudents.add(checkbox.dataset.id);
        }
      });

      updateSelectAllCheckbox();
      updateSelectionUI();
    });
  }

  // 添加表格内复选框的事件委托
  const tbody = document.getElementById("students-list");
  if (tbody) {
    tbody.addEventListener("change", (e) => {
      if (e.target.classList.contains("student-select")) {
        const studentId = e.target.dataset.id;
        if (e.target.checked) {
          state.selectedStudents.add(studentId);
        } else {
          state.selectedStudents.delete(studentId);
        }
        updateSelectAllCheckbox();
        updateSelectionUI();
      }
    });
  }
}

// 辅助函数
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

// 导出必要的函数到全局作用域
window.handleEditStudent = (id) => {
  console.log("Edit student:", id);
};

window.handleDeleteStudent = async (id) => {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) {
    try {
      await studentDB.deleteStudent(id);
      await fetchAndRenderStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
    }
  }
};

window.handlePageClick = (page) => {
  state.pagination.currentPage = page;
  fetchAndRenderStudents();
};

// 导入导出功能
window.handleImport = () => {
  // 创建文件输入元素
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".csv, .xlsx";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  // 监听文件选择
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 调用导入API
      const response = await studentDB.importStudents(formData);
      console.log("Import successful:", response);

      // 刷新学生列表
      await fetchAndRenderStudents();

      // 显示成功消息
      alert("Import réussi !");
    } catch (error) {
      console.error("Import failed:", error);
      alert("Échec de l'import: " + error.message);
    } finally {
      document.body.removeChild(fileInput);
    }
  });

  // 触发文件选择
  fileInput.click();
};

window.handleExport = async () => {
  try {
    // 获取所有学生数据
    const { students } = await studentDB.getStudents(
      { search: "", level: "all", status: "all" },
      1,
      1000
    );

    // 准备CSV数据
    const headers = [
      "ID",
      "Prénom",
      "Nom",
      "Email",
      "Niveau",
      "Cours",
      "Progrès",
      "Statut",
    ];

    const csvData = students.map((student) => [
      student.id,
      student.first_name,
      student.last_name,
      student.email,
      student.study_level,
      student.current_courses?.length || 0,
      student.overall_progress || 0,
      student.academic_status,
    ]);

    // 创建CSV内容
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `students_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("Export successful");
  } catch (error) {
    console.error("Export failed:", error);
    alert("Échec de l'export: " + error.message);
  }
};

// 更新全选复选框状态
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById("select-all");
  const checkboxes = document.querySelectorAll(".student-select");

  if (selectAllCheckbox) {
    const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
    const someChecked = Array.from(checkboxes).some((cb) => cb.checked);

    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked && !allChecked;
  }
}

// 更新选择UI
function updateSelectionUI() {
  // 这里可以添加选中数量显示或其他UI更新
  console.log(`Selected students: ${state.selectedStudents.size}`);
}
