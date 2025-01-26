import { baseUrl } from "../../../Configuration_Js/base-url.js";
import { supabaseClient } from "../../../Configuration_Js/supabase-config.js";
import { professorDB } from "../database/Prof_index.js";

class ProfileService {
  constructor() {
    this.db = professorDB;
  }

  async getProfileInfo(professorId) {
    try {
      if (!professorId) {
        console.warn("No professor ID provided, returning default profile");
        return this.getDefaultProfile();
      }

      const professor = await this.db.getProfessorInfo(professorId);

      if (!professor) {
        console.warn("No professor found, returning default profile");
        return this.getDefaultProfile();
      }

      return {
        fullName: `${professor.first_name} ${professor.last_name}`,
        email: professor.email,
        phone: professor.phone || "+33 6 12 34 56 78",
        address: "ESTIA, Bidart, France",
      };
    } catch (error) {
      console.error("Error in profile service:", error);
      return this.getDefaultProfile();
    }
  }

  getDefaultProfile() {
    return {
      fullName: "",
      email: "",
      phone: "",
      address: "ESTIA, Bidart, France",
    };
  }

  async updateAddress(professorId, newAddress) {
    try {
      if (!professorId || !newAddress) {
        throw new Error("Professor ID and new address are required");
      }

      const { error } = await this.db.db
        .from("users")
        .update({ address: newAddress })
        .eq("id", professorId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating address:", error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();
