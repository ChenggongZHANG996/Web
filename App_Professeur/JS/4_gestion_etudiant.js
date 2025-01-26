import { baseUrl } from "../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";
import { studentService } from "./services/4_gestion_etudiant.js";
import { dbService } from "../../Configuration_Js/db-service.js";

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
    // 1. 设置事件监听器
    console.log("1. Setting up event listeners...");
    setupEventListeners();
    console.log("Event listeners setup completed");

    // 2. 获取并显示初始数据
    console.log("2. Fetching initial student data...");
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
    const students = await studentService.getStudents(state.filters);
    state.students = students || [];
    renderStudents();
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
      await studentService.deleteStudent(id);
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
  fileInput.accept = ".csv";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  // 监听文件选择
  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          // 解析 CSV 数据
          const csvData = event.target.result;
          const lines = csvData.split('\n');
          const headers = lines[0].split(',');
          
          // 跳过标题行，处理数据行
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(',');
            const studentData = {
              first_name: values[1]?.trim(),
              last_name: values[2]?.trim(),
              email: values[3]?.trim(),
              study_level: values[4]?.trim(),
              academic_status: values[7]?.trim() || 'active',
              overall_progress: parseInt(values[6]) || 0,
              current_courses: []
            };

            await studentService.createStudent(studentData);
          }

          // 刷新学生列表
          await fetchAndRenderStudents();
          showNotification("Import réussi !", "success");
        } catch (error) {
          console.error("Error processing CSV:", error);
          showNotification("Erreur lors du traitement du fichier CSV", "error");
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Import failed:", error);
      showNotification("Échec de l'import: " + error.message, "error");
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
    const students = await studentService.getStudents({ search: "", level: "all", status: "all" });

    // 准备CSV数据
    const headers = [
      "ID",
      "Prénom",
      "Nom",
      "Email",
      "Niveau",
      "Cours",
      "Progrès",
      "Statut"
    ];

    const csvData = students.map((student) => [
      student.id,
      student.first_name,
      student.last_name,
      student.email,
      student.study_level,
      student.current_courses?.length || 0,
      student.overall_progress || 0,
      student.academic_status
    ]);

    // 创建CSV内容
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(","))
    ].join("\n");

    // 创建Blob并下载
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `students_export_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showNotification("Export réussi !", "success");
  } catch (error) {
    console.error("Export failed:", error);
    showNotification("Échec de l'export: " + error.message, "error");
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

// 模态框相关函数
window.openModal = () => {
  const modal = document.getElementById("student-modal");
  if (modal) {
    modal.style.display = "block";
  }
};

window.closeModal = () => {
  const modal = document.getElementById("student-modal");
  if (modal) {
    modal.style.display = "none";
    // 重置表单
    const form = document.getElementById("student-form");
    if (form) {
      form.reset();
    }
  }
};

// 当用户点击模态框外部时关闭模态框
window.addEventListener("click", (event) => {
  const modal = document.getElementById("student-modal");
  if (event.target === modal) {
    closeModal();
  }
});

// 处理表单提交
window.handleSubmitStudent = async (event) => {
  event.preventDefault();
  
  try {
    const form = event.target;
    const formData = new FormData(form);
    
    const studentData = {
      first_name: formData.get("firstName"),
      last_name: formData.get("lastName"),
      email: formData.get("email"),
      study_level: formData.get("level"),
      academic_status: "active",
      overall_progress: 0,
      current_courses: []
    };

    await studentService.createStudent(studentData);
    await fetchAndRenderStudents();
    closeModal();
    
    // 显示成功消息
    showNotification("Étudiant ajouté avec succès", "success");
  } catch (error) {
    console.error("Error creating student:", error);
    showNotification("Erreur lors de l'ajout de l'étudiant", "error");
  }
};

// 显示通知的辅助函数
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
