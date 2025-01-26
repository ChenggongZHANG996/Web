// 模拟学生数据
const MOCK_STUDENTS = [
  {
    id: 1,
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie.martin@estia.fr",
    level: "l3",
    birthDate: "2002-05-15",
    phone: "+33 6 12 34 56 78",
    address: "123 Rue de la Paix, Bidart",
    courses: [
      { id: 1, name: "Mathématiques" },
      { id: 2, name: "Physique" },
    ],
    progress: 85,
    status: "active",
  },
  {
    id: 2,
    firstName: "Lucas",
    lastName: "Bernard",
    email: "lucas.bernard@estia.fr",
    level: "m1",
    birthDate: "2001-08-22",
    phone: "+33 6 23 45 67 89",
    address: "456 Avenue des Fleurs, Biarritz",
    courses: [
      { id: 2, name: "Physique" },
      { id: 3, name: "Chimie" },
    ],
    progress: 92,
    status: "active",
  },
  {
    id: 3,
    firstName: "Emma",
    lastName: "Dubois",
    email: "emma.dubois@estia.fr",
    level: "l2",
    birthDate: "2003-03-10",
    phone: "+33 6 34 56 78 90",
    address: "789 Boulevard de la Mer, Anglet",
    courses: [
      { id: 1, name: "Mathématiques" },
      { id: 4, name: "Informatique" },
    ],
    progress: 78,
    status: "active",
  },
  {
    id: 4,
    firstName: "Thomas",
    lastName: "Petit",
    email: "thomas.petit@estia.fr",
    level: "m2",
    birthDate: "2000-11-30",
    phone: "+33 6 45 67 89 01",
    address: "321 Rue des Pins, Bayonne",
    courses: [
      { id: 3, name: "Chimie" },
      { id: 4, name: "Informatique" },
    ],
    progress: 95,
    status: "inactive",
  },
  {
    id: 5,
    firstName: "Léa",
    lastName: "Roux",
    email: "lea.roux@estia.fr",
    level: "l1",
    birthDate: "2004-07-25",
    phone: "+33 6 56 78 90 12",
    address: "654 Avenue de l'Océan, Biarritz",
    courses: [
      { id: 1, name: "Mathématiques" },
      { id: 2, name: "Physique" },
    ],
    progress: 65,
    status: "active",
  },
];

// 状态和过滤器
let state = {
  students: [...MOCK_STUDENTS],
  filters: {
    search: "",
    level: "all",
    status: "all",
  },
  pagination: {
    currentPage: 1,
    itemsPerPage: 10,
    totalPages: Math.ceil(MOCK_STUDENTS.length / 10),
  },
  selectedStudents: new Set(),
};

// 初始化函数
export function initialize() {
  setupEventListeners();
  renderStudents();
  updateTableInfo();
  renderPagination();
}

// 设置事件监听器
function setupEventListeners() {
  // 搜索输入
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
  }

  // 过滤器变化
  document
    .getElementById("level-filter")
    .addEventListener("change", handleFilterChange);
  document
    .getElementById("status-filter")
    .addEventListener("change", handleFilterChange);

  // 全选复选框
  const selectAllCheckbox = document.getElementById("select-all");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", handleSelectAll);
  }

  // 添加学生按钮
  const addStudentBtn = document.querySelector(".add-student-btn");
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", () => openModal());
  }

  // 导入按钮
  const importBtn = document.querySelector(".import-btn");
  if (importBtn) {
    importBtn.addEventListener("click", handleImport);
  }

  // 导出按钮
  const exportBtn = document.querySelector(".export-btn");
  if (exportBtn) {
    exportBtn.addEventListener("click", handleExport);
  }

  // 模态框关闭按钮
  const closeModalBtn = document.querySelector(".close-modal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", closeModal);
  }

  // 取消按钮
  const cancelBtn = document.querySelector(".cancel-btn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeModal);
  }

  // 保存按钮
  const saveBtn = document.querySelector(".save-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveStudent);
  }

  // 分页按钮
  const paginationBtns = document.querySelectorAll(".pagination-btn");
  paginationBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const direction = e.currentTarget.dataset.page;
      handlePagination(direction);
    });
  });
}

