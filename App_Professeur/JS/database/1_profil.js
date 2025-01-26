import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { dbService } from "../../../Configuration_Js/db-service.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class ProfileDB {
  constructor() {
    this.db = dbService;
  }

  async getSpecialties(professorId) {
    try {
      const data = await this.db.query("professor_specialties", {
        professor_id: professorId,
      });

      if (!data) return [];
      return data.map((item) => item.specialty_name);
    } catch (error) {
      console.error("Error fetching specialties:", error);
      return [];
    }
  }

  async addSpecialty(professorId, specialtyName) {
    try {
      const result = await this.db.insert("professor_specialties", {
        professor_id: professorId,
        specialty_name: specialtyName,
      });
      return result;
    } catch (error) {
      console.error("Error adding specialty:", error);
      throw error;
    }
  }

  async removeSpecialty(professorId, specialtyName) {
    try {
      const result = await this.db.delete("professor_specialties", {
        professor_id: professorId,
        specialty_name: specialtyName,
      });
      return result;
    } catch (error) {
      console.error("Error removing specialty:", error);
      throw error;
    }
  }
}

export const profileDB = new ProfileDB();
