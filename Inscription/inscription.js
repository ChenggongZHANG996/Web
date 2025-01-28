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

    // 注册表单步骤切换逻辑
    const nextButtons = document.querySelectorAll('.next-step');
    const prevButtons = document.querySelectorAll('.prev-step');
    const steps = document.querySelectorAll('.register-step');
    const progressSteps = document.querySelectorAll('.progress-step');

    function updateProgress(currentStep) {
        progressSteps.forEach((step, index) => {
            if (index < currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    function showStep(stepNumber) {
        steps.forEach(step => {
            step.classList.remove('active');
            if (step.dataset.step === stepNumber.toString()) {
                step.classList.add('active');
            }
        });
        updateProgress(stepNumber);
        writeLog(`Showing registration step ${stepNumber}`, "NAVIGATION");
    }

    // 添加密码验证函数
    function validatePassword(password) {
        // 至少8个字符，包含大小写字母、数字和特殊字符
        const minLength = password.length >= 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return {
            isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            errors: {
                minLength: !minLength,
                hasUpperCase: !hasUpperCase,
                hasLowerCase: !hasLowerCase,
                hasNumbers: !hasNumbers,
                hasSpecialChar: !hasSpecialChar
            }
        };
    }

    // 添加邮箱验证函数
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // 添加电话号码验证函数
    function validatePhone(phone) {
        // 法国手机号格式
        const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
        return phoneRegex.test(phone);
    }

    // 修改validateStep函数
    function validateStep(step) {
        const inputs = step.querySelectorAll('input[required]');
        let isValid = true;
        let errors = [];
        
        inputs.forEach(input => {
            let fieldValid = true;
            const value = input.value.trim();

            if (!value) {
                fieldValid = false;
                errors.push(`Le champ ${input.name} est requis`);
            } else {
                // 特定字段的验证
                switch(input.name) {
                    case 'email':
                        if (!validateEmail(value)) {
                            fieldValid = false;
                            errors.push("Format d'email invalide");
                        }
                        break;
                    case 'phone':
                        if (!validatePhone(value)) {
                            fieldValid = false;
                            errors.push("Format de numéro de téléphone invalide");
                        }
                        break;
                    case 'password':
                        const passwordValidation = validatePassword(value);
                        if (!passwordValidation.isValid) {
                            fieldValid = false;
                            if (passwordValidation.errors.minLength) errors.push("Le mot de passe doit contenir au moins 8 caractères");
                            if (passwordValidation.errors.hasUpperCase) errors.push("Le mot de passe doit contenir au moins une majuscule");
                            if (passwordValidation.errors.hasLowerCase) errors.push("Le mot de passe doit contenir au moins une minuscule");
                            if (passwordValidation.errors.hasNumbers) errors.push("Le mot de passe doit contenir au moins un chiffre");
                            if (passwordValidation.errors.hasSpecialChar) errors.push("Le mot de passe doit contenir au moins un caractère spécial");
                        }
                        break;
                    case 'confirm_password':
                        const password = step.querySelector('input[name="password"]').value;
                        if (value !== password) {
                            fieldValid = false;
                            errors.push("Les mots de passe ne correspondent pas");
                        }
                        break;
                }
            }

            if (!fieldValid) {
                isValid = false;
                input.classList.add('error');
                writeLog(`Validation failed for field: ${input.name}`, "VALIDATION");
            } else {
                input.classList.remove('error');
            }
        });

        if (!isValid) {
            // 显示错误消息
            showErrors(errors);
        }

        return isValid;
    }

    // 添加错误显示函数
    function showErrors(errors) {
        // 移除现有的错误消息
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());

        // 创建新的错误消息容器
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.style.color = 'red';
        errorContainer.style.marginTop = '10px';
        errorContainer.style.fontSize = '14px';

        errors.forEach(error => {
            const errorElement = document.createElement('p');
            errorElement.textContent = error;
            errorContainer.appendChild(errorElement);
        });

        // 添加到表单中
        const currentStep = document.querySelector('.register-step.active');
        currentStep.appendChild(errorContainer);
    }

    // 下一步按钮点击事件
    nextButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.register-step');
            const currentStepNumber = parseInt(currentStep.dataset.step);
            
            if (validateStep(currentStep)) {
                if (currentStepNumber < 3) {
                    showStep(currentStepNumber + 1);
                    writeLog(`Moving to step ${currentStepNumber + 1}`, "NAVIGATION");
                }
            } else {
                writeLog("Step validation failed", "ERROR");
            }
        });
    });

    // 上一步按钮点击事件
    prevButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const currentStep = this.closest('.register-step');
            const currentStepNumber = parseInt(currentStep.dataset.step);
            
            if (currentStepNumber > 1) {
                showStep(currentStepNumber - 1);
                writeLog(`Moving back to step ${currentStepNumber - 1}`, "NAVIGATION");
            }
        });
    });

    // 初始化显示第一步
    showStep(1);

    // 添加按钮点击事件监听
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    if (loginBtn) {
        loginBtn.addEventListener('click', showLogin);
    }
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegister);
    }

    // 登录表单提交处理
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const userType = document.querySelector('input[name="loginUserType"]:checked').value;

        try {
            const { data: { user }, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // 获取用户类型
            const { data: userData, error: userError } = await supabaseClient
                .from('users')
                .select('user_type')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // 保存完整的用户信息到本地存储
            localStorage.setItem('user_session', JSON.stringify({
                user: {
                    ...user,
                    user_type: userData.user_type
                }
            }));

            // 添加日志
            console.log("User type:", userType);
            console.log("Base URL:", baseUrl);

            // 跳转前打印完整URL
            const profUrl = `${baseUrl}App_Professeur/HTML/Prof_index.html`;
            console.log("Redirecting to:", profUrl);

            if (userType === 'tutor') {
                window.location.href = profUrl;
            } else {
                window.location.href = `${baseUrl}App_Etudiant/HTML/Student_index.html`;
            }

            writeLog("Connexion réussie", "success");
        } catch (error) {
            writeLog(`Erreur de connexion: ${error.message}`, "error");
            showError(error.message);
        }
    });

    // 注册表单提交处理
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        writeLog("Starting registration process", "AUTH");

        // 收集所有表单数据
        const formData = {
            user_type: document.querySelector('input[name="user_type"]:checked').value,
            first_name: document.getElementById('first_name').value,
            last_name: document.getElementById('last_name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value
        };

        try {
            // 1. 创建认证用户
            const { data: { user }, error: authError } = await supabaseClient.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        user_type: formData.user_type
                    }
                }
            });

            if (authError) throw authError;

            // 2. 创建用户配置文件
            const { error: profileError } = await supabaseClient
                .from('users')
                .insert([
                    {
                        id: user.id,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                        phone: formData.phone,
                        user_type: formData.user_type
                    }
                ]);

            if (profileError) throw profileError;

            writeLog("Registration successful", "SUCCESS");
            
            // 显示成功消息
            alert("Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.");
            
            // 重定向到登录页面
            showLogin();

        } catch (error) {
            writeLog(`Registration error: ${error.message}`, "ERROR");
            showErrors([`Erreur d'inscription: ${error.message}`]);
        }
    });
});
