import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { studentDB } from "../database/4_gestion_etudiant.js";

class StudentService {
  constructor() {
    this.db = studentDB;
  }

  async getStudents() {
    return await this.db.getStudents();
  }

  async createStudent(studentData) {
    return await this.db.createStudent(studentData);
  }

  async updateStudent(id, studentData) {
    return await this.db.updateStudent(id, studentData);
  }

  async deleteStudent(id) {
    return await this.db.deleteStudent(id);
  }
}

export const studentService = new StudentService();
