import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class SpecialtyService {
  constructor() {
    this.db = profileDB;
  }

  async getSpecialties(professorId) {
    return await this.db.getSpecialties(professorId);
  }

  async addSpecialty(professorId, specialtyName) {
    return await this.db.addSpecialty(professorId, specialtyName);
  }

  async removeSpecialty(professorId, specialtyName) {
    return await this.db.removeSpecialty(professorId, specialtyName);
  }
}

export const specialtyService = new SpecialtyService();
