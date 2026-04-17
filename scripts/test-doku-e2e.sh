#!/usr/bin/env bash
set -euo pipefail

# DOKU e2e dry-run helper for ARETON.id
# Purpose: verify signature generation + request format and capture evidence for 400 debugging.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/logs/doku-e2e"
mkdir -p "${OUT_DIR}"

if [[ -z "${DOKU_CLIENT_ID:-}" || -z "${DOKU_SECRET_KEY:-}" || -z "${DOKU_BASE_URL:-}" ]]; then
  echo "[ERROR] Missing env vars. Required: DOKU_CLIENT_ID, DOKU_SECRET_KEY, DOKU_BASE_URL"
  echo "[HINT] Export vars first, then re-run this script."
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "[ERROR] openssl is required"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "[ERROR] curl is required"
  exit 1
fi

REQUEST_ID="ARETON-$(date +%s)-$RANDOM"
REQUEST_TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
REQUEST_TARGET="/checkout/v1/payment"
PAYMENT_DUE_DATE="$(date -u -d '+1 day' +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+1d +"%Y-%m-%dT%H:%M:%SZ")"

BODY_FILE="${OUT_DIR}/${REQUEST_ID}.body.json"
HEADERS_FILE="${OUT_DIR}/${REQUEST_ID}.headers.txt"
RESPONSE_FILE="${OUT_DIR}/${REQUEST_ID}.response.json"
META_FILE="${OUT_DIR}/${REQUEST_ID}.meta.txt"

cat > "${BODY_FILE}" <<JSON
{
  "order": {
    "invoice_number": "${REQUEST_ID}",
    "amount": 10000,
    "callback_url": "https://api.areton.id/api/payments/doku-webhook",
    "payment_due_date": "${PAYMENT_DUE_DATE}"
  },
  "customer": {
    "name": "DOKU Sandbox Tester",
    "email": "tester+${REQUEST_ID}@areton.id",
    "phone": "6281234567890"
  }
}
JSON

DIGEST_RAW="$(openssl dgst -binary -sha256 "${BODY_FILE}" | openssl base64 -A)"
DIGEST_HEADER="SHA-256=${DIGEST_RAW}"

SIGN_COMPONENT="Client-Id:${DOKU_CLIENT_ID}\nRequest-Id:${REQUEST_ID}\nRequest-Timestamp:${REQUEST_TIMESTAMP}\nRequest-Target:${REQUEST_TARGET}\nDigest:${DIGEST_HEADER}"
SIGNATURE_RAW="$(printf "%s" "${SIGN_COMPONENT}" | openssl dgst -binary -sha256 -hmac "${DOKU_SECRET_KEY}" | openssl base64 -A)"
SIGNATURE_HEADER="HMACSHA256=${SIGNATURE_RAW}"

{
  echo "request_id=${REQUEST_ID}"
  echo "request_timestamp=${REQUEST_TIMESTAMP}"
  echo "request_target=${REQUEST_TARGET}"
  echo "doku_base_url=${DOKU_BASE_URL}"
  echo "digest=${DIGEST_HEADER}"
  echo "signature=${SIGNATURE_HEADER}"
} > "${META_FILE}"

HTTP_CODE=$(curl -sS -o "${RESPONSE_FILE}" -D "${HEADERS_FILE}" -w "%{http_code}" \
  -X POST "${DOKU_BASE_URL}${REQUEST_TARGET}" \
  -H "Content-Type: application/json" \
  -H "Client-Id: ${DOKU_CLIENT_ID}" \
  -H "Request-Id: ${REQUEST_ID}" \
  -H "Request-Timestamp: ${REQUEST_TIMESTAMP}" \
  -H "Signature: ${SIGNATURE_HEADER}" \
  -H "Digest: ${DIGEST_HEADER}" \
  --data @"${BODY_FILE}")

echo "[INFO] HTTP status: ${HTTP_CODE}"
echo "[INFO] Evidence saved:"
echo "  - ${BODY_FILE}"
echo "  - ${HEADERS_FILE}"
echo "  - ${RESPONSE_FILE}"
echo "  - ${META_FILE}"

if [[ "${HTTP_CODE}" -ge 400 ]]; then
  echo "[WARN] DOKU returned ${HTTP_CODE}. Share files above for sandbox verification."
  exit 2
fi

echo "[OK] DOKU request accepted. Continue payment flow + webhook validation in app stack."
