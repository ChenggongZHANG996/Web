import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class StudentDB {
  constructor(dbService) {
    console.log("=== StudentDB Constructor START ===");
    this.db = dbService;
    console.log("Database client initialized:", {
      isInitialized: !!this.db,
      hasClient: !!this.db?.client,
    });
    console.log("=== StudentDB Constructor END ===");
  }

  async getStudents(filters = {}, page = 1, perPage = 10) {
    try {
      console.log("=== getStudents START ===");
      console.log("1. Input parameters:", { filters, page, perPage });

      // 构建基础查询
      console.log("2. Building base query");
      let query = this.db.from("student_profiles").select(
        `
          id,
          student_id,
          first_name,
          last_name,
          email,
          phone,
          birth_date,
          address,
          study_level,
          major,
          department,
          student_number,
          entry_year,
          academic_status,
          current_courses,
          course_history,
          overall_progress,
          course_grades,
          achievements,
          assigned_professor_id,
          created_at,
          updated_at,
          last_login_at,
          notes,
          special_requirements,
          language_preferences
        `,
        { count: "exact" }
      );

      // 应用过滤器
      if (filters.search) {
        console.log("3. Applying search filter:", filters.search);
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},student_number.ilike.${searchTerm}`
        );
      }

      if (filters.level !== "all") {
        console.log("3. Applying level filter:", filters.level);
        query = query.eq("study_level", filters.level.toUpperCase());
      }

      if (filters.status !== "all") {
        console.log("3. Applying status filter:", filters.status);
        query = query.eq("academic_status", filters.status);
      }

      // 应用分页
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      console.log("4. Applying pagination:", { from, to });
      query = query.range(from, to).order("created_at", { ascending: false });

      // 执行查询
      console.log("5. Executing query");
      const { data, error, count } = await query;

      if (error) {
        console.error("6. ERROR: Database query failed:", error);
        throw error;
      }

      console.log("6. Query successful:", {
        resultsCount: data?.length || 0,
        totalCount: count || 0,
        firstRecord: data?.[0],
      });

      console.log("=== getStudents END ===");
      return { students: data || [], total: count || 0 };
    } catch (error) {
      console.error("ERROR in getStudents:", error);
      throw error;
    }
  }

  async createStudent(studentData) {
    try {
      const { data, error } = await this.db
        .from("student_profiles")
        .insert([studentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating student:", error);
      throw error;
    }
  }

  async updateStudent(id, studentData) {
    try {
      const { data, error } = await this.db
        .from("student_profiles")
        .update(studentData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  }

  async deleteStudent(id) {
    try {
      const { error } = await this.db
        .from("student_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  }

  async getStudentDetails(id) {
    try {
      const { data, error } = await this.db
        .from("student_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching student details:", error);
      throw error;
    }
  }

  async importStudents(formData) {
    try {
      // 这里需要根据你的后端API进行调整
      const response = await fetch("/api/students/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error importing students:", error);
      throw error;
    }
  }
}

export const studentDB = new StudentDB(supabaseClient);
