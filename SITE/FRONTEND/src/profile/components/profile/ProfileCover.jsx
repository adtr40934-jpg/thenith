export default function ProfileCover({ coverImage = "", coverText = "" }) {
  return (
    <div className="absolute top-0 start-0 end-0 h-44 sm:h-52 lg:h-56 profile-gradient -mx-4 lg:-mx-6 rounded-none lg:rounded-t-3xl -mt-4 lg:-mt-6 overflow-hidden flex items-center justify-center pointer-events-none">
      {coverImage ? (
        <img
          src={coverImage}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] dark:bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:16px_16px] opacity-10 dark:opacity-15" />

          {coverText ? (
            <span className="relative z-10 text-3xl sm:text-5xl md:text-6xl lg:text-5xl font-black tracking-[0.2em] sm:tracking-[0.28em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-slate-900/35 via-indigo-900/45 to-slate-900/35 dark:from-white/35 dark:via-indigo-200/45 dark:to-white/25 select-none font-sans drop-shadow-sm  text-center">
              {coverText}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}
