import { baseUrl } from "../Configuration_Js/base-url.js";
import { supabaseClient } from "../Configuration_Js/supabase-config.js";

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
  const resetPasswordForm = document.getElementById("resetPasswordForm");
  const messageDiv = document.getElementById("message");

  if (resetPasswordForm) {
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

    resetPasswordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const password = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const submitBtn = this.querySelector("button[type='submit']");

      try {
        // 禁用提交按钮
        submitBtn.disabled = true;
        messageDiv.className = "message-container info-message";
        messageDiv.textContent = "Mise à jour du mot de passe...";
        messageDiv.classList.remove("hidden");

        // 验证密码匹配
        if (password !== confirmPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }

        // 验证密码长度
        if (password.length < 6) {
          throw new Error(
            "Le mot de passe doit contenir au moins 6 caractères"
          );
        }

        writeLog("Updating password...");
        const { error } = await supabaseClient.auth.updateUser({
          password: password,
        });

        if (error) throw error;

        writeLog("Password updated successfully", "success");
        messageDiv.className = "message-container success-message";
        messageDiv.textContent =
          "Mot de passe mis à jour avec succès. Redirection vers la page de connexion...";

        // 3秒后重定向到登录页面
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
