import { baseUrl } from "../Configuration_Js/base-url.js";
import { authService } from "./authentification.js";
import { supabaseClient } from "../Configuration_Js/supabase-config.js";

// ===== 日志记录系统 =====
// 日志样式配置
const LOG_STYLES = {
  // 系统相关 - 蓝色系
  SYSTEM: "color: #0D47A1; font-weight: bold; font-size: 12px;",
  INIT: "color: #1565C0; font-weight: bold; font-size: 12px;",
  CONFIG: "color: #1976D2; font-weight: bold; font-size: 12px;",

  // 认证相关 - 绿色系
  AUTH: "color: #1B5E20; font-weight: bold; font-size: 12px;",
  SESSION: "color: #2E7D32; font-weight: bold; font-size: 12px;",
  TOKEN: "color: #388E3C; font-weight: bold; font-size: 12px;",

  // 用户相关 - 紫色系
  USER: "color: #4A148C; font-weight: bold; font-size: 12px;",
  PROFILE: "color: #6A1B9A; font-weight: bold; font-size: 12px;",
  ACCOUNT: "color: #7B1FA2; font-weight: bold; font-size: 12px;",

  // 数据库相关 - 青色系
  DATABASE: "color: #006064; font-weight: bold; font-size: 12px;",
  QUERY: "color: #00838F; font-weight: bold; font-size: 12px;",
  TRANSACTION: "color: #0097A7; font-weight: bold; font-size: 12px;",

  // 表单相关 - 橙色系
  FORM: "color: #E65100; font-weight: bold; font-size: 12px;",
  VALIDATION: "color: #EF6C00; font-weight: bold; font-size: 12px;",
  INPUT: "color: #F57C00; font-weight: bold; font-size: 12px;",

  // 状态相关 - 红色系
  ERROR: "color: #B71C1C; font-weight: bold; font-size: 12px;",
  WARNING: "color: #D32F2F; font-weight: bold; font-size: 12px;",
  SUCCESS: "color: #1B5E20; font-weight: bold; font-size: 12px;",

  // 导航相关 - 棕色系
  NAVIGATION: "color: #3E2723; font-weight: bold; font-size: 12px;",
  REDIRECT: "color: #4E342E; font-weight: bold; font-size: 12px;",
  ROUTE: "color: #5D4037; font-weight: bold; font-size: 12px;",
};

// 日志图标配置
const LOG_ICONS = {
  SYSTEM: "🔧",
  INIT: "🚀",
  CONFIG: "⚙️",
  AUTH: "🔐",
  SESSION: "🔑",
  TOKEN: "🎟️",
  USER: "👤",
  PROFILE: "📝",
  ACCOUNT: "👥",
  DATABASE: "💾",
  QUERY: "🔍",
  TRANSACTION: "💫",
  FORM: "📋",
  VALIDATION: "✔️",
  INPUT: "⌨️",
  ERROR: "❌",
  WARNING: "⚠️",
  SUCCESS: "✅",
  NAVIGATION: "🧭",
  REDIRECT: "↪️",
  ROUTE: "🛣️",
};

/**
 * 增强的日志记录函数
 * @param {string} message - 日志消息
 * @param {string} type - 日志类型（对应 LOG_STYLES 的键）
 * @param {Object} [data] - 可选的附加数据
 */
function writeLog(message, type = "SYSTEM", data = null) {
  const timestamp = new Date().toISOString();
  const icon = LOG_ICONS[type] || "ℹ️";
  const style = LOG_STYLES[type] || LOG_STYLES.SYSTEM;

  // 基础日志信息
  const logPrefix = `${icon} [${timestamp}] [${type}]`;

  // 控制台输出
  if (data) {
    console.groupCollapsed(`%c${logPrefix} ${message}`, style);
    console.log("详细数据:", data);
    console.groupEnd();
  } else {
    console.log(`%c${logPrefix} ${message}`, style);
  }

  // 存储到 localStorage
  try {
    const logEntry = {
      timestamp,
      type,
      message,
      data,
    };

    // 按类型分类存储
    const logKey = `logs_${type.toLowerCase()}`;
    const logs = JSON.parse(localStorage.getItem(logKey) || "[]");
    logs.push(logEntry);

    // 限制每种类型最多存储100条日志
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem(logKey, JSON.stringify(logs));

    // 错误日志额外存储
    if (type === "ERROR") {
      const errorLogs = JSON.parse(localStorage.getItem("error_logs") || "[]");
      errorLogs.push(logEntry);
      if (errorLogs.length > 50) {
        errorLogs.shift();
      }
      localStorage.setItem("error_logs", JSON.stringify(errorLogs));
    }
  } catch (error) {
    console.error("日志存储失败:", error);
  }
}

// 使用示例：
// writeLog("系统初始化开始", "INIT");
// writeLog("用户验证成功", "AUTH", { userId: "123", role: "admin" });
// writeLog("表单验证失败", "VALIDATION", { field: "email", error: "Invalid format" });

// 添加全局错误处理
window.onerror = function (msg, url, lineNo, columnNo, error) {
  writeLog(`Global error: ${msg} at ${url}:${lineNo}:${columnNo}`, "error");
  return false;
};

// 将这些函数定义移到文件顶部的全局作用域
function showLogin() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    writeLog("Switching to login form", "info");
    if (!loginForm || !registerForm) {
        const error = "Forms not found in showLogin";
        writeLog(error, "error");
        throw new Error(error);
    }

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    document.querySelector('.tab-btn:first-child').classList.add("active");
    document.querySelector('.tab-btn:last-child').classList.remove("active");

    writeLog("Login form displayed successfully", "info");
}

function showRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    writeLog("Switching to registration form", "info");
    if (!loginForm || !registerForm) {
        const error = "Forms not found in showRegister";
        writeLog(error, "error");
        throw new Error(error);
    }

    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    document.querySelector('.tab-btn:first-child').classList.remove("active");
    document.querySelector('.tab-btn:last-child').classList.add("active");

    writeLog("Registration form displayed successfully", "info");
}

// 将函数添加到全局作用域
window.showLogin = showLogin;
window.showRegister = showRegister;

// 页面加载完成后的初始化代码
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (!loginForm || !registerForm) {
        throw new Error("Required form elements not found");
    }

    // ... 其余的初始化代码 ...
});
