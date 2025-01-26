import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { dbService } from "../../../Configuration_Js/db-service.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class DashboardDB {
  constructor() {
    this.db = supabaseClient;
    console.log(
      "%c🔌 Base de données initialisée",
      "color: #4CAF50; font-weight: bold;"
    );
  }

  async getActiveCoursesCount() {
    try {
      console.log(
        "%c📊 Récupération du nombre de cours actifs...",
        "color: #2196F3; font-weight: bold;"
      );
      const { data, error } = await this.db
        .from("student_profiles")
        .select("id")
        .lt("overall_progress", 100);

      if (error) throw error;
      console.log("%c📚 Données des cours actifs:", "color: #2196F3", data);
      return data ? data.length : 0;
    } catch (error) {
      console.error(
        "%c❌ Erreur lors de la récupération du nombre de cours actifs:",
        "color: #f44336; font-weight: bold;",
        error
      );
      return 0;
    }
  }

  async getActiveStudentsCount() {
    try {
      console.log(
        "%c👥 Récupération du nombre d'étudiants actifs...",
        "color: #9C27B0; font-weight: bold;"
      );
      const { data, error } = await this.db
        .from("student_profiles")
        .select("id")
        .eq("academic_status", "active");

      if (error) throw error;
      console.log("%c👨‍🎓 Données des étudiants actifs:", "color: #9C27B0", data);
      return data ? data.length : 0;
    } catch (error) {
      console.error(
        "%c❌ Erreur lors de la récupération du nombre d'étudiants actifs:",
        "color: #f44336; font-weight: bold;",
        error
      );
      return 0;
    }
  }

  async getTotalTeachingHours() {
    try {
      console.log(
        "%c⏱️ Calcul des heures d'enseignement...",
        "color: #FF9800; font-weight: bold;"
      );

      const { data: profiles, error } = await this.db
        .from("student_profiles")
        .select("*")
        .eq("academic_status", "active");

      if (error) throw error;

      let totalTeachingHours = 0;
      const now = new Date();

      profiles?.forEach((profile) => {
        console.log(`%c👤 ÉTUDIANT:`, "color: #f44336; font-weight: bold;", {
          Nom: `${profile.first_name} ${profile.last_name}`,
          Niveau: profile.study_level,
          Progression: profile.overall_progress + "%",
        });

        // 确保 current_courses 是数组
        const courses = Array.isArray(profile.current_courses)
          ? profile.current_courses
          : typeof profile.current_courses === "string"
          ? JSON.parse(profile.current_courses)
          : [];

        let studentTotalHours = 0;

        courses.forEach((course) => {
          if (!course.schedule) {
            console.log(
              `%c⚠️ Pas de planning pour le cours:`,
              "color: #FFC107;",
              course.title
            );
            return;
          }

          // 1. 计算每节课的时长（小时）
          const startTime = course.schedule.start_time.split(":").map(Number);
          const endTime = course.schedule.end_time.split(":").map(Number);
          const hoursPerSession =
            endTime[0] - startTime[0] + (endTime[1] - startTime[1]) / 60;

          // 2. 计算课程周期
          const startDate = new Date(course.schedule.start_date);
          const endDate = new Date(course.schedule.end_date);
          const totalWeeks = Math.ceil(
            (endDate - startDate) / (7 * 24 * 60 * 60 * 1000)
          );

          // 3. 计算已经过去的周数
          const weeksPassed = Math.max(
            0,
            Math.ceil((now - startDate) / (7 * 24 * 60 * 60 * 1000))
          );

          // 4. 实际计入的周数（不超过总周数）
          const actualWeeks = Math.min(weeksPassed, totalWeeks);

          // 5. 计算这门课的总课时
          // 总课时 = 每节课时长(2小时) × 实际周数
          const totalHours = hoursPerSession * actualWeeks;

          // 6. 根据学生进度调整课时
          const adjustedHours = totalHours * (profile.overall_progress / 100);

          studentTotalHours += adjustedHours;

          console.log(`%c📚 COURS: ${course.title}`, "color: #2196F3;", {
            Jour: course.schedule.day_of_week,
            Horaire: `${course.schedule.start_time} - ${course.schedule.end_time}`,
            "Durée par séance": hoursPerSession.toFixed(1) + "h",
            "Nombre de semaines": actualWeeks,
            "Heures totales": totalHours.toFixed(1) + "h",
            Progression: profile.overall_progress + "%",
            "Heures comptabilisées": adjustedHours.toFixed(1) + "h",
          });
        });

        totalTeachingHours += studentTotalHours;

        console.log(
          `%c📊 TOTAL pour ${profile.first_name}:`,
          "color: #4CAF50; font-weight: bold;",
          studentTotalHours.toFixed(1) + "h"
        );
      });

      const roundedTotal = Math.round(totalTeachingHours * 10) / 10;
      console.log(
        "%c🎯 TOTAL DES HEURES D'ENSEIGNEMENT:",
        "color: #f44336; font-weight: bold; font-size: 16px;",
        roundedTotal + "h"
      );

      return roundedTotal;
    } catch (error) {
      console.error(
        "%c❌ ERREUR:",
        "color: #f44336; font-weight: bold; font-size: 14px;",
        error
      );
      return 0;
    }
  }
}

export const dashboardDB = new DashboardDB();
