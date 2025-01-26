// 模拟学生数据
const MOCK_STUDENTS = [
  {
    id: 1,
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie.martin@estia.fr",
    level: "L3",
    birthDate: "1999-05-15",
    phone: "+33 6 12 34 56 78",
    address: "123 Rue de l'Innovation, Bidart",
    courses: ["Mathématiques", "Physique", "Informatique"],
    progress: 85,
    status: "active",
  },
  {
    id: 2,
    firstName: "Lucas",
    lastName: "Bernard",
    email: "lucas.bernard@estia.fr",
    level: "M1",
    birthDate: "1998-09-23",
    phone: "+33 6 23 45 67 89",
    address: "456 Avenue des Sciences, Bidart",
    courses: ["Mécanique", "Électronique", "Programmation"],
    progress: 92,
    status: "active",
  },
  {
    id: 3,
    firstName: "Emma",
    lastName: "Dubois",
    email: "emma.dubois@estia.fr",
    level: "L2",
    birthDate: "2000-03-10",
    phone: "+33 6 34 56 78 90",
    address: "789 Boulevard de la Technologie, Bidart",
    courses: ["Chimie", "Physique", "Mathématiques"],
    progress: 78,
    status: "active",
  },
  {
    id: 4,
    firstName: "Thomas",
    lastName: "Petit",
    email: "thomas.petit@estia.fr",
    level: "M2",
    birthDate: "1997-11-30",
    phone: "+33 6 45 67 89 01",
    address: "321 Rue de la Recherche, Bidart",
    courses: ["Intelligence Artificielle", "Big Data", "Cloud Computing"],
    progress: 95,
    status: "inactive",
  },
  {
    id: 5,
    firstName: "Léa",
    lastName: "Roux",
    email: "lea.roux@estia.fr",
    level: "L1",
    birthDate: "2001-07-20",
    phone: "+33 6 56 78 90 12",
    address: "654 Avenue de l'Ingénierie, Bidart",
    courses: ["Introduction aux Sciences", "Anglais", "Communication"],
    progress: 88,
    status: "active",
  },
];

// 状态管理
let state = {
  students: [...MOCK_STUDENTS],
  filters: {
    level: "all",
    status: "all",
  },
  selectedStudents: new Set(),
};

// 初始化函数
export function initialize() {
  console.log("Initializing student management page...");
  initializeStudentList();
  setupEventListeners();
}

// 初始化学生列表
function initializeStudentList() {
  const studentsContent = document.querySelector(".students-content");
  if (!studentsContent) {
    console.error("Students content container not found!");
    return;
  }

  studentsContent.innerHTML = `
    <div class="students-header">
      <h2>Gestion des Étudiants</h2>
      <div class="header-actions">
        <button class="import-btn"><i class="fas fa-file-import"></i> Importer</button>
        <button class="export-btn"><i class="fas fa-file-export"></i> Exporter</button>
        <button class="add-student-btn"><i class="fas fa-plus"></i> Ajouter un Étudiant</button>
      </div>
    </div>

    <div class="filters">
      <div class="filter-group">
        <label>Niveau:</label>
        <select id="level-filter">
          <option value="all">Tous les niveaux</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="M1">M1</option>
          <option value="M2">M2</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Statut:</label>
        <select id="status-filter">
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>
    </div>

    <div class="students-table">
      <table>
        <thead>
          <tr>
            <th>
              <input type="checkbox" id="select-all-students">
            </th>
            <th>Nom</th>
            <th>Email</th>
            <th>Niveau</th>
            <th>Cours</th>
            <th>Progression</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="students-list">
          ${renderStudentRows()}
        </tbody>
      </table>
    </div>
  `;
}

