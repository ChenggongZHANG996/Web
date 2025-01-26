import { baseUrl } from "../../Configuration_Js/base-url.js";
import { professorService } from "./services/Prof_index.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";
import { avatarService } from "./services/avatar-service.js";

// 全局变量
let currentUser = null;
let isLoading = false;
const pageModules = new Map(); // 存储已加载的页面模块

// 页面映射配置
const PAGE_CONFIG = {
  dashboard: {
    id: "0_table_board",
    title: "Tableau de bord",
    module: "../JS/0_table_board.js"
  },
  profile: {
    id: "1_profil",
    title: "Profil",
    module: "../JS/1_profil.js"
  },
  calendar: {
    id: "2_calendrier",
    title: "Calendrier",
    module: "../JS/2_calendrier.js"
  },
  courses: {
    id: "3_cours",
    title: "Cours",
    module: "../JS/3_cours.js"
  },
  students: {
    id: "4_gestion_etudiant",
    title: "Gestion des étudiants",
    module: "../JS/4_gestion_etudiant.js"
  }
};

// 页面路径映射
const PATH_MAPPINGS = {
  "tableau-de-bord": "dashboard",
  dashboard: "dashboard",
  profil: "profile",
  profile: "profile",
  calendar: "calendar",
  calendrier: "calendar",
  cours: "courses",
  courses: "courses",
  students: "students",
  etudiants: "students",
  "1_profil": "profile",
  "2_calendrier": "calendar",
  "3_cours": "courses",
  "4_gestion_etudiant": "students",
  "0_table_board": "dashboard",
};

// 模拟通知数据
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "course",
    title: "Nouveau cours",
    message: "Le cours de Mathématiques Avancées commence dans 1 heure",
    target: "courses",
    targetId: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false,
  },
  {
    id: 2,
    type: "student",
    title: "Nouvel étudiant",
    message: "3 nouveaux étudiants ont rejoint votre cours de Physique",
    target: "students",
    targetId: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
  },
  {
    id: 3,
    type: "calendar",
    title: "Rappel",
    message: "Réunion pédagogique demain à 14h",
    target: "calendar",
    targetId: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
  },
];

// 通知状态管理
const notificationState = {
  notifications: [
    {
      id: 1,
      type: "course",
      title: "Nouveau cours",
      message: "Le cours de Mathématiques Avancées commence dans 1 heure",
      target: "courses",
      targetId: "1",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
    },
    {
      id: 2,
      type: "student",
      title: "Nouvel étudiant",
      message: "3 nouveaux étudiants ont rejoint votre cours de Physique",
      target: "students",
      targetId: "2",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
    },
    {
      id: 3,
      type: "calendar",
      title: "Rappel",
      message: "Réunion pédagogique demain à 14h",
      target: "calendar",
      targetId: "3",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true,
    },
  ],
  unreadCount: 2,
};

// 更新未读数量
function updateUnreadCount() {
  notificationState.unreadCount = notificationState.notifications.filter(
    (n) => !n.read
  ).length;
  const badge = document.querySelector(".notification-badge");
  if (badge) {
    badge.textContent = notificationState.unreadCount || "";
    badge.style.display = notificationState.unreadCount ? "block" : "none";
  }
}

// 检查服务器连接
async function checkServerConnection() {
  console.group("服务器连接检查");
  console.log("%c🔍 正在检查服务器连接...", "color: #2196F3");

  try {
    const isConnected = await professorService.dbService.testConnection();
    if (isConnected) {
      console.log("%c✅ 服务器连接成功", "color: #4CAF50");
      return true;
    } else {
      throw new Error("连接测试失败");
    }
  } catch (error) {
    console.error("%c❌ 服务器连接失败:", "color: #f44336", error);
    return false;
  } finally {
    console.groupEnd();
  }
}

// 加载用户信息
async function loadUserProfile() {
  console.group("加载用户信息");
  console.log("%c🔍 开始加载用户信息...", "color: #2196F3");

  try {
    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      throw new Error("未找到用户ID");
    }

    const userData = await professorService.getProfessorProfile(userId);
    if (!userData) {
      throw new Error("未找到用户数据");
    }

    currentUser = userData;
    updateUIWithUserData(userData);
    console.log("%c✅ 用户信息加载成功", "color: #4CAF50", userData);
    return true;
  } catch (error) {
    console.error("%c❌ 加载用户信息失败:", "color: #f44336", error);
    return false;
  } finally {
    console.groupEnd();
  }
}

