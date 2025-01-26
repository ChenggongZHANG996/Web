import { baseUrl } from "../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";
import { profileService } from "../services/1_profil.js";
import { specialtyService } from "/Web/App_Professeur/JS/services/specialty_service.js";

// 模拟用户数据
const MOCK_USER = {
  firstName: "Jean",
  lastName: "Dupont",
  title: "Professeur de Mathématiques",
  email: "jean.dupont@estia.fr",
  phone: "+33 6 12 34 56 78",
  address: "ESTIA, Bidart, France",
  specialties: ["Mathématiques", "Physique", "Informatique"],
  stats: {
    activeStudents: 156,
    activeCourses: 8,
    teachingHours: 324,
    studentSuccess: 85,
    studentSatisfaction: 92,
    studentEngagement: 78,
  },
  recentActivity: [
    {
      type: "course",
      icon: "book",
      text: 'Nouveau cours créé: "Introduction à la Physique"',
      time: "Il y a 2 heures",
    },
    {
      type: "student",
      icon: "user-graduate",
      text: "5 nouveaux étudiants inscrits au cours de Mathématiques",
      time: "Il y a 1 jour",
    },
    {
      type: "update",
      icon: "tasks",
      text: "Mise à jour du programme de Chimie Avancée",
      time: "Il y a 3 jours",
    },
  ],
};

// 预定义的专业列表
const AVAILABLE_SPECIALTIES = [
  "Mathématiques",
  "Physique",
  "Chimie",
  "Informatique",
  "Biologie",
  "Sciences de l'ingénieur",
  "Électronique",
  "Mécanique",
  "Automatique",
  "Robotique",
];

