import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";
import { courseDB } from "../database/3_cours.js";

class CourseService {
  constructor() {
    this.db = courseDB;
  }

  async getCourses() {
    try {
      return await this.db.getCourses();
    } catch (error) {
      console.error("Error in CourseService.getCourses:", error);
      throw error;
    }
  }

  // 添加其他课程相关的服务方法
}

export const courseService = new CourseService();