// 更新UI显示用户数据
function updateUIWithUserData(userData) {
  const nameElement = document.querySelector(".user-name");
  if (nameElement) {
    const fullName = `${userData.first_name || ""} ${
      userData.last_name || ""
    }`.trim();
    nameElement.textContent = fullName || "Utilisateur";
  }

  const avatarElement = document.querySelector(".user-avatar");
  if (avatarElement) {
    const avatarUrl = userData.avatar_url || "Image/default-avatar.png";
    avatarElement.src = avatarUrl;
  }
}

// 初始化事件监听器
function initializeEventListeners() {
  console.group("🔄 初始化事件监听器");

  // 导航链接点击事件
  const navLinks = document.querySelectorAll(".nav-links a");
  navLinks.forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("Navigation link clicked");

      // 获取目标页面名称
      const href = link.getAttribute("href");
      const pageName = href.replace("#", "");
      console.log("Target page:", pageName);

      try {
        // 获取页面配置
        const pageConfig = PAGE_CONFIG[pageName];
        if (!pageConfig) {
          throw new Error(`Invalid page name: ${pageName}`);
        }

        // 隐藏所有页面
        document.querySelectorAll(".page-content").forEach((content) => {
          content.classList.remove("active");
        });

        // 获取目标页面容器
        const targetPage = document.getElementById(pageConfig.id);
        if (!targetPage) {
          throw new Error(`Target page container not found: ${pageConfig.id}`);
        }

        // 如果页面内容为空，加载HTML
        if (!targetPage.children.length) {
          try {
            console.log("Loading HTML content for:", pageConfig.id);
            const response = await fetch(
              `/App_Professeur/HTML/${pageConfig.id}.html`
            );
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            targetPage.innerHTML = html;
            console.log("HTML content loaded successfully");
          } catch (error) {
            console.error("Failed to load HTML content:", error);
            throw error;
          }
        }

        // 加载并初始化页面模块
        await loadAndInitializePageModule(pageName);

        // 更新导航状态
        updateNavigationState(pageName);

        // 显示目标页面
        targetPage.classList.add("active");

        console.log("Page loaded successfully:", pageName);
      } catch (error) {
        console.error("Error loading page:", error);
      }
    });
  });

  // 设置按钮
  const settingsBtn = document.querySelector(".settings-btn");
  console.log("查找设置按钮:", settingsBtn ? "成功" : "失败");
  if (settingsBtn) {
    console.log("绑定设置按钮点击事件");
    settingsBtn.removeEventListener("click", handleSettings);
    settingsBtn.addEventListener("click", handleSettings);
  }

  // 通知按钮
  const notificationBtn = document.querySelector(".notification-btn");
  console.log("查找通知按钮:", notificationBtn ? "成功" : "失败");
  if (notificationBtn) {
    console.log("绑定通知按钮点击事件");
    notificationBtn.removeEventListener("click", handleNotifications);
    notificationBtn.addEventListener("click", handleNotifications);
  }

  // 点击外部关闭
  document.addEventListener("click", function (event) {
    const settingsDropdown = document.querySelector(".settings-dropdown");
    const notificationDropdown = document.querySelector(
      ".notification-dropdown"
    );

    if (
      !event.target.closest(".settings-btn") &&
      !event.target.closest(".settings-dropdown")
    ) {
      if (settingsDropdown?.classList.contains("active")) {
        console.log("点击外部: 关闭设置菜单");
        settingsDropdown.classList.remove("active");
      }
    }

    if (
      !event.target.closest(".notification-btn") &&
      !event.target.closest(".notification-dropdown")
    ) {
      if (notificationDropdown?.classList.contains("active")) {
        console.log("点击外部: 关闭通知菜单");
        notificationDropdown.classList.remove("active");
      }
    }
  });

  console.log("事件监听器初始化完成");
  console.groupEnd();
}

