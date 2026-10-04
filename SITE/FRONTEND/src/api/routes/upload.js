import apiClient, { request } from "../client.js";

export const uploadRoutes = {
  uploadBase64: (field, base64Data) => {
    const payload =
      typeof base64Data === "string"
        ? { imageData: base64Data, image: base64Data }
        : base64Data;

    return request(`/upload/base64?field=${encodeURIComponent(field)}`, {
      method: "POST",
      data: payload,
    });
  },

  uploadFormData: async (field, file) => {
    const formData = file instanceof FormData ? file : new FormData();
    if (!(file instanceof FormData)) {
      formData.append("image", file);
    }

    const response = await apiClient.post("/upload", formData, {
      params: { field },
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};

export default uploadRoutes;
