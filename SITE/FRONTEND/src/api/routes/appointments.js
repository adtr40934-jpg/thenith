import { publicClient } from "../client.js";

export const appointmentRoutes = {
  book: async (cardId, bookingData) => {
    const response = await publicClient.post(
      `/appointments/${encodeURIComponent(cardId)}`,
      bookingData,
    );
    return response.data;
  },

  getAvailability: async (cardId, year, month) => {
    const response = await publicClient.get(
      `/appointments/${encodeURIComponent(cardId)}/availability`,
      { params: { year, month } },
    );
    return response.data?.bookedSlots ?? {};
  },

  getMyAppointments: async (cardId) => {
    const response = await publicClient.get(
      `/appointments/${encodeURIComponent(cardId)}/my-appointments`,
    );
    return response.data?.appointments || [];
  },

  cancel: async (appointmentId) => {
    const response = await publicClient.delete(
      `/appointments/${encodeURIComponent(appointmentId)}`,
    );
    return response.data;
  },
};

export default appointmentRoutes;
