import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class CourseDB {
  constructor() {
    this.db = supabaseClient;
  }

  async getCourses() {
    try {
      const { data, error } = await this.db
        .from('professor_courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error in CourseDB.getCourses:", error);
      throw error;
    }
  }

  // 添加其他数据库操作方法
}

export const courseDB = new CourseDB();
