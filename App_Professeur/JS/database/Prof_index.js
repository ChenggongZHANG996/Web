import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { dbService } from `${baseUrl}Configuration_Js/db-service.js`;

class ProfessorDB {
  constructor() {
    this.db = dbService;
  }

  async getProfessorInfo(professorId) {
    try {
      if (!professorId) {
        throw new Error("Professor ID is required");
      }

      const { data, error } = await this.db.db
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          user_type
        `
        )
        .eq("id", professorId)
        .eq("user_type", "tutor")
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching professor info:", error);
      throw error;
    }
  }
}

export const professorDB = new ProfessorDB();
