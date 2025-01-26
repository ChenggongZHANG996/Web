import { baseUrl } from "../Configuration_Js/base-url.js";
import { supabaseClient } from "../Configuration_Js/supabase-config.js";
import { dbService } from "../Configuration_Js/db-service.js";

// 日志记录函数
function writeLog(message, type = "info") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(
    `%c${logMessage}`,
    `color: ${type === "error" ? "red" : type === "success" ? "green" : "blue"}`
  );
}

document.addEventListener("DOMContentLoaded", function () {
  const newPasswordForm = document.getElementById("newPasswordForm");
  const messageDiv = document.getElementById("message");

  // 获取 URL 参数
  const urlParams = new URLSearchParams(window.location.search);
  const resetCode = urlParams.get("code");
  const email = urlParams.get("email");

  if (!resetCode || !email) {
    // 如果没有重置码或邮箱，重定向到忘记密码页面
    window.location.href = "forgot_password.html";
    return;
  }

  // 添加密码显示/隐藏功能
  document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.previousElementSibling;
      const type = input.getAttribute("type");
      input.setAttribute("type", type === "password" ? "text" : "password");
      this.querySelector("i").classList.toggle("fa-eye");
      this.querySelector("i").classList.toggle("fa-eye-slash");
    });
  });

  if (newPasswordForm) {
    newPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const submitBtn = this.querySelector("button[type='submit']");

      try {
        submitBtn.disabled = true;
        messageDiv.className = "message-container info-message";
        messageDiv.textContent = "Mise à jour du mot de passe...";
        messageDiv.classList.remove("hidden");

        // 1. 验证密码
        if (newPassword !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }

        if (newPassword.length < 6) {
          throw new Error(
            "Le mot de passe doit contenir au moins 6 caractères"
          );
        }

        // 2. 验证重置码
        const { data: resetData, error: resetError } = await supabaseClient
          .from("password_resets")
          .select("*")
          .eq("token", resetCode)
          .eq("used", false)
          .gt("expiry", new Date().toISOString())
          .single();

        if (resetError || !resetData) {
          throw new Error("Code de réinitialisation invalide ou expiré");
        }

        // 3. 更新密码
        const { error: updateError } = await supabaseClient.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;

        // 4. 标记重置码为已使用
        await supabaseClient
          .from("password_resets")
          .update({ used: true })
          .eq("token", resetCode);

        writeLog("Password updated successfully", "success");
        messageDiv.className = "message-container success-message";
        messageDiv.textContent =
          "Mot de passe mis à jour avec succès. Redirection vers la page de connexion...";

        // 5. 重定向到登录页面
        setTimeout(() => {
          window.location.href = "inscription.html";
        }, 3000);
      } catch (error) {
        writeLog(`Password update error: ${error.message}`, "error");
        messageDiv.className = "message-container error-message";
        messageDiv.textContent = error.message;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});
