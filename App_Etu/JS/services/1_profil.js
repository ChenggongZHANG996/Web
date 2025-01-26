import { professorDB } from "../database/Prof_index.js";

class ProfileService {
  constructor() {
    this.db = professorDB;
  }

  async getProfileInfo(professorId) {
    try {
      const professor = await this.db.getProfessorInfo(professorId);

      if (!professor) {
        return {
          fullName: "",
          email: "",
          phone: "",
          address: "ESTIA, Bidart, France",
        };
      }

      return {
        fullName: `${professor.first_name} ${professor.last_name}`,
        email: professor.email,
        phone: professor.phone || "+33 6 12 34 56 78",
        address: "ESTIA, Bidart, France",
      };
    } catch (error) {
      console.error("Error in profile service:", error);
      throw error;
    }
  }

  async updateAddress(professorId, newAddress) {
    try {
      const { error } = await this.db.client
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