// 初始化页面元素
async function initializeProfileElements() {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      console.warn("No user session found");
      return;
    }

    const professorId = userSession.user.id;
    const professorInfo = await profileService.getProfileInfo(professorId);

    // 更新个人信息部分
    const profileContent = document.querySelector(".profile-content");
    if (!profileContent) {
      console.error("Profile content container not found");
      return;
    }

    const { fullName, email, phone, address } = professorInfo;

    profileContent.innerHTML = `
      <div class="profile-info-section">
        <div class="info-group">
          <h3>Informations Professionnelles</h3>
          <div class="info-content">
            <div class="info-item">
              <i class="fas fa-user"></i>
              <div class="info-text">
                <span class="label">Nom</span>
                <span class="value">${fullName}</span>
              </div>
            </div>
            <div class="info-item">
              <i class="fas fa-graduation-cap"></i>
              <div class="info-text">
                <span class="label">Titre</span>
                <span class="value">Professeur de mathématiques</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 使用新的专业部分结构 -->
        ${await initializeSpecialtiesSection()}

        <div class="info-group">
          <h3>Contact</h3>
          <div class="contact-info">
            <div class="info-item">
              <i class="fas fa-envelope"></i>
              <span>${email}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-phone"></i>
              <span>${phone || "+33 6 12 34 56 78"}</span>
            </div>
            <div class="info-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${address}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-stats-section">
        <div class="performance-metrics">
          <div class="metrics-container">
            <div class="metric-row">
              <span class="metric-title">Réussite des étudiants</span>
              <div class="metric-info">
                <div class="progress-bar">
                  <div class="progress" style="width: ${
                    MOCK_USER.stats.studentSuccess
                  }%"></div>
                </div>
                <span class="metric-value">${
                  MOCK_USER.stats.studentSuccess
                }%</span>
              </div>
            </div>
            <div class="metric-row">
              <span class="metric-title">Satisfaction des étudiants</span>
              <div class="metric-info">
                <div class="progress-bar">
                  <div class="progress" style="width: ${
                    MOCK_USER.stats.studentSatisfaction
                  }%"></div>
                </div>
                <span class="metric-value">${
                  MOCK_USER.stats.studentSatisfaction
                }%</span>
              </div>
            </div>
            <div class="metric-row">
              <span class="metric-title">Engagement des étudiants</span>
              <div class="metric-info">
                <div class="progress-bar">
                  <div class="progress" style="width: ${
                    MOCK_USER.stats.studentEngagement
                  }%"></div>
                </div>
                <span class="metric-value">${
                  MOCK_USER.stats.studentEngagement
                }%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="recent-activity">
          <h3>Activité récente</h3>
          <div class="activity-list">
            ${MOCK_USER.recentActivity
              .map(
                (activity) => `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas fa-${activity.icon}"></i>
                </div>
                <div class="activity-details">
                  <p>${activity.text}</p>
                  <span>${activity.time}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      </div>
    `;

    // 设置事件监听器
    setupEventListeners();
  } catch (error) {
    console.error("Failed to initialize profile elements:", error);
  }
}

// 设置事件监听器
function setupEventListeners() {
  console.log("Setting up event listeners...");

  // 为所有专业标签添加点击事件
  document.querySelectorAll(".specialty-tag").forEach((tag) => {
    if (!tag.querySelector(".delete-specialty")) {
      const deleteBtn = document.createElement("div");
      deleteBtn.className = "delete-specialty";
      tag.appendChild(deleteBtn);
    }

    // 设置删除按钮的事件监听
    const deleteBtn = tag.querySelector(".delete-specialty");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const specialtyName = tag
          .querySelector(".specialty-name")
          .textContent.trim();
        removeSpecialty(specialtyName);
      });
    }
  });

  // 设置专业相关的事件
  setupSpecialtyEvents();

  console.log("Event listeners setup complete!");
}

// 添加专业相关的事件处理
function setupSpecialtyEvents() {
  const addBtn = document.querySelector(".add-specialty-btn");
  const dropdown = document.querySelector(".specialty-dropdown");
  const specialtyOptions = document.querySelectorAll(".specialty-option");

  if (!addBtn || !dropdown) {
    console.error("Required elements not found");
    return;
  }

  // 处理点击外部关闭下拉菜单
  function handleOutsideClick(e) {
    if (
      !e.target.closest(".specialty-dropdown") &&
      !e.target.closest(".add-specialty-btn")
    ) {
      dropdown.classList.remove("active");
    }
  }

  // 添加按钮点击事件
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("active");
  });

  // 选项点击事件
  specialtyOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const specialty = option.dataset.specialty;
      if (specialty) {
        addSpecialty(specialty);
        dropdown.classList.remove("active");
      }
    });
  });

  // 添加点击外部关闭下拉菜单的事件
  document.addEventListener("click", handleOutsideClick);
}

// 添加加载真实数据的函数
async function loadRealProfileData() {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      console.warn("No user session found");
      return;
    }

    const professorId = userSession.user.id;
    const professorInfo = await profileService.getProfileInfo(professorId);

    // 更新姓名显示
    const nameValueElement = document.querySelector(
      ".info-content .info-item .info-text .value"
    );
    if (nameValueElement) {
      nameValueElement.textContent = professorInfo.fullName;
    }

    // 更新联系信息
    // 1. 更新邮箱
    const emailElement = document.querySelector(
      ".contact-info .info-item:nth-child(1) span"
    );
    if (emailElement) {
      emailElement.textContent = professorInfo.email;
    }

    // 2. 更新电话
    const phoneElement = document.querySelector(
      ".contact-info .info-item:nth-child(2) span"
    );
    if (phoneElement) {
      phoneElement.textContent = professorInfo.phone;
    }

    // 3. 更新地址
    const addressElement = document.querySelector(
      ".contact-info .info-item:nth-child(3) span"
    );
    if (addressElement) {
      addressElement.textContent = professorInfo.address;
    }
  } catch (error) {
    console.error("Failed to load real profile data:", error);
  }
}

// 添加加载专业的函数
async function loadSpecialties() {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) return;

    const specialties = await specialtyService.getSpecialties(
      userSession.user.id
    );
    const specialtiesContainer = document.querySelector(".specialties");
    if (specialtiesContainer) {
      // 保存添加按钮
      const addButton =
        specialtiesContainer.querySelector(".add-specialty-btn");
      specialtiesContainer.innerHTML = "";

      // 添加专业标签
      specialties.forEach((specialty) => {
        const tag = document.createElement("span");
        tag.className = "specialty-tag";
        tag.textContent = specialty;
        const deleteBtn = document.createElement("div");
        deleteBtn.className = "delete-specialty";
        tag.appendChild(deleteBtn);
        specialtiesContainer.appendChild(tag);
        setupDeleteSpecialtyListener(tag);
      });

      // 重新添加添加按钮
      if (addButton) {
        specialtiesContainer.appendChild(addButton);
      }
    }
  } catch (error) {
    console.error("Failed to load specialties:", error);
  }
}

// 添加地址定位功能
async function updateLocation() {
  try {
    // 首先检查浏览器是否支持地理定位
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    // 获取当前位置
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      });
    });

    const { latitude, longitude } = position.coords;

    // 使用 Google Maps Geocoding API 将坐标转换为地址
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=YOUR_GOOGLE_MAPS_API_KEY`
    );

    const data = await response.json();
    if (data.results && data.results[0]) {
      const address = data.results[0].formatted_address;

      // 更新数据库中的地址
      const userSession = JSON.parse(localStorage.getItem("user_session"));
      if (userSession && userSession.user) {
        await profileService.updateAddress(userSession.user.id, address);
      }

      // 更新界面显示
      const addressElement = document.querySelector(
        ".contact-info .info-item:nth-child(3) span"
      );
      if (addressElement) {
        addressElement.textContent = address;
      }
    }
  } catch (error) {
    console.error("Error updating location:", error);
    alert("Failed to update location. Please try again.");
  }
}

