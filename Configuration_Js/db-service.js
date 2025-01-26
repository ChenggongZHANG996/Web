import { baseUrl } from "./base-url.js";
import { supabaseClient } from "./supabase-config.js";

// 数据库服务类
class DatabaseService {
  constructor() {
    this.db = supabaseClient;
  }

  // 执行查询
  async query(table, conditions = {}) {
    try {
      let query = this.db.from(table).select("*");

      // 添加条件
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  // 执行带排序的查询
  async queryOrdered(table, orderBy, ascending = true) {
    try {
      const { data, error } = await this.db
        .from(table)
        .select("*")
        .order(orderBy, { ascending });

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  // 插入数据
  async insert(table, data) {
    try {
      const { data: result, error } = await this.db
        .from(table)
        .insert(data)
        .select();

      if (error) throw error;
      return result;
    } catch (error) {
      return null;
    }
  }

  // 更新数据
  async update(table, updates, conditions) {
    try {
      let query = this.db.from(table).update(updates);

      // 添加条件
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query.select();
      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  // 删除数据
  async delete(table, conditions) {
    try {
      let query = this.db.from(table).delete();

      // 添加条件
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error) {
      return false;
    }
  }
}

// 创建并导出数据库服务实例
export const dbService = new DatabaseService();
