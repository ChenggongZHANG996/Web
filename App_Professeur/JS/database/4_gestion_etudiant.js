import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class StudentDB {
  constructor() {
    this.db = supabaseClient;
  }

  // ... 数据库方法
}

// 确保导出名称正确
export const studentDB = new StudentDB();
