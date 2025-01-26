import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { dbService } from "../../../Configuration_Js/db-service.js";

class StudentDB {
  constructor() {
    this.db = dbService;
  }

  async getStudents() {
    try {
      const { data, error } = await this.db.db
        .from("student_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error in StudentDB.getStudents:", error);
      throw error;
    }
  }

  async createStudent(studentData) {
    try {
      const { data, error } = await this.db.db
        .from("student_profiles")
        .insert([studentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error in StudentDB.createStudent:", error);
      throw error;
    }
  }

  async updateStudent(id, studentData) {
    try {
      const { data, error } = await this.db.db
        .from("student_profiles")
        .update(studentData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error in StudentDB.updateStudent:", error);
      throw error;
    }
  }

  async deleteStudent(id) {
    try {
      const { error } = await this.db.db
        .from("student_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error in StudentDB.deleteStudent:", error);
      throw error;
    }
  }
}

export const studentDB = new StudentDB();
