import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { calendarDB } from `${baseUrl}App_Professeur/JS/database/2_calendrier.js`;

class CalendarService {
  constructor() {
    this.db = calendarDB;
    this.initialized = false;
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.db.initializeTable();
      this.initialized = true;
    }
  }

  async getEvents(startDate, endDate) {
    try {
      console.log("Service getEvents:", { startDate, endDate }); // 调试日志
      await this.ensureInitialized();
      return await this.db.getEvents(startDate, endDate);
    } catch (error) {
      console.error("Service getEvents error:", error);
      throw error;
    }
  }

  async addEvent(eventData) {
    console.log("=== CalendarService.addEvent Started ===");
    console.log("Input event data:", eventData);

    try {
      await this.ensureInitialized();
      console.log("Table initialization checked");

      // 验证日期时间格式
      console.log("Validating date/time format...");
      const startDateTime = `${eventData.start_date}T${eventData.start_time}`;
      const endDateTime = `${eventData.end_date}T${eventData.end_time}`;

      console.log("Formatted date/time:", {
        start: startDateTime,
        end: endDateTime,
      });

      // 调用数据库
      console.log("Calling database layer...");
      const result = await this.db.addEvent(eventData);
      console.log("Database result:", result);

      console.log("=== CalendarService.addEvent Completed ===");
      return result;
    } catch (error) {
      console.error("=== CalendarService.addEvent Failed ===");
      console.error("Error details:", error);
      console.error("Error stack:", error.stack);
      throw error;
    }
  }

  async updateEvent(eventId, eventData) {
    return await this.db.updateEvent(eventId, eventData);
  }

  async deleteEvent(eventId) {
    return await this.db.deleteEvent(eventId);
  }

  // 辅助方法：格式化事件数据
  formatEventData(rawData) {
    return {
      title: rawData.title,
      description: rawData.description || "",
      event_type: rawData.event_type,
      start_time: new Date(rawData.start_time).toISOString(),
      end_time: new Date(rawData.end_time).toISOString(),
      location: rawData.location || "",
      color: rawData.color || "#3788d8",
      is_all_day: rawData.is_all_day || false,
      status: rawData.status || "pending",
      reminder_time: rawData.reminder_time || null,
    };
  }
}

export const calendarService = new CalendarService();
