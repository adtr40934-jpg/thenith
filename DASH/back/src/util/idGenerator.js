import crypto from "node:crypto";

const PUBLIC_ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

function generatePublicId() {
  const bytes = crypto.randomBytes(6);
  return [...bytes]
    .map((byte) => PUBLIC_ID_ALPHABET[byte % PUBLIC_ID_ALPHABET.length])
    .join("");
}

export default { generatePublicId };
