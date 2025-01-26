import { calendarDB } from "../database/2_calendrier.js";

class CalendarModel {
  constructor() {
    this.currentEvents = [];
    this.initialized = false;
    this.db = calendarDB;
  }

  async initialize() {
    if (!this.initialized) {
      await calendarDB.initializeTable();
      this.initialized = true;
    }
  }

  async loadEvents(startDate, endDate) {
    try {
      console.log("Loading events for period:", { startDate, endDate });

      const events = await calendarDB.getEvents(startDate, endDate);
      console.log("Loaded events:", events);
      return events;
    } catch (error) {
      console.error("Error in loadEvents:", error);
      return [];
    }
  }

  async addEvent(eventData) {
    try {
      // 直接使用时间戳，不做拆分
      const formattedData = {
        ...eventData,
        start_timestamp: eventData.start,
        end_timestamp: eventData.end,
      };

      // 删除多余的字段
      delete formattedData.start;
      delete formattedData.end;

      return await this.db.addEvent(formattedData);
    } catch (error) {
      console.error("Error in CalendarModel.addEvent:", error);
      throw error;
    }
  }
}

export const calendarModel = new CalendarModel();
