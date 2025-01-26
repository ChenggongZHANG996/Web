import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";
import { calendarDB } from "../database/calendar.js";

class CalendarService {
  constructor() {
    this.db = calendarDB;
  }
  // ... 其他代码
} 