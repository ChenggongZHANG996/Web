import { profileDB } from "../database/1_profil.js";

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
