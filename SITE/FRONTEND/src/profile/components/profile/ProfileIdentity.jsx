import VerifiedBadge from "../ui/VerifiedBadge.jsx";

export default function ProfileIdentity({
  name,
  role,
  bio,
  displayName,
  displayRole,
  displayBio,
  verifiedLabel,
  isVerified,
  company,
}) {
  return (
    <div className="relative z-10 px-4">
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-1 flex items-center justify-center gap-1.5">
        <span>{displayName || name}</span>
        {isVerified && <VerifiedBadge label={verifiedLabel} />}
      </h1>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        {displayRole || role}
      </p>
      {company && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          {company}
        </p>
      )}
      <p className="text-sm lg:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed px-2 mb-6">
        {displayBio || bio}
      </p>
    </div>
  );
}
