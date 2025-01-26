import { dbService } from "../../../Configuration_Js/db-service.js";

class ProfessorDB {
  constructor() {
    this.db = dbService;
  }

  async getProfessorInfo(professorId) {
    try {
      const { data, error } = await this.db.client
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
