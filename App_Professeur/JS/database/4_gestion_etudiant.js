import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { dbService } from "../../../Configuration_Js/db-service.js";

class StudentDB {
  constructor() {
    this.db = dbService;
  }

  async getStudents(filters = { search: "", level: "all", status: "all" }) {
    try {
      let query = this.db.db
        .from("student_profiles")
        .select("*");

      // 应用搜索过滤
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      // 应用级别过滤
      if (filters.level && filters.level !== "all") {
        query = query.eq("study_level", filters.level);
      }

      // 应用状态过滤
      if (filters.status && filters.status !== "all") {
        query = query.eq("academic_status", filters.status);
      }

      // 添加排序
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

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
