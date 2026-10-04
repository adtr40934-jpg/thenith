async function getDaysRemaining(expiresAt) {
  if (!expiresAt) return null;
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000),
  );
}


export default { getDaysRemaining };
