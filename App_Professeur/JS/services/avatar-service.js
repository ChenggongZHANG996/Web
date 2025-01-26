import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from `${baseUrl}Configuration_Js/supabase-config.js`;

class AvatarService {
  constructor() {
    this.bucketName = "avatars";
  }

  // 生成唯一的文件名
  generateFileName(userId, fileExtension) {
    return `${userId}-${Date.now()}${fileExtension}`;
  }

  // 上传头像
  async uploadAvatar(userId, file) {
    try {
      // 检查文件类型和大小
      if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file");
      }
      if (file.size > 5 * 1024 * 1024) {
        // 5MB 限制
        throw new Error("Image size cannot exceed 5MB");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = this.generateFileName(userId, `.${fileExt}`);
      const filePath = `${userId}/${fileName}`;

      // 上传文件到 Storage
      const { data, error } = await supabaseClient.storage
        .from(this.bucketName)
        .upload(filePath, file);

      if (error) throw error;

      // 获取公共URL
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from(this.bucketName).getPublicUrl(filePath);

      // 更新用户头像URL
      await this.updateUserAvatarUrl(userId, publicUrl);

      return publicUrl;
    } catch (error) {
      throw error;
    }
  }

  // 更新用户头像URL
  async updateUserAvatarUrl(userId, avatarUrl) {
    try {
      const { error } = await supabaseClient
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (error) throw error;
    } catch (error) {
      throw error;
    }
  }

  // 获取用户当前头像
  async getCurrentAvatar(userId) {
    try {
      const { data, error } = await supabaseClient
        .from("users")
        .select("avatar_url")
        .eq("id", userId)
        .single();

      if (error) throw error;

      const defaultAvatarUrl = `${supabaseClient.storageUrl}/object/public/avatars/test/default-avatar.png`;

      let finalUrl;
      if (
        !data?.avatar_url ||
        data.avatar_url.includes("/App_Professeur/Image/")
      ) {
        finalUrl = defaultAvatarUrl;
        this.updateUserAvatarUrl(userId, defaultAvatarUrl).catch(() => {});
      } else {
        finalUrl = data.avatar_url;
      }

      return finalUrl;
    } catch (error) {
      return `${supabaseClient.storageUrl}/object/public/avatars/test/default-avatar.png`;
    }
  }

  // 删除旧头像
  async deleteOldAvatar(userId, oldAvatarUrl) {
    try {
      if (!oldAvatarUrl || oldAvatarUrl.includes("default-avatar.png")) {
        return;
      }

      const path = oldAvatarUrl.split("/").pop();
      const { error } = await supabaseClient.storage
        .from(this.bucketName)
        .remove([`${userId}/${path}`]);

      if (error) throw error;
    } catch (error) {}
  }
}

export const avatarService = new AvatarService();
