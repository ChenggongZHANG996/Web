import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { studentDB } from "../database/4_gestion_etudiant.js";

class StudentService {
  constructor() {
    this.db = studentDB;
  }

  async getStudents(filters = { search: "", level: "all", status: "all" }) {
    try {
      return await this.db.getStudents(filters);
    } catch (error) {
      console.error("Error in StudentService.getStudents:", error);
      throw error;
    }
  }

  async createStudent(studentData) {
    try {
      return await this.db.createStudent(studentData);
    } catch (error) {
      console.error("Error in StudentService.createStudent:", error);
      throw error;
    }
  }

  async updateStudent(id, studentData) {
    try {
      return await this.db.updateStudent(id, studentData);
    } catch (error) {
      console.error("Error in StudentService.updateStudent:", error);
      throw error;
    }
  }

  async deleteStudent(id) {
    try {
      return await this.db.deleteStudent(id);
    } catch (error) {
      console.error("Error in StudentService.deleteStudent:", error);
      throw error;
    }
  }
}

export const studentService = new StudentService();
