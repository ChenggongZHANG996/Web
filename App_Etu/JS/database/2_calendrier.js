import { dbService } from "../../../Configuration_Js/db-service.js";

class CalendarDB {
  constructor() {
    this.db = dbService;
  }

  async getEvents(startDate, endDate) {
    try {
      console.log("DB getEvents:", { startDate, endDate });

      // 获取手动添加的事件
      const { data: manualEvents, error: manualError } = await this.db.client
        .from("professor_events_manual")
        .select("*")
        .gte("start_timestamp", `${startDate}T00:00:00`)
        .lte("end_timestamp", `${endDate}T23:59:59`);

      if (manualError) throw manualError;

      // 处理手动添加的事件
      const processedEvents = (manualEvents || []).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        start: event.start_timestamp,
        end: event.end_timestamp,
        color: event.color || "#4CAF50",
        professor_id: event.professor_id,
        user_id: event.user_id,
        status: event.status || "active",
        location: event.location,
        is_all_day: event.is_all_day || false,
        event_type: "manual",
      }));

      return processedEvents;
    } catch (error) {
      console.error("DB getEvents error:", error);
      throw error;
    }
  }

  // 添加日志样式
  logStyles = {
    info: "background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;",
    success:
      "background: #4CAF50; color: white; padding: 2px 5px; border-radius: 3px;",
    warning:
      "background: #FFC107; color: black; padding: 2px 5px; border-radius: 3px;",
    error:
      "background: #F44336; color: white; padding: 2px 5px; border-radius: 3px;",
    data: "background: #9C27B0; color: white; padding: 2px 5px; border-radius: 3px;",
  };

  // 添加格式化日志方法
  log(type, message, data = null) {
    console.log(`%c ${type.toUpperCase()} `, this.logStyles[type], message);
    if (data) {
      console.log("%c DATA ", this.logStyles.data, data);
    }
  }

  async addEvent(eventData) {
    try {
      this.log("info", "=== Starting Event Creation ===");
      this.log("data", "Raw Input Data:", eventData);

      // 获取当前用户ID并验证
      const {
        data: { user },
        error: userError,
      } = await this.db.client.auth.getUser();

      if (userError || !user?.id) {
        this.log("error", "Authentication error:", userError);
        throw new Error("User authentication required");
      }

      // 构建事件数据 - 处理字段名映射
      const formattedEventData = {
        title: eventData.title?.trim() || "",
        description: eventData.description?.trim() || "",
        // 支持两种字段名格式
        start_timestamp: eventData.start_timestamp || eventData.start,
        end_timestamp: eventData.end_timestamp || eventData.end,
        color: eventData.color || "#4CAF50",
        user_id: user.id,
        professor_id: user.id,
        status: "active",
        location: eventData.location?.trim() || "",
        is_all_day: eventData.is_all_day || 0,
      };

      this.log("info", "Formatted event data:", formattedEventData);

      // 验证必填字段
      if (!formattedEventData.title) {
        throw new Error("Title is required");
      }
      if (!formattedEventData.start_timestamp) {
        throw new Error("Start time is required");
      }
      if (!formattedEventData.end_timestamp) {
        throw new Error("End time is required");
      }

      // 验证时间逻辑
      const startTime = new Date(formattedEventData.start_timestamp);
      const endTime = new Date(formattedEventData.end_timestamp);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        this.log("error", "Invalid timestamp format", {
          start: formattedEventData.start_timestamp,
          end: formattedEventData.end_timestamp,
        });
        throw new Error("Invalid timestamp format");
      }

      if (startTime >= endTime) {
        throw new Error("End time must be after start time");
      }

      // 保存到数据库
      this.log("info", "Saving to database...");
      const { data, error } = await this.db.client
        .from("professor_events_manual")
        .insert([formattedEventData])
        .select()
        .single();

      if (error) {
        this.log("error", "Database error:", error);
        throw error;
      }

      this.log("success", "Event saved successfully");
      this.log("data", "Saved Event:", data);
      return data;
    } catch (error) {
      this.log("error", "Failed to save event:", error);
      throw error;
    }
  }

  // 验证UUID格式的辅助函数
  isValidUUID(uuid) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  async initializeTable() {
    try {
      // 检查手动事件表是否存在
      const { error } = await this.db.client
        .from("professor_events_manual")
        .select("id")
        .limit(1);

      if (error && error.code === "42P01") {
        console.log("Manual events table does not exist, creating...");
        await this.createEventTable();
      }
    } catch (error) {
      console.error("Error checking/initializing table:", error);
    }
  }

  async createEventTable() {
    try {
      await this.db.client.query(`
        DROP TABLE IF EXISTS professor_events_manual;
        CREATE TABLE professor_events_manual (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          start_timestamp TIMESTAMP NOT NULL,
          end_timestamp TIMESTAMP NOT NULL,
          color TEXT DEFAULT '#4CAF50',
          user_id UUID NOT NULL,
          professor_id UUID,
          status TEXT DEFAULT 'active',
          location TEXT,
          is_all_day INTEGER DEFAULT 0
        );
      `);

      console.log("Successfully recreated professor_events_manual table");
    } catch (error) {
      console.error("Error creating table:", error);
      throw error;
    }
  }

  async updateEvent(eventId, eventData) {
    try {
      const { data, error } = await this.db.client
        .from("professor_events_manual")
        .update(eventData)
        .eq("id", eventId)
        .select();

      if (error) {
        console.error("DB updateEvent error:", error);
        throw error;
      }

      return data[0];
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }

  async deleteEvent(eventId) {
    try {
      const { error } = await this.db.client
        .from("professor_events_manual")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("DB deleteEvent error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }
}

export const calendarDB = new CalendarDB();
