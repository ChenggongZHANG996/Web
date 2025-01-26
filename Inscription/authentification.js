import { baseUrl } from "../Configuration_Js/base-url.js";
import { supabaseClient } from "../Configuration_Js/supabase-config.js";
import { dbService } from "../Configuration_Js/db-service.js";

// 日志记录函数
function writeLog(message, type = "info") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;

  // 使用 console 记录到浏览器控制台，带有颜色和格式
  const styles = {
    auth: "color: #4CAF50; font-weight: bold", // 绿色
    inscription: "color: #2196F3; font-weight: bold", // 蓝色
    reset: "color: #9C27B0; font-weight: bold", // 紫色
    error: "color: #f44336; font-weight: bold", // 红色
    warn: "color: #FF9800; font-weight: bold", // 橙色
    info: "color: #607D8B; font-weight: bold", // 灰色
  };

  console.log(`%c${logMessage}`, styles[type] || styles.info);

  // 如果是错误类型，还要记录堆栈跟踪
  if (type === "error" && Error.captureStackTrace) {
    const stack = new Error().stack;
    console.log("%cStack Trace:", "color: #f44336", stack);
  }
}

// 清除日志函数
export function clearLogs(type = "all") {
  if (type === "all") {
    localStorage.removeItem("auth_logs");
    localStorage.removeItem("inscription_logs");
    localStorage.removeItem("reset_logs");
    localStorage.removeItem("error_logs");
  } else {
    localStorage.removeItem(`${type}_logs`);
  }
}

class AuthenticationService {
  constructor() {
    this.client = supabaseClient;
    this.db = dbService;
  }

  // 登录功能
  async login(email, password) {
    writeLog(`开始登录流程 - 用户: ${email}`, "auth");
    try {
      // 1. 首先进行 Supabase Auth 认证
      writeLog("开始 Supabase Auth 认证...", "auth");
      const { data: authData, error: authError } =
        await this.client.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        writeLog(`认证错误: ${authError.message}`, "error");
        writeLog(`错误详情: ${JSON.stringify(authError)}`, "error");
        throw new Error("Email ou mot de passe incorrect");
      }

      if (!authData || !authData.session) {
        writeLog("认证数据无效", "error");
        throw new Error("Session invalide");
      }

      writeLog("Supabase Auth 认证成功", "auth");

      // 2. 然后获取用户数据
      writeLog("正在获取用户数据...", "auth");
      const { data: userData, error: userError } = await this.client
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (userError) {
        writeLog(`获取用户数据错误: ${userError.message}`, "error");
        throw new Error(
          "Erreur lors de la récupération des données utilisateur"
        );
      }

      if (!userData) {
        writeLog("未找到用户数据", "error");
        throw new Error("Données utilisateur introuvables");
      }

      writeLog(`用户数据获取成功: ${JSON.stringify(userData)}`, "auth");

      // 3. 更新最后登录时间
      try {
        await this.db.update(
          "users",
          {
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { email: email }
        );
        writeLog("最后登录时间更新成功", "auth");
      } catch (updateError) {
        writeLog(`更新最后登录时间失败: ${updateError.message}`, "warn");
      }

      return {
        success: true,
        user: userData,
        session: authData.session,
      };
    } catch (error) {
      writeLog(`登录失败: ${error.message}`, "error");
      throw error;
    }
  }