// 加载页面
async function loadPage(pageId) {
  if (isLoading) {
    console.log("%c⏳ 页面正在加载中，跳过:", "color: #FFC107", pageId);
    return;
  }

  console.group("加载页面");
  console.log("%c🔄 开始加载页面:", "color: #2196F3", pageId);
  isLoading = true;

  try {
    // 检查当前页面
    const currentActivePage = document.querySelector(".page-content.active");
    if (currentActivePage && currentActivePage.id === pageId) {
      console.log("%c✅ 页面已经激活:", "color: #4CAF50", pageId);
      return;
    }

    // 隐藏所有页面
    document.querySelectorAll(".page-content").forEach((content) => {
      content.classList.remove("active");
    });

    // 获取目标页面容器
    const targetPage = document.getElementById(pageId);
    if (!targetPage) {
      throw new Error("目标页面不存在");
    }

    // 如果页面内容为空，加载HTML
    if (!targetPage.children.length) {
      try {
        console.log("Loading HTML content for:", pageId);
        const response = await fetch(`../HTML/${pageId}.html`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        targetPage.innerHTML = html;
        console.log("HTML content loaded successfully");
      } catch (error) {
        console.error("Failed to load HTML content:", error);
        throw error;
      }
    }

    // 显示页面
    targetPage.classList.add("active");

    // 加载并初始化页面模块
    await loadAndInitializePageModule(pageId);

    console.log("%c✅ 页面加载完成:", "color: #4CAF50", pageId);
  } catch (error) {
    console.error("%c❌ 页面加载失败:", "color: #f44336", error);
  } finally {
    isLoading = false;
    console.groupEnd();
  }
}

// 修改加载并初始化页面模块函数
async function loadAndInitializePageModule(pageName) {
  console.log("Loading page module:", pageName);

  try {
    // 获取页面配置
    const pageConfig = PAGE_CONFIG[pageName];
    if (!pageConfig) {
      throw new Error(`Invalid page name: ${pageName}`);
    }

    // 获取目标页面容器
    const targetPage = document.getElementById(pageConfig.id);
    if (!targetPage) {
      throw new Error(`Target page container not found: ${pageConfig.id}`);
    }

    // 如果页面内容为空，加载HTML
    if (!targetPage.children.length) {
      try {
        console.log("Loading HTML content for:", pageConfig.id);
        const response = await fetch(`../HTML/${pageConfig.id}.html`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        targetPage.innerHTML = html;
        console.log("HTML content loaded successfully");
      } catch (error) {
        console.error("Failed to load HTML content:", error);
        throw error;
      }
    }

    // 检查模块是否已加载
    if (window.modules && window.modules[pageConfig.id]) {
      console.log("Module already loaded:", pageConfig.id);
      const module = window.modules[pageConfig.id];
      if (module.initialize) {
        await module.initialize();
        console.log("Module reinitialized");
      }
      return module;
    }

    // 加载新模块
    console.log("Importing module:", pageConfig.module);
    const module = await import(pageConfig.module);

    // 初始化模块
    if (module.initialize) {
      await module.initialize();
      console.log("Module initialized");
    }

    // 存储模块引用
    if (!window.modules) window.modules = {};
    window.modules[pageConfig.id] = module;

    console.log("Module loaded successfully:", pageConfig.id);
    return module;
  } catch (error) {
    console.error("Failed to load module:", error);
    throw error;
  }
}

// 处理头像上传
async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  console.log("%c📤 上传头像...", "color: #2196F3");
  try {
    const userId = sessionStorage.getItem("userId");
    const formData = new FormData();
    formData.append("avatar", file);

    const result = await professorService.uploadAvatar(userId, formData);
    if (result.avatar_url) {
      const profileImg = document.querySelector(".profile-img");
      profileImg.src = result.avatar_url;
      console.log("%c✅ 头像上传成功", "color: #4CAF50");
    }
  } catch (error) {
    console.error("%c❌ 头像上传失败:", "color: #f44336", error);
  }
}

// 处理通知
function handleNotifications(e) {
  console.group("🔔 通知按钮点击事件流程");
  console.log("事件类型:", e.type);
  console.log("事件目标:", e.target);
  e.preventDefault();
  e.stopPropagation();

  const notificationDropdown = document.querySelector(".notification-dropdown");
  const settingsDropdown = document.querySelector(".settings-dropdown");

  // 检查DOM元素是否存在
  console.log("DOM检查:");
  console.log("- 通知下拉菜单存在:", notificationDropdown ? "是" : "否");
  console.log("- 设置下拉菜单存在:", settingsDropdown ? "是" : "否");

  // 检查当前状态
  const notificationIsActive =
    notificationDropdown?.classList.contains("active");
  const settingsIsActive = settingsDropdown?.classList.contains("active");

  console.log("当前状态:");
  console.log("- 通知下拉菜单:", notificationIsActive ? "打开" : "关闭");
  console.log("- 设置下拉菜单:", settingsIsActive ? "打开" : "关闭");

  // 处理设置菜单
  if (settingsIsActive) {
    console.log("执行: 关闭设置菜单");
    settingsDropdown.classList.remove("active");
    console.log("设置菜单现在是: 关闭");
  }

  // 处理通知菜单
  if (notificationDropdown) {
    console.log("执行: 切换通知菜单");
    notificationDropdown.classList.toggle("active");
    const newState = notificationDropdown.classList.contains("active");
    console.log("通知菜单现在是:", newState ? "打开" : "关闭");

    if (newState) {
      console.log("执行: 渲染通知列表");
      renderNotifications();
      console.log("通知列表渲染完成");
    }
  }

  console.log("事件处理完成");
  console.groupEnd();
}

// 处理通知项点击
async function handleNotificationClick(target, targetId) {
  console.log("开始处理通知点击:", { target, targetId });

  try {
    // 1. 关闭通知菜单
    const notificationDropdown = document.querySelector(
      ".notification-dropdown"
    );
    if (notificationDropdown) {
      notificationDropdown.classList.remove("active");
      console.log("通知菜单已关闭");
    }

    // 2. 获取目标页面配置
    const pageConfig = PAGE_CONFIG[target];
    if (!pageConfig) {
      console.error("未找到目标页面配置:", target);
      return;
    }
    console.log("找到页面配置:", pageConfig);

    // 3. 加载目标页面模块
    try {
      await loadAndInitializePageModule(target);
      console.log("页面模块加载成功:", target);
    } catch (error) {
      console.error("页面模块加载失败:", error);
      return;
    }

    // 4. 更新导航状态
    updateNavigationState(target);
    console.log("导航状态已更新");

    // 5. 激活对应页面内容
    const pageContents = document.querySelectorAll(".page-content");
    pageContents.forEach((content) => content.classList.remove("active"));

    const targetPage = document.getElementById(pageConfig.id);
    if (targetPage) {
      targetPage.classList.add("active");
      console.log("目标页面已激活:", pageConfig.id);
    } else {
      console.error("未找到目标页面元素:", pageConfig.id);
    }

    // 6. 标记通知为已读
    markNotificationAsRead(targetId);
    console.log("通知已标记为已读");
  } catch (error) {
    console.error("通知点击处理失败:", error);
  }
}

// 修改渲染通知函数
function renderNotifications() {
  console.log("Rendering notifications...");
  const notificationList = document.querySelector(".notification-list");
  if (!notificationList) {
    console.error("Notification list container not found");
    return;
  }

  const notifications = notificationState.notifications;
  console.log("Notifications to render:", notifications);

  const notificationsHtml = notifications
    .map(
      (notification) => `
      <div class="notification-item ${notification.read ? "" : "unread"}" 
           onclick="window.handleNotificationClick('${notification.target}', '${
        notification.id
      }')">
        <div class="notification-icon ${notification.type}">
          <i class="fas ${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-time">${formatNotificationTime(
            notification.timestamp
          )}</div>
        </div>
        ${notification.read ? "" : '<div class="unread-dot"></div>'}
      </div>
    `
    )
    .join("");

  notificationList.innerHTML = notificationsHtml;
  console.log("Notifications rendered");
}

function getNotificationIcon(type) {
  const iconMap = {
    course: "fa-book",
    student: "fa-user-graduate",
    message: "fa-envelope",
    alert: "fa-exclamation-circle",
    success: "fa-check-circle",
  };
  return iconMap[type] || "fa-bell";
}

// 设置通知事件监听器
function setupNotificationEventListeners(dropdown) {
  // 标记所有为已读按钮
  const markAllReadBtn = dropdown.querySelector(".mark-all-read");
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      markAllNotificationsAsRead();
    });
  }

  // 通知项点击
  dropdown.querySelectorAll(".notification-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      handleNotificationItemClick(e, item);
    });
  });
}