// 修改地址元素，添加定位按钮
function addLocationButton() {
  const addressContainer = document.querySelector(
    ".contact-info .info-item:nth-child(3)"
  );
  if (addressContainer) {
    // 移除所有现有的箭头
    const existingArrows = addressContainer.querySelectorAll(".location-btn");
    existingArrows.forEach((arrow) => arrow.remove());

    // 只添加一个定位按钮
    const locationBtn = document.createElement("button");
    locationBtn.className = "location-btn";
    locationBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    locationBtn.title = "Mettre à jour la localisation";

    // 添加点击事件
    locationBtn.addEventListener("click", updateLocation);

    addressContainer.appendChild(locationBtn);
  }
}

// 修改初始化专业部分的函数
async function initializeSpecialtiesSection() {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      console.warn("No user session found");
      return "";
    }

    // 从数据库加载专业
    const specialties = await specialtyService.getSpecialties(
      userSession.user.id
    );
    console.log("Loaded specialties from database:", specialties);

    const specialtiesHtml = `
      <div class="specialties-section">
        <div class="specialties-header">
          <h3>Spécialités</h3>
          <div style="position: relative;">
            <button class="add-specialty-btn" title="Ajouter une spécialité">
              <i class="fas fa-plus"></i>
            </button>
            <div class="specialty-dropdown">
              <div class="dropdown-header">
                Choisir une spécialité
                ${AVAILABLE_SPECIALTIES.map(
                  (specialty) => `
                  <div class="specialty-option" data-specialty="${specialty}">
                    <span>${specialty}</span>
                    <i class="fas fa-plus"></i>
                  </div>
                `
                ).join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="specialties-container">
          ${specialties
            .map(
              (specialty) => `
            <div class="specialty-tag">
              <span class="specialty-name">${specialty}</span>
              <button class="delete-specialty" title="Supprimer">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    return specialtiesHtml;
  } catch (error) {
    console.error("Error initializing specialties section:", error);
    return "";
  }
}