// 渲染学生行
function renderStudentRows() {
  return state.students
    .filter((student) => {
      const levelMatch =
        state.filters.level === "all" || student.level === state.filters.level;
      const statusMatch =
        state.filters.status === "all" ||
        student.status === state.filters.status;
      return levelMatch && statusMatch;
    })
    .map(
      (student) => `
      <tr data-id="${student.id}" class="${
        student.status === "inactive" ? "inactive" : ""
      }">
        <td>
          <input type="checkbox" class="student-select" 
            ${state.selectedStudents.has(student.id) ? "checked" : ""}>
        </td>
        <td>
          <div class="student-name">
            ${student.firstName} ${student.lastName}
          </div>
        </td>
        <td>${student.email}</td>
        <td>${student.level}</td>
        <td>
          <div class="courses-list">
            ${student.courses.slice(0, 2).join(", ")}
            ${student.courses.length > 2 ? "..." : ""}
          </div>
        </td>
        <td>
          <div class="progress-bar">
            <div class="progress" style="width: ${student.progress}%"></div>
            <span>${student.progress}%</span>
          </div>
        </td>
        <td>
          <span class="status-badge ${student.status}">
            ${student.status === "active" ? "Actif" : "Inactif"}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="edit-btn" title="Modifier">
              <i class="fas fa-edit"></i>
            </button>
            <button class="view-btn" title="Voir détails">
              <i class="fas fa-eye"></i>
            </button>
            <button class="delete-btn" title="Supprimer">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");
}

// 设置事件监听器
function setupEventListeners() {
  // 筛选器变化事件
  const levelFilter = document.getElementById("level-filter");
  const statusFilter = document.getElementById("status-filter");

  if (levelFilter) {
    levelFilter.addEventListener("change", (e) => {
      state.filters.level = e.target.value;
      updateStudentList();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      state.filters.status = e.target.value;
      updateStudentList();
    });
  }

  // 全选复选框
  const selectAllCheckbox = document.getElementById("select-all-students");
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(".student-select");
      checkboxes.forEach((checkbox) => {
        checkbox.checked = e.target.checked;
        const studentId = parseInt(checkbox.closest("tr").dataset.id);
        if (e.target.checked) {
          state.selectedStudents.add(studentId);
        } else {
          state.selectedStudents.delete(studentId);
        }
      });
    });
  }

  // 添加学生按钮
  const addButton = document.querySelector(".add-student-btn");
  if (addButton) {
    addButton.addEventListener("click", () => {
      openStudentModal();
    });
  }

  // 导入导出按钮
  const importBtn = document.querySelector(".import-btn");
  const exportBtn = document.querySelector(".export-btn");

  if (importBtn) {
    importBtn.addEventListener("click", handleImport);
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", handleExport);
  }

  // 学生行操作按钮
  document.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const row = target.closest("tr");
    if (!row) return;

    const studentId = parseInt(row.dataset.id);
    const student = state.students.find((s) => s.id === studentId);

    if (target.classList.contains("edit-btn")) {
      openStudentModal(student);
    } else if (target.classList.contains("view-btn")) {
      showStudentDetails(student);
    } else if (target.classList.contains("delete-btn")) {
      confirmDeleteStudent(student);
    }
  });

  // 学生选择复选框
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("student-select")) {
      const row = e.target.closest("tr");
      const studentId = parseInt(row.dataset.id);
      if (e.target.checked) {
        state.selectedStudents.add(studentId);
      } else {
        state.selectedStudents.delete(studentId);
      }
    }
  });
}

// 更新学生列表
function updateStudentList() {
  const tbody = document.getElementById("students-list");
  if (tbody) {
    tbody.innerHTML = renderStudentRows();
  }
}

// 打开学生模态框
function openStudentModal(student = null) {
  const isEdit = !!student;
  const title = isEdit ? "Modifier l'étudiant" : "Ajouter un étudiant";
  const modalHtml = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <form id="student-form">
          <div class="form-group">
            <label>Prénom</label>
            <input type="text" name="firstName" value="${
              student?.firstName || ""
            }" required>
          </div>
          <div class="form-group">
            <label>Nom</label>
            <input type="text" name="lastName" value="${
              student?.lastName || ""
            }" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" value="${
              student?.email || ""
            }" required>
          </div>
          <div class="form-group">
            <label>Niveau</label>
            <select name="level" required>
              <option value="L1" ${
                student?.level === "L1" ? "selected" : ""
              }>L1</option>
              <option value="L2" ${
                student?.level === "L2" ? "selected" : ""
              }>L2</option>
              <option value="L3" ${
                student?.level === "L3" ? "selected" : ""
              }>L3</option>
              <option value="M1" ${
                student?.level === "M1" ? "selected" : ""
              }>M1</option>
              <option value="M2" ${
                student?.level === "M2" ? "selected" : ""
              }>M2</option>
            </select>
          </div>
          <div class="form-group">
            <label>Date de naissance</label>
            <input type="date" name="birthDate" value="${
              student?.birthDate || ""
            }" required>
          </div>
          <div class="form-group">
            <label>Téléphone</label>
            <input type="tel" name="phone" value="${student?.phone || ""}">
          </div>
          <div class="form-group">
            <label>Adresse</label>
            <input type="text" name="address" value="${student?.address || ""}">
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select name="status" required>
              <option value="active" ${
                student?.status === "active" ? "selected" : ""
              }>Actif</option>
              <option value="inactive" ${
                student?.status === "inactive" ? "selected" : ""
              }>Inactif</option>
            </select>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="cancel-btn">Annuler</button>
        <button class="save-btn">${isEdit ? "Enregistrer" : "Ajouter"}</button>
      </div>
    </div>
  `;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = modalHtml;
  document.body.appendChild(modal);

  // 添加事件监听器
  const closeBtn = modal.querySelector(".close-modal");
  const cancelBtn = modal.querySelector(".cancel-btn");
  const saveBtn = modal.querySelector(".save-btn");
  const form = modal.querySelector("#student-form");

  closeBtn.addEventListener("click", () => modal.remove());
  cancelBtn.addEventListener("click", () => modal.remove());

  saveBtn.addEventListener("click", () => {
    if (form.checkValidity()) {
      const formData = new FormData(form);
      const studentData = {
        id: student?.id || state.students.length + 1,
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        level: formData.get("level"),
        birthDate: formData.get("birthDate"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        status: formData.get("status"),
        courses: student?.courses || [],
        progress: student?.progress || 0,
      };

      if (isEdit) {
        const index = state.students.findIndex((s) => s.id === student.id);
        state.students[index] = studentData;
      } else {
        state.students.push(studentData);
      }

      updateStudentList();
      modal.remove();
    } else {
      form.reportValidity();
    }
  });
}

// 显示学生详情
function showStudentDetails(student) {
  const modalHtml = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Détails de l'étudiant</h3>
        <button class="close-modal">&times;</button>
      </div>
      <div class="modal-body">
        <div class="student-details">
          <div class="detail-group">
            <label>Nom complet</label>
            <p>${student.firstName} ${student.lastName}</p>
          </div>
          <div class="detail-group">
            <label>Email</label>
            <p>${student.email}</p>
          </div>
          <div class="detail-group">
            <label>Niveau</label>
            <p>${student.level}</p>
          </div>
          <div class="detail-group">
            <label>Date de naissance</label>
            <p>${new Date(student.birthDate).toLocaleDateString()}</p>
          </div>
          <div class="detail-group">
            <label>Téléphone</label>
            <p>${student.phone}</p>
          </div>
          <div class="detail-group">
            <label>Adresse</label>
            <p>${student.address}</p>
          </div>
          <div class="detail-group">
            <label>Cours</label>
            <p>${student.courses.join(", ")}</p>
          </div>
          <div class="detail-group">
            <label>Progression</label>
            <div class="progress-bar">
              <div class="progress" style="width: ${student.progress}%"></div>
              <span>${student.progress}%</span>
            </div>
          </div>
          <div class="detail-group">
            <label>Statut</label>
            <span class="status-badge ${student.status}">
              ${student.status === "active" ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="close-btn">Fermer</button>
      </div>
    </div>
  `;

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = modalHtml;
  document.body.appendChild(modal);

  const closeButtons = modal.querySelectorAll(".close-modal, .close-btn");
  closeButtons.forEach((button) => {
    button.addEventListener("click", () => modal.remove());
  });
}

// 确认删除学生
function confirmDeleteStudent(student) {
  if (
    confirm(
      `Êtes-vous sûr de vouloir supprimer l'étudiant ${student.firstName} ${student.lastName} ?`
    )
  ) {
    state.students = state.students.filter((s) => s.id !== student.id);
    state.selectedStudents.delete(student.id);
    updateStudentList();
  }
}

// 处理导入
function handleImport() {
  alert("Fonctionnalité d'import en cours de développement");
}

// 处理导出
function handleExport() {
  const selectedStudents = state.students.filter((student) =>
    state.selectedStudents.has(student.id)
  );

  const dataToExport =
    selectedStudents.length > 0 ? selectedStudents : state.students;

  const csvContent = [
    ["ID", "Prénom", "Nom", "Email", "Niveau", "Statut", "Progression"],
    ...dataToExport.map((student) => [
      student.id,
      student.firstName,
      student.lastName,
      student.email,
      student.level,
      student.status,
      student.progress + "%",
    ]),
  ]
    .map((row) => row.join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "students_export.csv";
  link.click();
}