// 处理通知项点击
async function handleNotificationItemClick(e) {
  e.preventDefault();
  e.stopPropagation();
  console.group("处理通知项点击");
  console.log("%c🔔 点击通知项", "color: #2196F3");

  try {
    const item = e.currentTarget;
    const notificationId = parseInt(item.dataset.id);
    const targetPage = item.dataset.target;
    const targetId = item.dataset.targetId;

    console.log("%c📍 目标信息:", "color: #2196F3", {
      notificationId,
      targetPage,
      targetId,
    });

    // 标记通知为已读
    markNotificationAsRead(notificationId);

    // 关闭通知下拉菜单
    const dropdown = document.querySelector(".notification-dropdown");
    if (dropdown) {
      dropdown.classList.remove("active");
    }

    // 导航到目标页面
    if (targetPage) {
      const mappedKey = PATH_MAPPINGS[targetPage.toLowerCase()];
      if (!mappedKey) {
        console.error("%c❌ 未找到页面映射:", "color: #f44336", targetPage);
        return;
      }

      // 加载目标页面
      await loadAndInitializePageModule(mappedKey);

      // 处理特定页面的详情显示
      if (targetId) {
        switch (mappedKey) {
          case "courses":
            if (window.modules["3_cours"]) {
              window.modules["3_cours"].openCourseDetails(targetId);
            }
            break;
          case "students":
            if (window.modules["4_gestion_etudiant"]) {
              window.modules["4_gestion_etudiant"].openStudentDetails(targetId);
            }
            break;
          case "calendar":
            if (window.modules["2_calendrier"]) {
              window.modules["2_calendrier"].showEvent(targetId);
            }
            break;
        }
      }
    }
  } catch (error) {
    console.error("%c❌ 处理通知项点击失败:", "color: #f44336", error);
  } finally {
    console.groupEnd();
  }
}