// 修改添加专业的函数
async function addSpecialty(specialtyName) {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      throw new Error("User session not found");
    }

    // 检查是否已经存在该专业
    const existingSpecialties = document.querySelectorAll(".specialty-tag");
    const alreadyExists = Array.from(existingSpecialties).some(
      (tag) =>
        tag.querySelector(".specialty-name")?.textContent.trim() ===
        specialtyName
    );

    if (alreadyExists) {
      alert("Cette spécialité existe déjà");
      return;
    }

    // 添加到数据库
    await specialtyService.addSpecialty(userSession.user.id, specialtyName);
    console.log("Specialty added to database:", specialtyName);

    // 添加到界面
    const specialtiesContainer = document.querySelector(
      ".specialties-container"
    );
    const specialtyTag = document.createElement("div");
    specialtyTag.className = "specialty-tag";
    specialtyTag.innerHTML = `
      <span class="specialty-name">${specialtyName}</span>
      <button class="delete-specialty" title="Supprimer">
        <i class="fas fa-times"></i>
      </button>
    `;
    specialtiesContainer.appendChild(specialtyTag);

    // 直接为新添加的标签设置删除事件
    const deleteBtn = specialtyTag.querySelector(".delete-specialty");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const specialtyToRemove = specialtyTag
          .querySelector(".specialty-name")
          .textContent.trim();
        removeSpecialty(specialtyToRemove);
      });
    }
  } catch (error) {
    console.error("Error adding specialty:", error);
    alert("Erreur lors de l'ajout de la spécialité");
  }
}

// 修改删除专业的函数
async function removeSpecialty(specialtyName) {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      throw new Error("User session not found");
    }

    // 从数据库中删除
    await specialtyService.removeSpecialty(userSession.user.id, specialtyName);
    console.log("Specialty removed from database:", specialtyName);

    // 从界面中删除
    const specialtyTag = Array.from(
      document.querySelectorAll(".specialty-tag")
    ).find(
      (tag) =>
        tag.querySelector(".specialty-name")?.textContent.trim() ===
        specialtyName
    );
    if (specialtyTag) {
      specialtyTag.remove();
    }
  } catch (error) {
    console.error("Error removing specialty:", error);
    alert("Erreur lors de la suppression de la spécialité");
  }
}

// 修改 customConfirm 函数
function customConfirm(message) {
  return new Promise((resolve) => {
    // 移除可能存在的旧对话框
    const existingDialog = document.querySelector(".confirm-dialog-container");
    if (existingDialog) {
      existingDialog.remove();
    }

    const dialogContainer = document.createElement("div");
    dialogContainer.className = "confirm-dialog-container"; // 添加类名以便识别
    dialogContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
      background: var(--bg-secondary);
      padding: 20px;
      border-radius: 8px;
      min-width: 300px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;

    const messageElement = document.createElement("p");
    messageElement.textContent = message;
    messageElement.style.cssText = `
      margin: 0 0 20px 0;
      color: var(--text-primary);
      font-size: 14px;
    `;

    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    `;

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "OK";
    confirmButton.style.cssText = `
      padding: 8px 16px;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Annuler";
    cancelButton.style.cssText = `
      padding: 8px 16px;
      background: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    // 简化的清理函数
    const cleanup = () => {
      dialogContainer.remove();
    };

    // 简化的响应处理
    const handleResponse = (value) => {
      cleanup();
      resolve(value);
    };

    // 简化的事件处理
    confirmButton.onclick = () => handleResponse(true);
    cancelButton.onclick = () => handleResponse(false);
    dialogContainer.onclick = (e) => {
      if (e.target === dialogContainer) {
        handleResponse(false);
      }
    };

    // ESC 键处理
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleResponse(false);
      }
    };
    document.addEventListener("keydown", handleEscape, { once: true });

    // 组装对话框
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    dialog.appendChild(messageElement);
    dialog.appendChild(buttonContainer);
    dialogContainer.appendChild(dialog);
    document.body.appendChild(dialogContainer);
  });
}

// 导出初始化函数
export function initialize() {
  console.log("Initializing profile page...");
  initializeProfileElements();
}
