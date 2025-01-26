import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { professorDB } from "../database/Prof_index.js";

class ProfessorService {
  constructor() {
    this.db = professorDB;
  }

  async getProfessorProfile(professorId) {
    return await this.db.getProfessorInfo(professorId);
  }
}

export const professorService = new ProfessorService();
