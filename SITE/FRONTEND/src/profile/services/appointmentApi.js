/**
 * src/profile/services/appointmentApi.js
 *
 * Appointment booking API — uses modular appointmentRoutes and shared publicClient.
 */

import api from "../../api/index.js";

/**
 * Book an appointment for a card.
 * @param {string} cardId
 * @param {{ startTime?: string, date?: string, time?: string, name: string, phone: string, email?: string, message?: string, durationMinutes?: number }} bookingData
 */
export async function bookAppointment(cardId, bookingData) {
  return api.appointments.book(cardId, bookingData);
}

/**
 * Fetch booked time slots for a card in a given month.
 * @param {string} cardId
 * @param {number} year  e.g. 2026
 * @param {number} month e.g. 9 (September)
 * @returns {Promise<Record<string, string[]>>} bookedSlots map
 */
export async function fetchAvailability(cardId, year, month) {
  return api.appointments.getAvailability(cardId, year, month);
}

/**
 * Fetch visitor's booked appointments.
 * @param {string} cardId
 */
export async function fetchMyAppointments(cardId) {
  return api.appointments.getMyAppointments(cardId);
}

/**
 * Cancel a booked appointment.
 * @param {string} appointmentId
 */
export async function cancelAppointment(appointmentId) {
  return api.appointments.cancel(appointmentId);
}
