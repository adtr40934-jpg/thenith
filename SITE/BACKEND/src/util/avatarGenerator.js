/**
 * Generates an initial-based avatar URL using the first letter of the user's name.
 * @param {string} seed - Name or text seed
 * @returns {string} Avatar URL
 */
export function generateAvatar(seed = "User") {
  const cleanSeed = seed?.trim() || "User";
  const firstChar = Array.from(cleanSeed)[0]?.toUpperCase() || "U";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstChar)}&background=4f46e5&color=fff&size=256&bold=true&length=1`;
}

export function generateGenderAvatar(genderOrSeed = "User", seed = "") {
  const actualSeed = seed || genderOrSeed || "User";
  return generateAvatar(actualSeed);
}

export default { generateAvatar, generateGenderAvatar };

