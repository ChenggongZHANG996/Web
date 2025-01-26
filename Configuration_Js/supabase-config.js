import { baseUrl } from "./base-url.js";

// 从全局 supabase 对象获取 createClient
const { createClient } = supabase;

// Supabase 配置
const SUPABASE_CONFIG = {
  // 数据库连接信息
  URL: "https://pbadzkgumtgginldmucd.supabase.co",
  ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWR6a2d1bXRnZ2lubGRtdWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1OTUzMTUsImV4cCI6MjA1MjE3MTMxNX0.azaJAbnVP2hSKQGvew6ulfc92Jn7k6tQx9LozgiDhAQ",

  // Auth 配置
  AUTH_CONFIG: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },

  // 数据库设置（从原config.php迁移）
  DB_CONFIG: {
    host: "pbadzkgumtgginldmucd.supabase.co",
    port: "5432",                                 
    name: "postgres",
    user: "postgres",
    password: "Chenggong1998@",
  },

  // 错误报告设置
  ERROR_REPORTING: true,

  // 时区设置
  TIMEZONE: "Europe/Paris",

  // 表名配置
  TABLES: {
    USERS: "users",
    PROFESSORS: "professors",
    STUDENTS: "students",
  },

  // API端点
  ENDPOINTS: {
    AUTH: "/auth/v1",
    REST: "/rest/v1",
  },
};

// 初始化 Supabase 客户端
const supabaseClient = createClient(
  SUPABASE_CONFIG.URL,
  SUPABASE_CONFIG.ANON_KEY,
  {
    auth: SUPABASE_CONFIG.AUTH_CONFIG,
  }
);

// 数据库查询函数（替代原PHP的supabaseQuery函数）
async function supabaseQuery(query, params = {}) {
  try {
    const { data, error } = await supabaseClient
      .from(query.split("?")[0])
      .select("*")
      .match(params);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

// 数据库更新函数（替代原PHP的updateDatabase函数）
async function updateDatabase(table, data, condition) {
  try {
    const { error } = await supabaseClient
      .from(table)
      .update(data)
      .match(condition);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Database update error:", error);
    throw error;
  }
}

// 导出配置和函数
export { SUPABASE_CONFIG, supabaseClient, supabaseQuery, updateDatabase };
