import { dbService } from "../../../Configuration_Js/db-service.js";

class ProfileDB {
  constructor() {
    this.db = dbService;
  }

  async getSpecialties(professorId) {
    try {
      const { data, error } = await this.db.client
        .from("professor_specialties")
        .select("specialty_name")
        .eq("professor_id", professorId);

      if (error) throw error;
      return data.map((item) => item.specialty_name);
    } catch (error) {
      console.error("Error fetching specialties:", error);
      throw error;
    }
  }

  async addSpecialty(professorId, specialtyName) {
    try {
      const { data, error } = await this.db.client
        .from("professor_specialties")
        .insert([{ professor_id: professorId, specialty_name: specialtyName }]);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error adding specialty:", error);
      throw error;
    }
  }

  async removeSpecialty(professorId, specialtyName) {
    try {
      const { error } = await this.db.client
        .from("professor_specialties")
        .delete()
        .eq("professor_id", professorId)
        .eq("specialty_name", specialtyName);

      if (error) throw error;
    } catch (error) {
      console.error("Error removing specialty:", error);
      throw error;
    }
  }
}

export const profileDB = new ProfileDB();
