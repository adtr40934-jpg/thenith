import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MultiDatePicker({ selectedDates, onChange, language = "ar" }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames =
    language === "ar"
      ? [
          "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
          "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
        ]
      : [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December",
        ];

  const daysOfWeek =
    language === "ar"
      ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const toggleDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const newDates = selectedDates.includes(dateStr)
      ? selectedDates.filter((d) => d !== dateStr)
      : [...selectedDates, dateStr].sort();
    onChange(newDates);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8 sm:h-10 sm:w-10"></div>);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const isSelected = selectedDates.includes(dateStr);
    
    // Check if it's in the past (to optionally disable, though we might want to allow selection for future dates only)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisDate = new Date(year, month, i);
    const isPast = thisDate < today;

    days.push(
      <button
        key={i}
        type="button"
        disabled={isPast}
        onClick={() => toggleDate(i)}
        className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs sm:text-sm transition-all ${
          isSelected
            ? "bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/30"
            : isPast
            ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
            : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        }`}
      >
        {i}
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={language === "ar" ? handleNextMonth : handlePrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {language === "ar" ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <div className="font-bold text-slate-800 dark:text-slate-200">
          {monthNames[month]} {year}
        </div>
        <button
          type="button"
          onClick={language === "ar" ? handlePrevMonth : handleNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {language === "ar" ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] font-bold text-slate-400 sm:text-xs">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 justify-items-center">
        {days}
      </div>
      
      {selectedDates.length > 0 && (
        <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-wrap gap-1.5 justify-center">
          {selectedDates.map(date => (
            <span key={date} className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-[10px] px-2 py-1 rounded-md font-semibold">
              {date}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
