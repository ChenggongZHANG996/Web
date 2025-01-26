import { authService } from "../../Inscription/authentification.js";

export async function handleLogout() {
  try {
    const result = await authService.logout();
    if (result.success) {
      // 清除本地存储的用户会话数据
      localStorage.removeItem("user_session");
      // 重定向到登录页面
      window.location.href = "/Inscription/inscription.html";
    } else {
      console.error("Logout failed");
      alert("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("Erreur lors de la déconnexion. Veuillez réessayer.");
  }
}
