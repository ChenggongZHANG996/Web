import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";
import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { professorDB } from `${baseUrl}App_Professeur/JS/database/Prof_index.js`;

class ProfessorService {
  constructor() {
    this.client = supabaseClient;
  }

  async getProfessorProfile(professorId) {
    try {
      const { data, error } = await this.client
        .from("users")
        .select("first_name, last_name")
        .eq("id", professorId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching professor profile:", error);
      throw error;
    }
  }
}

export const professorService = new ProfessorService();
