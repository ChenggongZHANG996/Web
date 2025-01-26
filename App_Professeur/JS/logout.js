import { baseUrl } from "../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../Configuration_Js/supabase-config.js";
import { authService } from "../../Inscription/authentification.js";

export async function handleLogout() {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
    // 使用正常的字符串拼接
    window.location.href = baseUrl + "Inscription/inscription.html";
  } catch (error) {
    console.error("Logout error:", error);
    alert("Erreur lors de la déconnexion. Veuillez réessayer.");
  }
}