// 导航到通知目标
async function navigateToNotificationTarget(targetPage, targetId) {
  console.log("%c🔄 导航到目标页面", "color: #2196F3", {
    targetPage,
    targetId,
  });

  try {
    const mappedKey = PATH_MAPPINGS[targetPage.toLowerCase()];
    if (!mappedKey) {
      throw new Error(`未找到页面映射: ${targetPage}`);
    }

    // 加载目标页面
    await loadAndInitializePageModule(mappedKey);

    // 如果有目标ID，打开相应的详情
    if (targetId) {
      switch (mappedKey) {
        case "courses":
          openCourseDetails(targetId);
          break;
        case "students":
          openStudentDetails(targetId);
          break;
        case "calendar":
          // 处理日历事件
          const calendarModule = window.modules["2_calendrier"];
          if (calendarModule && calendarModule.showEvent) {
            calendarModule.showEvent(targetId);
          }
          break;
      }
    }
  } catch (error) {
    console.error("%c❌ 导航失败:", "color: #f44336", error);
  }
}

// 标记通知为已读
function markNotificationAsRead(notificationId) {
  const notification = notificationState.notifications.find(
    (n) => n.id === notificationId
  );
  if (notification && !notification.read) {
    notification.read = true;
    notificationState.unreadCount = notificationState.notifications.filter(
      (n) => !n.read
    ).length;
    updateNotificationBadge();
  }
}

// 标记所有通知为已读
function markAllNotificationsAsRead() {
  notificationState.notifications.forEach((n) => (n.read = true));
  notificationState.unreadCount = 0;
  updateNotificationBadge();
  renderNotifications(document.querySelector(".notification-dropdown"));
}

// 更新通知徽章
function updateNotificationBadge() {
  const badge = document.querySelector(".notification-badge");
  if (badge) {
    if (notificationState.unreadCount > 0) {
      badge.textContent = notificationState.unreadCount;
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  }
}

// 格式化通知时间
function formatNotificationTime(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `Il y a ${minutes} minute${minutes > 1 ? "s" : ""}`;
  } else if (hours < 24) {
    return `Il y a ${hours} heure${hours > 1 ? "s" : ""}`;
  } else {
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
  }
}

