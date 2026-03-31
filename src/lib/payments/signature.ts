import crypto from "crypto";

function md5Hash(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function buildParamsString(
  payload: Record<string, unknown>,
  keys: string[],
  storePassHash: string,
): string {
  const pairs = keys
    .filter((key) => key && key in payload)
    .map((key) => `${key}=${normalizeValue(payload[key])}`);

  pairs.push(`store_passwd=${storePassHash}`);
  return pairs.join("&");
}

export function verifySSLCommerzCallbackSignature(
  payload: Record<string, unknown>,
): boolean {
  const verifySign = normalizeValue(payload.verify_sign).toLowerCase();
  const verifyKeyRaw = normalizeValue(payload.verify_key);
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;

  if (!verifySign || !verifyKeyRaw || !storePassword) {
    return false;
  }

  const storePassHash = md5Hash(storePassword);
  const keyList = verifyKeyRaw
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);

  if (keyList.length === 0) {
    return false;
  }

  const inOrderString = buildParamsString(payload, keyList, storePassHash);
  const sortedString = buildParamsString(
    payload,
    [...keyList].sort((a, b) => a.localeCompare(b)),
    storePassHash,
  );

  const candidateHashes = [md5Hash(inOrderString), md5Hash(sortedString)].map(
    (hash) => hash.toLowerCase(),
  );

  return candidateHashes.includes(verifySign);
}
