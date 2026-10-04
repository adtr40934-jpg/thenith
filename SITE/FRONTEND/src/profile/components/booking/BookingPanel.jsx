// BookingPanel removed during rollback of Google Calendar integration

import { bookAppointment } from "../../services/appointmentApi.js";

export default function BookingPanel({ cardId }) {
  const [dateTime, setDateTime] = useState("");
  const [status, setStatus] = useState(null);

  const handleBook = async () => {
    try {
      const data = await bookAppointment(cardId, dateTime);
      setStatus({ ok: true, msg: "Appointment booked!" });
    } catch (e) {
      const msg = e.response?.data?.message || "Error booking appointment";
      setStatus({ ok: false, msg });
    }
  };

  return (
    <div className="p-4 w-full max-w-md mx-auto">
      <label className="block mb-2 font-medium">Select date & time</label>
      <input
        type="datetime-local"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
        className="border rounded p-2 w-full mb-4"
      />
      <button
        onClick={handleBook}
        disabled={!dateTime}
        className="bg-primary text-white py-2 px-4 rounded disabled:opacity-50"
      >
        Book
      </button>
      {status && (
        <p className={status.ok ? "text-green-600 mt-2" : "text-red-600 mt-2"}>
          {status.msg}
        </p>
      )}
    </div>
  );
}