// 初始化通知
function initializeNotifications() {
  console.group("通知系统初始化");
  console.log("1. 开始初始化通知系统");

  try {
    // 设置通知按钮点击事件
    const notificationBtn = document.querySelector(".notification-btn");
    if (notificationBtn) {
      console.log("2. 找到通知按钮，添加事件监听器");
      notificationBtn.removeEventListener("click", handleNotifications);
      notificationBtn.addEventListener("click", handleNotifications);
    } else {
      console.warn("未找到通知按钮");
    }

    // 初始化通知徽章
    console.log("3. 初始化通知徽章");
    updateNotificationBadge();

    console.log("4. 通知系统初始化完成");
  } catch (error) {
    console.error("通知系统初始化失败:", error);
  }
  console.groupEnd();
}

// 处理搜索
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase();
  console.log("%c🔍 搜索:", "color: #2196F3", searchTerm);
  // 实现搜索逻辑
}

// 处理设置
function handleSettings(e) {
  console.group("⚙️ 设置按钮点击事件流程");
  console.log("事件类型:", e.type);
  console.log("事件目标:", e.target);
  e.preventDefault();
  e.stopPropagation();

  const settingsDropdown = document.querySelector(".settings-dropdown");
  const notificationDropdown = document.querySelector(".notification-dropdown");

  // 检查DOM元素是否存在
  console.log("DOM检查:");
  console.log("- 设置下拉菜单存在:", settingsDropdown ? "是" : "否");
  console.log("- 通知下拉菜单存在:", notificationDropdown ? "是" : "否");

  // 检查当前状态
  const settingsIsActive = settingsDropdown?.classList.contains("active");
  const notificationIsActive =
    notificationDropdown?.classList.contains("active");

  console.log("当前状态:");
  console.log("- 设置下拉菜单:", settingsIsActive ? "打开" : "关闭");
  console.log("- 通知下拉菜单:", notificationIsActive ? "打开" : "关闭");

  // 处理通知菜单
  if (notificationIsActive) {
    console.log("执行: 关闭通知菜单");
    notificationDropdown.classList.remove("active");
    console.log("通知菜单现在是: 关闭");
  }

  // 处理设置菜单
  if (settingsDropdown) {
    console.log("执行: 切换设置菜单");
    settingsDropdown.classList.toggle("active");
    const newState = settingsDropdown.classList.contains("active");
    console.log("设置菜单现在是:", newState ? "打开" : "关闭");
  }

  console.log("事件处理完成");
  console.groupEnd();
}

// 处理设置项点击
function handleSettingItemClick(e) {
  console.group("设置项点击处理");
  console.log("1. 触发设置项点击事件:", e.type);
  e.stopPropagation();

  const item = e.currentTarget;
  const text = item.querySelector("span").textContent;
  console.log("2. 点击的设置项:", text);

  // 根据不同设置项执行相应操作
  console.log("3. 执行对应操作");
  switch (text) {
    case "Langue":
      console.log("- 处理语言设置");
      handleLanguageChange();
      break;
    case "Thème":
      console.log("- 处理主题切换");
      document.body.classList.toggle("dark-mode");
      break;
    case "Préférences":
      console.log("- 处理偏好设置");
      handlePreferences();
      break;
    case "Déconnexion":
      console.log("- 处理登出");
      handleLogout(e);
      break;
  }

  // 关闭设置下拉菜单
  const dropdown = document.querySelector(".settings-dropdown");
  if (dropdown) {
    console.log("4. 关闭设置菜单");
    dropdown.classList.remove("active");
  }
  console.groupEnd();
}

// 处理语言变更
function handleLanguageChange() {
  // TODO: 实现语言切换功能
  console.log("Language change requested");
}

// 处理偏好设置
function handlePreferences() {
  // TODO: 实现偏好设置功能
  console.log("Preferences requested");
}

// 处理登出
async function handleLogout(e) {
  e.preventDefault();
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    window.location.href = "/Inscription/inscription.html";
  } catch (error) {
    console.error("Error during logout:", error);
  }
}

// 初始化函数
async function initialize() {
  try {
    // 检查用户会话
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      console.error("No user session found");
      window.location.href = "/Web/Inscription/inscription.html";
      return;
    }

    // 初始化事件监听器
    initializeEventListeners();

    // 初始化教师信息
    await initializeProfessorInfo();

    // 加载默认页面
    const defaultPage = "dashboard";
    await loadAndInitializePageModule(defaultPage);
    updateNavigationState(defaultPage);
  } catch (error) {
    console.error("Initialization failed:", error);
  }
}

