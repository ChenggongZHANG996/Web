import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";

class CalendarDB {
  constructor() {
    this.db = supabaseClient;
    // 添加缓存
    this.cache = {
      events: new Map(), // 事件缓存
      lastFetch: null, // 上次获取时间
      user: null, // 当前用户缓存
    };
  }

  // 获取缓存键
  getCacheKey(startDate, endDate) {
    return `${startDate}_${endDate}`;
  }

  // 检查缓存是否有效
  isCacheValid(startDate, endDate) {
    if (!this.cache.lastFetch) return false;

    const cacheKey = this.getCacheKey(startDate, endDate);
    const cacheAge = Date.now() - this.cache.lastFetch;
    // 缓存有效期为5分钟
    return this.cache.events.has(cacheKey) && cacheAge < 5 * 60 * 1000;
  }

  async getEvents(startDate, endDate) {
    try {
      const { data, error } = await this.db
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate)
        .lte('end_time', endDate);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error in getEvents:", error);
      throw error;
    }
  }

  async addEvent(eventData) {
    try {
      // 使用缓存的用户信息
      let user = this.cache.user;
      if (!user) {
        const {
          data: { user: currentUser },
          error: userError,
        } = await supabaseClient.auth.getUser();
        if (userError || !currentUser?.id) {
          throw new Error("需要用户认证");
        }
        user = currentUser;
        this.cache.user = user;
      }

      const formattedEventData = {
        title: eventData.title?.trim() || "",
        description: eventData.description?.trim() || "",
        start_at: eventData.start_timestamp,
        end_at: eventData.end_timestamp,
        color: eventData.color || "#4CAF50",
        user_id: user.id,
        professor_id: user.id,
        status: "active",
        location: eventData.location?.trim() || "",
        is_all_day: eventData.is_all_day ? 1 : 0,
      };

      // 基本验证
      if (
        !formattedEventData.title ||
        !formattedEventData.start_at ||
        !formattedEventData.end_at
      ) {
        throw new Error("缺少必要字段");
      }

      // 保存到数据库
      const { data: result, error } = await supabaseClient
        .from("professor_events_manual")
        .insert([formattedEventData])
        .select()
        .single();

      if (error) throw error;

      // 清除缓存，确保下次获取最新数据
      this.cache.events.clear();
      this.cache.lastFetch = null;

      return result;
    } catch (error) {
      console.error("Error in addEvent:", error);
      throw error;
    }
  }

  // 简化的日志方法
  logStyles = {
    info: "background: #2196F3; color: white; padding: 2px 5px; border-radius: 3px;",
    error:
      "background: #F44336; color: white; padding: 2px 5px; border-radius: 3px;",
  };

  log(type, message) {
    console.log(`%c ${type.toUpperCase()} `, this.logStyles[type], message);
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
    manual:
      "background: #FF5722; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;",
    highlight:
      "background: #E91E63; color: white; padding: 2px 5px; border-radius: 3px; font-weight: bold;",
  };

  // 添加格式化日志方法
  log(type, message, data = null) {
    console.log(`%c ${type.toUpperCase()} `, this.logStyles[type], message);
    if (data) {
      console.log("%c DATA ", this.logStyles.data, data);
    }
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

  async checkTableStructure() {
    try {
      const { data, error } = await supabaseClient
        .from("professor_events_manual")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Error checking table structure:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking table structure:", error);
      return false;
    }
  }
}

export const calendarDB = new CalendarDB();
