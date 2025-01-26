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

// 等待 DOM 加载完成
document.addEventListener("DOMContentLoaded", async function () {
  try {
    // 清除旧的日志
    clearLogs();
    writeLog("=== Starting new session ===", "INIT");

    // 1. 测试 Supabase 客户端初始化
    writeLog("Testing Supabase client initialization...", "SYSTEM");
    try {
      if (!supabaseClient || !supabaseClient.auth) {
        throw new Error("Supabase client not properly initialized");
      }
      writeLog("✓ Supabase client initialized successfully", "SUCCESS");
    } catch (error) {
      writeLog(
        `Supabase client initialization failed: ${error.message}`,
        "ERROR"
      );
      throw error;
    }

    // 2. 测试认证服务连接
    writeLog("Testing authentication service connection...", "AUTH");
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession();
      if (sessionError) throw sessionError;

      writeLog("✓ Successfully retrieved session data", "SUCCESS", {
        hasSession: !!session,
        timestamp: new Date().toISOString(),
      });

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();
      writeLog("Checking current authentication state...", "AUTH");

      if (userError) {
        writeLog(
          "No authenticated user (expected during initial load)",
          "INFO"
        );
      } else {
        writeLog("Current auth state retrieved", "SUCCESS", {
          hasUser: !!user,
          timestamp: new Date().toISOString(),
        });
      }

      writeLog("✓ Authentication service connected successfully", "SUCCESS");
    } catch (error) {
      writeLog(
        `Auth service connection failed: ${error.message}`,
        "ERROR",
        error
      );
      console.error("Full auth error:", error);
    }

    // 3. 测试数据库连接
    writeLog("Testing database connection...", "DATABASE");
    try {
      const { data: dbTest, error: dbError } = await supabaseClient
        .from("users")
        .select("count")
        .limit(1);
      if (dbError) throw dbError;
      writeLog("✓ Database connection successful", "SUCCESS");
    } catch (error) {
      writeLog(`Database connection failed: ${error.message}`, "ERROR");
      throw error;
    }

    writeLog("=== All System Checks Completed ===", "SUCCESS");

    // 测试认证系统连接
    writeLog("=== Testing Authentication System Connection ===", "auth");

    // 4. 获取认证配置
    writeLog("Retrieving authentication configuration...", "auth");
    const {
      data: { session },
      error: sessionError,
    } = await supabaseClient.auth.getSession();
    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }
    writeLog("✓ Authentication configuration retrieved", "auth");

    writeLog("=== All Authentication Tests Passed ===", "auth");
    writeLog("System ready for user authentication", "auth");

    // 获取必要的DOM元素
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const directAccessBtn = document.querySelector(".direct-access-btn");

    if (!loginForm || !registerForm) {
      throw new Error("Required form elements not found");
    }

    // 表单切换功能
    const tabBtns = document.querySelectorAll(".tab-btn");
    writeLog("Initializing form tabs", "info");

    // 定义表单切换函数
    function showLogin() {
      writeLog("Switching to login form", "info");
      if (!loginForm || !registerForm) {
        const error = "Forms not found in showLogin";
        writeLog(error, "error");
        throw new Error(error);
      }

      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
      tabBtns[0].classList.add("active");
      tabBtns[1].classList.remove("active");

      writeLog("Login form displayed successfully", "info");
    }

    function showRegister() {
      writeLog("Switching to registration form", "info");
      if (!loginForm || !registerForm) {
        const error = "Forms not found in showRegister";
        writeLog(error, "error");
        throw new Error(error);
      }

      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
      tabBtns[0].classList.remove("active");
      tabBtns[1].classList.add("active");

      writeLog("Registration form displayed successfully", "info");
    }

    // 将函数添加到window对象
    window.showLogin = showLogin;
    window.showRegister = showRegister;

    // 设置默认登录凭据（只在一个地方设置）
    const defaultEmail =
      localStorage.getItem("defaultTeacherEmail") ||
      "chenggong.zhang@etu.estia.fr";
    const defaultPassword =
      localStorage.getItem("defaultTeacherPassword") || "123456789";

    const emailInput = document.querySelector("#loginEmail");
    const passwordInput = document.querySelector("#loginPassword");
    const tutorRadio = document.querySelector(
      'input[name="loginUserType"][value="tutor"]'
    );

    if (emailInput && passwordInput && tutorRadio) {
      if (!emailInput.value) emailInput.value = defaultEmail;
      if (!passwordInput.value) passwordInput.value = defaultPassword;
      tutorRadio.checked = true;
      writeLog(
        `Default login credentials set - Email: ${defaultEmail}`,
        "info"
      );
    } else {
      writeLog(
        "Could not set default login credentials - form elements not found",
        "warn"
      );
    }

    // 表单验证函数
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }

    function validatePassword(password) {
      return password && password.length >= 8;
    }

    function validateName(name) {
      const nameRegex = /^[\p{L}\s\-']{2,50}$/u;
      return nameRegex.test(name);
    }

    function validatePhone(phone) {
      const cleanPhone = phone.replace(/[\s\-]/g, "");
      const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
      return phoneRegex.test(phone);
    }

    // 统一的步骤验证函数
    function validateStep(step) {
      writeLog(`Validating step ${step}`, "info");

      try {
        switch (step) {
          case 1:
            const firstName = document
              .querySelector("#first_name")
              ?.value?.trim();
            const lastName = document
              .querySelector("#last_name")
              ?.value?.trim();
            const userType = document.querySelector(
              'input[name="user_type"]:checked'
            )?.value;

            writeLog(
              `Step 1 data: firstName=${firstName}, lastName=${lastName}, userType=${userType}`,
              "info"
            );

            if (!firstName || !validateName(firstName)) {
              writeLog("First name validation failed", "error");
              alert(
                "Le prénom n'est pas valide (2-50 caractères, lettres et tirets uniquement)"
              );
              return false;
            }
            if (!lastName || !validateName(lastName)) {
              writeLog("Last name validation failed", "error");
              alert(
                "Le nom n'est pas valide (2-50 caractères, lettres et tirets uniquement)"
              );
              return false;
            }
            if (!userType) {
              writeLog("User type not selected", "error");
              alert("Veuillez sélectionner votre type d'utilisateur");
              return false;
            }
            break;

          case 2:
            const email = document.querySelector("#email")?.value?.trim();
            const phone = document.querySelector("#phone")?.value?.trim();

            writeLog(`Step 2 data: email=${email}, phone=${phone}`, "info");

            if (!email || !validateEmail(email)) {
              writeLog("Email validation failed", "error");
              alert("Veuillez entrer une adresse email valide");
              return false;
            }
            if (!phone || !validatePhone(phone)) {
              writeLog("Phone validation failed", "error");
              alert(
                "Le numéro de téléphone n'est pas valide (format français requis)"
              );
              return false;
            }
            break;

          case 3:
            const password = document.querySelector("#password")?.value;
            const confirmPassword =
              document.querySelector("#confirm_password")?.value;
            const terms = document.querySelector(
              'input[name="terms"]'
            )?.checked;

            writeLog(
              `Step 3 data: password length=${
                password?.length || 0
              }, terms accepted=${terms}`,
              "info"
            );

            if (!password || !validatePassword(password)) {
              writeLog("Password validation failed", "error");
              alert("Le mot de passe doit contenir au moins 8 caractères");
              return false;
            }
            if (password !== confirmPassword) {
              writeLog("Password confirmation failed", "error");
              alert("Les mots de passe ne correspondent pas");
              return false;
            }
            if (!terms) {
              writeLog("Terms not accepted", "error");
              alert("Veuillez accepter les conditions d'utilisation");
              return false;
            }
            break;

          default:
            writeLog(`Invalid step number: ${step}`, "error");
            return false;
        }

        writeLog(`Step ${step} validation successful`, "info");
        return true;
      } catch (error) {
        writeLog(
          `Error during step ${step} validation: ${error.message}`,
          "error"
        );
        return false;
      }
    }

    // 统一的步骤显示函数
    function showStep(step) {
      writeLog(`Showing step ${step}`, "info");

      // 更新注册步骤显示
      document.querySelectorAll(".register-step").forEach((s) => {
        s.classList.remove("active");
        if (s.dataset.step === step.toString()) {
          s.classList.add("active");
        }
      });

      // 更新进度条
      document.querySelectorAll(".progress-step").forEach((s, index) => {
        if (index + 1 <= step) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });

      writeLog(`Step ${step} displayed successfully`, "info");
    }

    // 注册步骤导航
    let currentStep = 1;
    showStep(currentStep);

    // 下一步按钮事件
    document.querySelectorAll(".next-step").forEach((btn) => {
      btn.addEventListener("click", () => {
        writeLog(
          `Next step button clicked. Current step: ${currentStep}`,
          "info"
        );
        if (currentStep < 3 && validateStep(currentStep)) {
          currentStep++;
          showStep(currentStep);
        }
      });
    });

    // 上一步按钮事件
    document.querySelectorAll(".prev-step").forEach((btn) => {
      btn.addEventListener("click", () => {
        writeLog(
          `Previous step button clicked. Current step: ${currentStep}`,
          "info"
        );
        if (currentStep > 1) {
          currentStep--;
          showStep(currentStep);
        }
      });
    });

    // 密码显示切换
    document.querySelectorAll(".toggle-password").forEach((btn) => {
      btn.addEventListener("click", function () {
        const input = this.previousElementSibling;
        const type = input.getAttribute("type");
        const newType = type === "password" ? "text" : "password";
        input.setAttribute("type", newType);
        this.querySelector("i").classList.toggle("fa-eye");
        this.querySelector("i").classList.toggle("fa-eye-slash");
        writeLog(`Password visibility toggled to ${newType}`, "info");
      });
    });

    // 登录成功后的重定向处理
    function redirectToUserPage(userType) {
      writeLog(`Attempting to redirect user - Type: ${userType}`, "auth");
      try {
        if (userType === "student") {
          writeLog("Redirecting to student dashboard", "auth");
          window.location.href = "/App_Etudiant/HTML/Etu_index.html";
        } else if (userType === "tutor") {
          writeLog("Redirecting to teacher dashboard", "auth");
          window.location.href = "/App_Professeur/HTML/Prof_index.html";
        } else {
          const error = `Invalid user type: ${userType}`;
          writeLog(error, "error");
          throw new Error(error);
        }
      } catch (error) {
        writeLog(`Redirect failed: ${error.message}`, "error");
        throw error;
      }
    }

    // 添加按钮点击事件监听
    tabBtns.forEach((btn, index) => {
      btn.addEventListener("click", (e) => {
        console.log(`=== Tab ${index} clicked ===`);
        console.log("Button details:", {
          text: btn.textContent.trim(),
          classes: btn.className,
          index: index,
        });

        e.preventDefault();
        if (index === 0) {
          showLogin();
        } else {
          showRegister();
        }
      });
    });

    // 设置初始状态
    console.log("=== Setting initial state ===");
    console.log("Initial form classes:", {
      loginForm: loginForm.className,
      registerForm: registerForm.className,
    });

    if (!loginForm.classList.contains("hidden")) {
      console.log("Initial state: showing login form");
      showLogin();
    } else {
      console.log("Initial state: showing register form");
      showRegister();
    }

    // 登录表单提交处理
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // 防止重复提交
      const submitBtn = this.querySelector(".submit-btn");
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;

      writeLog("Login form submitted", "auth");

      const email = document.querySelector("#loginEmail").value.trim();
      const password = document.querySelector("#loginPassword").value;
      const userType = document.querySelector(
        'input[name="loginUserType"]:checked'
      )?.value;

      writeLog(`尝试登录 - Email: ${email}, UserType: ${userType}`, "auth");

      if (!email || !password || !userType) {
        writeLog("Missing required login fields", "error");
        alert("Please fill in all required fields");
        submitBtn.disabled = false;
        return;
      }

      try {
        writeLog("调用 authService.login...", "auth");
        const result = await authService.login(email, password);

        if (result.success) {
          writeLog(`Login successful for user: ${email}`, "auth");
          writeLog(`User data: ${JSON.stringify(result.user)}`, "auth");

          if (result.user.user_type !== userType) {
            writeLog(
              `User type mismatch: expected ${userType}, got ${result.user.user_type}`,
              "error"
            );
            throw new Error(
              `Invalid user type. You are not registered as a ${userType}.`
            );
          }

          // 存储用户信息
          localStorage.setItem("userEmail", email);
          localStorage.setItem("userType", userType);
          localStorage.setItem(
            "user_session",
            JSON.stringify({
              user: result.user,
              token: result.session.access_token,
            })
          );
          writeLog("User session stored in localStorage", "auth");

          writeLog(`Redirecting ${userType} to dashboard`, "auth");
          window.location.href =
            userType === "student"
              ? "/App_Etudiant/HTML/Etu_index.html"
              : "/App_Professeur/HTML/Prof_index.html";
        } else {
          writeLog(
            `Login failed with result: ${JSON.stringify(result)}`,
            "error"
          );
          throw new Error(result.message || "Login failed");
        }
      } catch (error) {
        writeLog(`Login failed: ${error.message}`, "error");
        writeLog(`Error details: ${error.stack}`, "error");
        alert(error.message);
        viewLogs("error");
        submitBtn.disabled = false;
      }
    });

    // 注册表单提交处理
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      // 防止重复提交
      const submitBtn = this.querySelector(".submit-btn");
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;

      try {
        // 1. 验证所有步骤
        if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
          throw new Error("Form validation failed");
        }

        // 2. 收集表单数据
        const userData = {
          email: document.querySelector("#email").value.trim(),
          password: document.querySelector("#password").value,
          first_name: document.querySelector("#first_name").value.trim(),
          last_name: document.querySelector("#last_name").value.trim(),
          user_type: document.querySelector('input[name="user_type"]:checked')
            ?.value,
          phone: document.querySelector("#phone").value.trim(),
        };

        // 验证所有必填字段
        if (
          !userData.email ||
          !userData.password ||
          !userData.first_name ||
          !userData.last_name ||
          !userData.user_type
        ) {
          throw new Error("Please fill in all required fields");
        }

        writeLog("Starting user registration process...", "auth");
        writeLog(
          `User data collected: ${JSON.stringify({
            ...userData,
            password: "***",
          })}`,
          "auth"
        );

        // 3. 使用认证服务进行注册
        const result = await authService.register(userData);

        if (!result.success) {
          writeLog(`Registration failed: ${result.message}`, "error");
          throw new Error(result.message || "Registration failed");
        }

        // 4. 注册成功，显示成功消息并跳转到登录页面
        writeLog("Registration successful", "success");
        alert("Account created successfully! Please log in.");
        showLogin();
      } catch (error) {
        writeLog(`Registration error: ${error.message}`, "error");
        alert(`Registration failed: ${error.message}`);
      } finally {
        submitBtn.disabled = false;
      }
    });

    // 添加调试按钮
    const debugButton = document.createElement("button");
    debugButton.textContent = "View Logs";
    debugButton.style.position = "fixed";
    debugButton.style.bottom = "10px";
    debugButton.style.right = "10px";
    debugButton.style.zIndex = "9999";
    debugButton.addEventListener("click", () => viewLogs());
    document.body.appendChild(debugButton);

    // 直接访问按钮点击处理
    if (directAccessBtn) {
      directAccessBtn.addEventListener("click", function () {
        const userType = document.querySelector(
          'input[name="loginUserType"]:checked'
        ).value;
        writeLog(`直接访问请求 - 用户类型: ${userType}`, "auth");
        redirectToUserPage(userType);
      });
    }

    // 修改建议：添加本地缓存
    let sessionCache = null;
    async function getSession() {
      if (sessionCache) return sessionCache;
      const { data } = await supabaseClient.auth.getSession();
      sessionCache = data;
      return data;
    }

    // 当页面加载完成时
    document.addEventListener("DOMContentLoaded", () => {
      // 获取现有的状态容器
      const statusContainer = document.querySelector(
        'div[style*="position: fixed"]'
      );
      if (statusContainer) {
        // 添加第四个状态显示
        const authDataStatus = document.createElement("div");
        authDataStatus.id = "authDataStatus";
        authDataStatus.innerHTML = "Auth Data: Waiting...";
        statusContainer.appendChild(authDataStatus);
      }
    });
  } catch (error) {
    writeLog(`Initialization error: ${error.message}`, "error");
    viewLogs("error");
  }
});