// 处理搜索
function handleSearch(e) {
  state.filters.search = e.target.value.toLowerCase();
  state.pagination.currentPage = 1;
  filterStudents();
}

// 处理过滤器变化
function handleFilterChange(e) {
  const { id, value } = e.target;
  const filterType = id.split("-")[0];
  state.filters[filterType] = value;
  state.pagination.currentPage = 1;
  filterStudents();
}

// 过滤学生
function filterStudents() {
  const { search, level, status } = state.filters;

  state.students = MOCK_STUDENTS.filter((student) => {
    const searchMatch =
      search === "" ||
      student.firstName.toLowerCase().includes(search) ||
      student.lastName.toLowerCase().includes(search) ||
      student.email.toLowerCase().includes(search);
    const levelMatch = level === "all" || student.level === level;
    const statusMatch = status === "all" || student.status === status;
    return searchMatch && levelMatch && statusMatch;
  });

  state.pagination.totalPages = Math.ceil(
    state.students.length / state.pagination.itemsPerPage
  );
  renderStudents();
  updateTableInfo();
  renderPagination();
}

// 处理全选
function handleSelectAll(e) {
  const isChecked = e.target.checked;
  const checkboxes = document.querySelectorAll("tbody input[type='checkbox']");

  checkboxes.forEach((checkbox) => {
    checkbox.checked = isChecked;
    const studentId = parseInt(checkbox.dataset.studentId);
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
  const studentId = parseInt(checkbox.dataset.studentId);

  if (checkbox.checked) {
    state.selectedStudents.add(studentId);
  } else {
    state.selectedStudents.delete(studentId);
    document.getElementById("select-all").checked = false;
  }
}

// 渲染学生列表
function renderStudents() {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  const start =
    (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
  const end = start + state.pagination.itemsPerPage;
  const paginatedStudents = state.students.slice(start, end);

  tbody.innerHTML = paginatedStudents
    .map(
      (student) => `
    <tr>
      <td>
        <input type="checkbox" data-student-id="${student.id}" 
               ${state.selectedStudents.has(student.id) ? "checked" : ""}>
      </td>
      <td>
        <div class="student-name">
          <div class="student-avatar">
            ${student.firstName[0]}${student.lastName[0]}
          </div>
          <div>
            ${student.firstName} ${student.lastName}
          </div>
        </div>
      </td>
      <td>${student.email}</td>
      <td>${getLevelText(student.level)}</td>
      <td>
        <div class="student-courses">
          ${student.courses
            .map(
              (course) => `
            <span class="course-badge">${course.name}</span>
          `
            )
            .join("")}
        </div>
      </td>
      <td class="progress-cell">
        <div class="progress-bar">
          <div class="progress" style="width: ${student.progress}%"></div>
        </div>
      </td>
      <td>
        <span class="status-badge status-${student.status}">
          ${getStatusText(student.status)}
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
  `
    )
    .join("");

  // 添加复选框事件监听
  const checkboxes = tbody.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", handleStudentSelect);
  });
}

// 更新表格信息
function updateTableInfo() {
  const showingCount = document.querySelector(".showing-count");
  const totalCount = document.querySelector(".total-count");

  if (showingCount && totalCount) {
    const start =
      (state.pagination.currentPage - 1) * state.pagination.itemsPerPage;
    const end = Math.min(
      start + state.pagination.itemsPerPage,
      state.students.length
    );
    showingCount.textContent = `${start + 1}-${end}`;
    totalCount.textContent = state.students.length;
  }
}

// 渲染分页
function renderPagination() {
  const paginationNumbers = document.querySelector(".pagination-numbers");
  if (!paginationNumbers) return;

  let pages = "";
  for (let i = 1; i <= state.pagination.totalPages; i++) {
    pages += `
      <div class="page-number ${
        i === state.pagination.currentPage ? "active" : ""
      }" 
           data-page="${i}">
        ${i}
      </div>
    `;
  }
  paginationNumbers.innerHTML = pages;

  // 添加页码点击事件
  const pageNumbers = document.querySelectorAll(".page-number");
  pageNumbers.forEach((number) => {
    number.addEventListener("click", (e) => {
      const page = parseInt(e.target.dataset.page);
      state.pagination.currentPage = page;
      renderStudents();
      updateTableInfo();
      renderPagination();
    });
  });
}

// 处理分页导航
function handlePagination(direction) {
  if (direction === "prev" && state.pagination.currentPage > 1) {
    state.pagination.currentPage--;
  } else if (
    direction === "next" &&
    state.pagination.currentPage < state.pagination.totalPages
  ) {
    state.pagination.currentPage++;
  }
  renderStudents();
  updateTableInfo();
  renderPagination();
}

// 打开模态框
function openModal(student = null) {
  const modal = document.getElementById("student-modal");
  const form = document.getElementById("student-form");
  const modalTitle = modal.querySelector(".modal-header h3");

  if (student) {
    modalTitle.textContent = "Modifier l'Étudiant";
    form.firstName.value = student.firstName;
    form.lastName.value = student.lastName;
    form.email.value = student.email;
    form.level.value = student.level;
    form.birthDate.value = student.birthDate;
    form.phone.value = student.phone;
    form.address.value = student.address;
    form.dataset.studentId = student.id;
  } else {
    modalTitle.textContent = "Ajouter un Étudiant";
    form.reset();
    delete form.dataset.studentId;
  }

  modal.style.display = "block";
}

// 关闭模态框
function closeModal() {
  const modal = document.getElementById("student-modal");
  modal.style.display = "none";
}

// 处理保存学生
function handleSaveStudent(e) {
  e.preventDefault();
  const form = document.getElementById("student-form");
  const studentId = form.dataset.studentId;

  const studentData = {
    firstName: form.firstName.value,
    lastName: form.lastName.value,
    email: form.email.value,
    level: form.level.value,
    birthDate: form.birthDate.value,
    phone: form.phone.value,
    address: form.address.value,
    courses: [],
    progress: 0,
    status: "active",
  };

  if (studentId) {
    // 更新现有学生
    const index = state.students.findIndex((s) => s.id === parseInt(studentId));
    if (index !== -1) {
      state.students[index] = { ...state.students[index], ...studentData };
    }
  } else {
    // 添加新学生
    const newStudent = {
      id: state.students.length + 1,
      ...studentData,
    };
    state.students.unshift(newStudent);
  }

  closeModal();
  renderStudents();
  updateTableInfo();
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
  const student = state.students.find((s) => s.id === studentId);
  if (student) {
    openModal(student);
  }
}

// 处理查看学生
function handleViewStudent(studentId) {
  const student = state.students.find((s) => s.id === studentId);
  if (student) {
    console.log("查看学生详情:", student);
    // TODO: 实现查看详情功能
  }
}

// 处理删除学生
function handleDeleteStudent(studentId) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) {
    const index = state.students.findIndex((s) => s.id === studentId);
    if (index !== -1) {
      state.students.splice(index, 1);
      renderStudents();
      updateTableInfo();
    }
  }
}

// 辅助函数
function getLevelText(level) {
  const levelMap = {
    l1: "Licence 1",
    l2: "Licence 2",
    l3: "Licence 3",
    m1: "Master 1",
    m2: "Master 2",
  };
  return levelMap[level] || level;
}

function getStatusText(status) {
  const statusMap = {
    active: "Actif",
    inactive: "Inactif",
  };
  return statusMap[status] || status;
}

// 导出初始化函数
export { initialize };