  // 注册功能
  async register(userData) {
    try {
      // 1. 基本数据验证
      if (
        !userData.email ||
        !userData.password ||
        !userData.first_name ||
        !userData.last_name ||
        !userData.user_type
      ) {
        writeLog("Missing required fields", "error");
        return { success: false, message: "Missing required fields" };
      }

      // 2. 检查用户是否已存在
      const { data: existingUser, error: checkError } = await this.client
        .from("users")
        .select("email")
        .eq("email", userData.email)
        .maybeSingle();

      if (checkError && checkError.status !== 406) {
        writeLog(`检查用户存在时出错: ${checkError.message}`, "error");
        return { success: false, message: checkError.message };
      }

      if (existingUser) {
        writeLog(`邮箱已被注册: ${userData.email}`, "error");
        return { success: false, message: "Email already registered" };
      }

      // 3. 在 Auth 系统中创建用户
      writeLog("开始在 Auth 系统中创建用户...", "auth");
      const { data: authData, error: signUpError } =
        await this.client.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              first_name: userData.first_name,
              last_name: userData.last_name,
              user_type: userData.user_type,
            },
          },
        });

      if (signUpError) {
        writeLog(`创建认证用户失败: ${signUpError.message}`, "error");
        return { success: false, message: signUpError.message };
      }

      if (!authData?.user?.id) {
        writeLog("Auth 系统未返回用户 ID", "error");
        return {
          success: false,
          message: "No user ID returned from auth system",
        };
      }

      writeLog(`Auth 用户创建成功，ID: ${authData.user.id}`, "success");

      // 4. 在数据库中创建用户记录
      writeLog("开始在数据库中创建用户记录...", "database");
      const { error: insertError } = await this.client.from("users").insert([
        {
          id: authData.user.id, // 直接使用 UUID
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_type: userData.user_type,
          phone: userData.phone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "active",
          email_verified: false,
        },
      ]);

      if (insertError) {
        writeLog(`创建用户记录失败: ${insertError.message}`, "error");
        // 如果数据库插入失败，我们应该考虑清理 Auth 用户
        writeLog("尝试清理 Auth 系统中的用户...", "auth");
        try {
          await this.client.auth.admin.deleteUser(authData.user.id);
          writeLog("Auth 用户清理成功", "success");
        } catch (cleanupError) {
          writeLog(`Auth 用户清理失败: ${cleanupError.message}`, "error");
        }
        return { success: false, message: insertError.message };
      }

      writeLog("用户注册成功", "success");
      return {
        success: true,
        user: authData.user,
        message: "Registration successful",
      };
    } catch (error) {
      writeLog(`注册过程出错: ${error.message}`, "error");
      return {
        success: false,
        message: error.message || "Registration failed",
      };
    }
  }

  // 重置密码功能
  async resetPassword(email) {
    writeLog(`开始密码重置流程 - 邮箱: ${email}`, "reset");
    try {
      const { error } = await this.client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) {
        writeLog(`密码重置失败: ${error.message}`, "error");
        throw error;
      }

      writeLog(`密码重置邮件已发送 - 邮箱: ${email}`);
      return {
        success: true,
        message: "Instructions de réinitialisation envoyées par email",
      };
    } catch (error) {
      writeLog(`密码重置失败: ${error.message}`, "reset");
      throw error;
    }
  }

  // 更新密码功能
  async updatePassword(newPassword) {
    writeLog("开始更新密码流程", "reset");
    try {
      const { error } = await this.client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        writeLog(`密码更新失败: ${error.message}`, "error");
        throw error;
      }

      writeLog("密码更新成功");
      return {
        success: true,
        message: "Mot de passe mis à jour avec succès",
      };
    } catch (error) {
      writeLog(`密码更新失败: ${error.message}`, "reset");
      throw error;
    }
  }

  // 检查认证状态
  async checkAuthStatus() {
    try {
      const {
        data: { session },
        error,
      } = await this.client.auth.getSession();
      if (error) {
        writeLog(`检查认证状态失败: ${error.message}`, "error");
        throw error;
      }
      writeLog(`检查认证状态: ${session ? "已登录" : "未登录"}`);
      return session;
    } catch (error) {
      writeLog(`检查认证状态失败: ${error.message}`, "auth");
      return null;
    }
  }

  // 登出功能
  async logout() {
    writeLog("开始登出流程", "auth");
    try {
      const { error } = await this.client.auth.signOut();
      if (error) {
        writeLog(`登出失败: ${error.message}`, "error");
        throw error;
      }
      writeLog("登出成功");
      return { success: true };
    } catch (error) {
      writeLog(`登出失败: ${error.message}`, "auth");
      throw error;
    }
  }
}

// 创建并导出认证服务实例
const authService = new AuthenticationService();
export { authService };
