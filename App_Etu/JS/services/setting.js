// 主题设置
const themes = {
  light: "light",
  dark: "dark",
  system: "system",
};

// 语言设置
const languages = {
  fr: "Français",
  en: "English",
  zh: "中文",
};

// 通知设置
const notificationSettings = {
  email: true,
  push: true,
  sound: true,
};

// 当前设置状态
let currentSettings = {
  theme: localStorage.getItem("theme") || themes.system,
  language: localStorage.getItem("language") || "fr",
  notifications: JSON.parse(localStorage.getItem("notificationSettings")) || {
    ...notificationSettings,
  },
};

// 初始化设置
export function initializeSettings() {
  console.group("初始化设置");
  console.log("%c⚙️ 开始初始化设置...", "color: #2196F3");

  try {
    // 加载保存的设置
    loadSettings();

    // 应用当前设置
    applyTheme(currentSettings.theme);
    applyLanguage(currentSettings.language);

    // 设置事件监听器
    setupSettingsListeners();

    console.log("%c✅ 设置初始化完成", "color: #4CAF50");
  } catch (error) {
    console.error("%c❌ 设置初始化失败:", "color: #f44336", error);
  } finally {
    console.groupEnd();
  }
}

// 加载保存的设置
function loadSettings() {
  const savedSettings = localStorage.getItem("settings");
  if (savedSettings) {
    currentSettings = { ...currentSettings, ...JSON.parse(savedSettings) };
  }
}

// 保存设置
function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(currentSettings));
}

// 设置事件监听器
function setupSettingsListeners() {
  // 主题设置
  document
    .querySelector('.settings-item[data-setting="theme"]')
    ?.addEventListener("click", () => {
      toggleThemeSelection();
    });

  // 语言设置
  document
    .querySelector('.settings-item[data-setting="language"]')
    ?.addEventListener("click", () => {
      toggleLanguageSelection();
    });

  // 通知设置
  document
    .querySelector('.settings-item[data-setting="notifications"]')
    ?.addEventListener("click", () => {
      openNotificationSettings();
    });

  // 隐私设置
  document
    .querySelector('.settings-item[data-setting="privacy"]')
    ?.addEventListener("click", () => {
      openPrivacySettings();
    });

  // 帮助
  document
    .querySelector('.settings-item[data-setting="help"]')
    ?.addEventListener("click", () => {
      openHelpCenter();
    });

  // 关于
  document
    .querySelector('.settings-item[data-setting="about"]')
    ?.addEventListener("click", () => {
      openAboutDialog();
    });
}

// 切换主题
function toggleThemeSelection() {
  console.log("%c🎨 切换主题选择", "color: #2196F3");
  // 这里可以添加主题选择的弹窗或下拉菜单
}

// 应用主题
function applyTheme(theme) {
  console.log("%c🎨 应用主题:", "color: #2196F3", theme);
  document.documentElement.setAttribute("data-theme", theme);
  currentSettings.theme = theme;
  saveSettings();
}

// 切换语言
function toggleLanguageSelection() {
  console.log("%c🌐 切换语言选择", "color: #2196F3");
  // 这里可以添加语言选择的弹窗或下拉菜单
}

// 应用语言
function applyLanguage(language) {
  console.log("%c🌐 应用语言:", "color: #2196F3", language);
  currentSettings.language = language;
  saveSettings();
  // 这里可以添加语言切换的具体实现
}

// 打开通知设置
function openNotificationSettings() {
  console.log("%c🔔 打开通知设置", "color: #2196F3");
  // 这里可以添加通知设置的弹窗
}

// 打开隐私设置
function openPrivacySettings() {
  console.log("%c🔒 打开隐私设置", "color: #2196F3");
  // 这里可以添加隐私设置的弹窗
}

// 打开帮助中心
function openHelpCenter() {
  console.log("%c❓ 打开帮助中心", "color: #2196F3");
  // 这里可以添加帮助中心的实现
}

// 打开关于对话框
function openAboutDialog() {
  console.log("%cℹ️ 打开关于对话框", "color: #2196F3");
  // 这里可以添加关于对话框的实现
}

// 导出设置服务
export const settingsService = {
  initialize: initializeSettings,
  getCurrentSettings: () => ({ ...currentSettings }),
  applyTheme,
  applyLanguage,
  toggleThemeSelection,
  toggleLanguageSelection,
  openNotificationSettings,
  openPrivacySettings,
  openHelpCenter,
  openAboutDialog,
};
