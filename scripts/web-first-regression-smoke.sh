#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="${1:-/home/escort/docs}"
STAMP="$(date -u +%Y%m%d_%H%M%S)"
OUT_FILE="${OUT_DIR%/}/web-first-smoke-report-${STAMP}.md"

WEB_URL="${WEB_URL:-https://areton.id}"
API_URL="${API_URL:-https://api.areton.id/api}"
WEB_AUTH_COOKIE="${WEB_AUTH_COOKIE:-}"
API_BEARER_TOKEN="${API_BEARER_TOKEN:-}"
BOOKING_ID_SAMPLE="${BOOKING_ID_SAMPLE:-}"
PAYMENT_ID_SAMPLE="${PAYMENT_ID_SAMPLE:-}"
CHAT_BOOKING_ID_SAMPLE="${CHAT_BOOKING_ID_SAMPLE:-${BOOKING_ID_SAMPLE}}"

mkdir -p "$OUT_DIR"

check_url() {
  local url="$1"
  local code ttfb total
  code=$(curl -o /dev/null -sS -w "%{http_code}" "$url" || echo "000")
  ttfb=$(curl -o /dev/null -sS -w "%{time_starttransfer}" "$url" || echo "0")
  total=$(curl -o /dev/null -sS -w "%{time_total}" "$url" || echo "0")
  echo "| $url | $code | ${ttfb}s | ${total}s |"
}

check_url_with_cookie() {
  local url="$1"
  local code ttfb total
  code=$(curl -o /dev/null -sS -w "%{http_code}" -H "Cookie: ${WEB_AUTH_COOKIE}" "$url" || echo "000")
  ttfb=$(curl -o /dev/null -sS -w "%{time_starttransfer}" -H "Cookie: ${WEB_AUTH_COOKIE}" "$url" || echo "0")
  total=$(curl -o /dev/null -sS -w "%{time_total}" -H "Cookie: ${WEB_AUTH_COOKIE}" "$url" || echo "0")
  echo "| $url | $code | ${ttfb}s | ${total}s |"
}

check_api_with_token() {
  local path="$1"
  local url="${API_URL}${path}"
  local code ttfb total
  code=$(curl -o /dev/null -sS -w "%{http_code}" -H "Authorization: Bearer ${API_BEARER_TOKEN}" "$url" || echo "000")
  ttfb=$(curl -o /dev/null -sS -w "%{time_starttransfer}" -H "Authorization: Bearer ${API_BEARER_TOKEN}" "$url" || echo "0")
  total=$(curl -o /dev/null -sS -w "%{time_total}" -H "Authorization: Bearer ${API_BEARER_TOKEN}" "$url" || echo "0")
  echo "| $path | $code | ${ttfb}s | ${total}s |"
}

{
  echo "# Web-First Smoke Report"
  echo
  echo "Generated (UTC): $(date -u +'%Y-%m-%d %H:%M:%S')"
  echo "Web URL: ${WEB_URL}"
  echo "API URL: ${API_URL}"
  echo
  echo "## API Health"
  curl -sS "${API_URL}/health" || true
  echo
  echo
  echo "## Endpoint Latency"
  echo "| Endpoint | HTTP | TTFB | Total |"
  echo "|---|---:|---:|---:|"
  check_url "${WEB_URL}/"
  check_url "${WEB_URL}/escorts"
  check_url "${WEB_URL}/user/bookings"
  check_url "${WEB_URL}/user/payments"
  check_url "${WEB_URL}/user/chat"
  check_url "${API_URL}/health"
  check_url "${API_URL}/metrics"

  if [ -n "${WEB_AUTH_COOKIE}" ]; then
    echo
    echo "## Authenticated Web Journey (Optional)"
    echo "| Endpoint | HTTP | TTFB | Total |"
    echo "|---|---:|---:|---:|"
    check_url_with_cookie "${WEB_URL}/"
    check_url_with_cookie "${WEB_URL}/escorts"
    check_url_with_cookie "${WEB_URL}/user/bookings"
    check_url_with_cookie "${WEB_URL}/user/payments"
    check_url_with_cookie "${WEB_URL}/user/chat"

    if [ -n "${BOOKING_ID_SAMPLE}" ]; then
      check_url_with_cookie "${WEB_URL}/user/bookings/${BOOKING_ID_SAMPLE}"
    fi
    if [ -n "${PAYMENT_ID_SAMPLE}" ]; then
      check_url_with_cookie "${WEB_URL}/user/payments/${PAYMENT_ID_SAMPLE}/status"
    fi
    if [ -n "${CHAT_BOOKING_ID_SAMPLE}" ]; then
      check_url_with_cookie "${WEB_URL}/user/chat/${CHAT_BOOKING_ID_SAMPLE}"
    fi
  else
    echo
    echo "## Authenticated Web Journey (Optional)"
    echo "Skipped (set WEB_AUTH_COOKIE to enable authenticated page checks)."
  fi

  if [ -n "${API_BEARER_TOKEN}" ]; then
    echo
    echo "## Authenticated API Checks (Optional)"
    echo "| Endpoint | HTTP | TTFB | Total |"
    echo "|---|---:|---:|---:|"
    check_api_with_token "/users/me"
    check_api_with_token "/bookings"
    check_api_with_token "/payments"
    if [ -n "${BOOKING_ID_SAMPLE}" ]; then
      check_api_with_token "/bookings/${BOOKING_ID_SAMPLE}"
      check_api_with_token "/chats/${BOOKING_ID_SAMPLE}/messages"
    fi
    if [ -n "${PAYMENT_ID_SAMPLE}" ]; then
      check_api_with_token "/payments/${PAYMENT_ID_SAMPLE}"
    fi
  else
    echo
    echo "## Authenticated API Checks (Optional)"
    echo "Skipped (set API_BEARER_TOKEN to enable authenticated API checks)."
  fi

  echo
  echo "## Protected Route Middleware Check"
  curl -I -sS "${WEB_URL}/user/bookings" | sed -n '1,12p'
  echo
  echo "## PM2 Process Snapshot"
  if command -v pm2 >/dev/null 2>&1; then
    pm2 list || true
  else
    echo "pm2 command not found in this shell"
  fi
} > "$OUT_FILE"

echo "Smoke report written: $OUT_FILE"
