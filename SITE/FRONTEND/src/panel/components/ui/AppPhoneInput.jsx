import { useState, useRef, useEffect } from "react";
import { parsePhoneNumber, getCountries, getCountryCallingCode } from "react-phone-number-input";
import { Search, ChevronDown } from "lucide-react";

// Map of country codes to emoji flags
function getFlagEmoji(countryCode) {
  const codePoints = [...countryCode.toUpperCase()].map(
    (char) => 0x1f1e6 - 65 + char.charCodeAt(0)
  );
  return String.fromCodePoint(...codePoints);
}

// Arabic country names for common countries
const arCountryNames = {
  EG: "مصر", SA: "السعودية", AE: "الإمارات", KW: "الكويت",
  QA: "قطر", BH: "البحرين", OM: "عمان", JO: "الأردن",
  LB: "لبنان", PS: "فلسطين", IQ: "العراق", SY: "سوريا",
  YE: "اليمن", LY: "ليبيا", SD: "السودان", MA: "المغرب",
  DZ: "الجزائر", TN: "تونس", US: "أمريكا", GB: "بريطانيا",
  TR: "تركيا", DE: "ألمانيا", FR: "فرنسا", IT: "إيطاليا",
  ES: "إسبانيا", CA: "كندا", AU: "أستراليا", IN: "الهند",
  PK: "باكستان", IR: "إيران",
};

// Priority countries shown first
const PRIORITY_COUNTRIES = ["EG", "SA", "AE", "KW", "QA", "BH", "OM", "JO", "LB", "PS", "IQ", "SY", "YE", "LY", "SD", "MA", "DZ", "TN", "US", "GB", "TR"];

function buildCountryList() {
  const all = getCountries();
  const priority = PRIORITY_COUNTRIES.filter((c) => all.includes(c));
  const rest = all.filter((c) => !priority.includes(c));
  return [...priority, ...rest];
}

const ALL_COUNTRIES = buildCountryList();

export default function AppPhoneInput({ value, onChange, prefixText = "", invalid = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Parse the stored value to extract country + number
  let storedE164 = value || "";

  // Strip prefix (e.g. "https://wa.me/" or "tel:+") to get the raw number
  if (prefixText && storedE164.startsWith(prefixText)) {
    storedE164 = storedE164.slice(prefixText.length);
  }
  if (!storedE164.startsWith("+")) storedE164 = "+" + storedE164.replace(/\D/g, "");

  let initialCountry = "EG";
  if (storedE164) {
    try {
      const parsed = parsePhoneNumber(storedE164);
      if (parsed?.country) initialCountry = parsed.country;
    } catch {}
  }
  
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const callingCode = getCountryCallingCode(selectedCountry);

  let localNumber = "";
  if (storedE164) {
    const digits = storedE164.replace(/\D/g, "");
    if (digits.startsWith(callingCode)) {
      localNumber = digits.slice(callingCode.length);
    } else {
      localNumber = digits;
    }
  }

  // When value changes externally, re-detect
  useEffect(() => {
    try {
      const parsed = parsePhoneNumber(storedE164);
      if (parsed?.country) setSelectedCountry(parsed.country);
    } catch {}
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setOpen(false);
    setSearch("");
    if (!localNumber) {
      onChange("");
      return;
    }
    const newCode = getCountryCallingCode(country);
    const newE164 = `+${newCode}${localNumber}`;
    onChange(prefixText ? `${prefixText}${newE164.replace("+", "")}` : newE164);
  };

  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      onChange("");
      return;
    }
    const newE164 = `+${callingCode}${digits}`;
    onChange(prefixText ? `${prefixText}${newE164.replace("+", "")}` : newE164);
  };

  const filtered = ALL_COUNTRIES.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const nameAr = arCountryNames[c] || "";
    const code = getCountryCallingCode(c);
    return (
      c.toLowerCase().includes(term) ||
      nameAr.includes(search) ||
      `+${code}`.includes(search)
    );
  });

  return (
    <div className="relative w-full" ref={dropdownRef} dir="ltr">
      <div className={`flex h-11 w-full overflow-hidden rounded-xl border bg-slate-50 focus-within:ring-1 dark:bg-slate-900/60 ${invalid ? "border-rose-500 focus-within:border-rose-500 focus-within:ring-rose-500" : "border-slate-200 focus-within:border-indigo-500 focus-within:ring-indigo-500 dark:border-slate-800"}`}>
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 border-r border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <span className="text-base leading-none">{getFlagEmoji(selectedCountry)}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">+{callingCode}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Phone number input */}
        <input
          type="tel"
          value={localNumber}
          onChange={handleNumberChange}
          placeholder=""
          className="flex-1 bg-transparent px-3 py-2 text-sm font-semibold outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
          dir="ltr"
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950">
          {/* Search */}
          <div className="p-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
              <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن الدولة..."
                className="flex-1 bg-transparent text-sm font-semibold outline-none"
              />
            </div>
          </div>

          {/* List */}
          <ul className="max-h-60 overflow-y-auto px-2 pb-2">
            {filtered.length === 0 && (
              <li className="py-4 text-center text-xs text-slate-400">لا توجد نتائج</li>
            )}
            {filtered.map((country) => {
              const code = getCountryCallingCode(country);
              const nameAr = arCountryNames[country];
              return (
                <li key={country}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-900 ${
                      selectedCountry === country ? "bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <span className="text-base leading-none">{getFlagEmoji(country)}</span>
                    <span className="flex-1 text-start">{nameAr || country}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">+{code}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
