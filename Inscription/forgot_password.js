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

// 生成随机重置码
function generateResetCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

document.addEventListener("DOMContentLoaded", async function () {
  const resetForm = document.getElementById("resetForm");
  const messageDiv = document.getElementById("message");
  const resetCodeGroup = document.getElementById("resetCodeGroup");
  const newPasswordGroup = document.getElementById("newPasswordGroup");
  const confirmPasswordGroup = document.getElementById("confirmPasswordGroup");
  const resetPasswordBtn = document.getElementById("resetPasswordBtn");
  let currentResetCode = null;
  let currentUserId = null;

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

  if (resetForm) {
    resetForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const submitBtn = this.querySelector("button[type='submit']");

      try {
        submitBtn.disabled = true;
        messageDiv.className = "message-container info-message";
        messageDiv.textContent = "Vérification de l'email...";
        messageDiv.classList.remove("hidden");

        // 1. 检查用户是否存在
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("id, email")
          .eq("email", email)
          .single();

        if (userError || !userData) {
          throw new Error("Aucun compte trouvé avec cette adresse email");
        }

        // 2. 生成重置码
        currentResetCode = generateResetCode();
        currentUserId = userData.id;
        const expiryTime = new Date();
        expiryTime.setHours(expiryTime.getHours() + 1); // 1小时后过期

        // 3. 存储重置码
        const { error: insertError } = await supabaseClient
          .from("password_resets")
          .insert([
            {
              user_id: userData.id,
              token: currentResetCode,
              expiry: expiryTime.toISOString(),
              used: false,
            },
          ]);

        if (insertError) throw insertError;

        writeLog("Reset code generated successfully", "success");
        messageDiv.className = "message-container success-message";
        messageDiv.innerHTML = `
          <p>Un code de réinitialisation a été généré:</p>
          <h3 style="margin: 10px 0; font-size: 24px; color: #28a745;">${currentResetCode}</h3>
          <p>Veuillez entrer ce code et votre nouveau mot de passe ci-dessous.</p>
        `;

        // 4. 显示重置码输入框和密码输入框
        resetCodeGroup.classList.remove("hidden");
        newPasswordGroup.classList.remove("hidden");
        confirmPasswordGroup.classList.remove("hidden");
        resetPasswordBtn.classList.remove("hidden");
        submitBtn.classList.add("hidden");
      } catch (error) {
        writeLog(`Password reset error: ${error.message}`, "error");
        messageDiv.className = "message-container error-message";
        messageDiv.textContent = error.message;
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  // 重置密码按钮点击事件
  if (resetPasswordBtn) {
    resetPasswordBtn.addEventListener("click", async function () {
      const resetCode = document.getElementById("resetCode").value.trim();
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      try {
        resetPasswordBtn.disabled = true;
        messageDiv.className = "message-container info-message";
        messageDiv.textContent = "Vérification du code...";

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
        if (resetCode !== currentResetCode) {
          throw new Error("Code de réinitialisation incorrect");
        }

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
        resetPasswordBtn.disabled = false;
      }
    });
  }
});