// 修改教师信息初始化函数
async function initializeProfessorInfo() {
  try {
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    if (!userSession || !userSession.user) {
      console.error("No user session found");
      return;
    }

    const professorId = userSession.user.id;
    const professorInfo = await professorService.getProfessorProfile(
      professorId
    );

    if (professorInfo) {
      // 只更新教师姓名显示
      const teacherNameElement = document.querySelector(".teacher-name");
      if (teacherNameElement) {
        const fullName = `${professorInfo.first_name || ""} ${
          professorInfo.last_name || ""
        }`.trim();
        teacherNameElement.textContent = fullName || "Professeur";
      }
    }
  } catch (error) {
    console.error("Failed to initialize professor info:", error);
    // 如果出错，显示默认名称
    const teacherNameElement = document.querySelector(".teacher-name");
    if (teacherNameElement) {
      teacherNameElement.textContent = "Professeur";
    }
  }
}

// 确保在DOM加载完成后初始化
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, starting initialization...");
  initialize().catch((error) => {
    console.error("Fatal initialization error:", error);
  });
});

// 导出需要的函数
export {
  initialize,
  initializeProfessorInfo,
  loadAndInitializePageModule,
  openCourseDetails,
  openStudentDetails,
};

function openCourseDetails(courseId) {
  const courseModule = window.modules["cours"];
  if (courseModule && courseModule.openModal) {
    const course = courseModule.getCourseById(courseId);
    if (course) {
      courseModule.openModal(course);
    }
  }
}

function openStudentDetails(studentId) {
  const studentModule = window.modules["etudiants"];
  if (studentModule && studentModule.openModal) {
    const student = studentModule.getStudentById(studentId);
    if (student) {
      studentModule.openModal(student);
    }
  }
}

// 添加导入错误处理
window.addEventListener("error", function (e) {
  console.error("Script error:", e);
  if (e.error) {
    console.error("Error stack:", e.error.stack);
  }
});

// 更新导航状态
function updateNavigationState(pageName) {
  // 移除所有活动状态
  document.querySelectorAll(".nav-links li").forEach((item) => {
    item.classList.remove("active");
  });

  // 设置当前页面为活动状态
  const activeLink = document.querySelector(
    `.nav-links a[href="#${pageName}"]`
  );
  if (activeLink) {
    activeLink.parentElement.classList.add("active");
    console.log("Navigation updated");
  } else {
    console.error("Navigation link not found:", pageName);
  }
}

// 确保 handleNotificationClick 在全局可用
window.handleNotificationClick = handleNotificationClick;

// 修改激活页面内容的函数
function activatePageContent(pageId) {
  console.log("Activating page content:", pageId);

  // 隐藏所有页面
  document.querySelectorAll(".page-content").forEach((page) => {
    page.classList.remove("active");
    console.log("Deactivated page:", page.id);
  });

  // 显示目标页面
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active");
    console.log("Page activated:", pageId);

    // 检查页面内容
    if (!targetPage.children.length) {
      console.warn("Warning: Activated page has no content!");
    } else {
      console.log("Page content found");
    }
  } else {
    console.error("Target page not found:", pageId);
  }
}

// 监听页面加载事件
document.addEventListener("loadDashboard", async () => {
  const dashboardModule = await import("./0_table_board.js");
  dashboardModule.loadDashboard();
});

document.addEventListener("loadProfile", async () => {
  const profileModule = await import("./1_profil.js");
  profileModule.loadProfile();
});

document.addEventListener("loadCalendar", async (e) => {
  const calendarModule = await import("./2_calendrier.js");
  calendarModule.loadCalendar(e.detail?.eventId);
});

document.addEventListener("loadCourse", async (e) => {
  const courseModule = await import("../JS/3_cours.js");
  courseModule.loadCourse(e.detail?.courseId);
});

document.addEventListener("loadStudent", async (e) => {
  const studentModule = await import("../JS/4_gestion_etudiant.js");
  studentModule.loadStudent(e.detail?.studentId);
});
