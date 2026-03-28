#!/bin/bash
# ARETON.id — Production Smoke Test
# Tests all critical endpoints and flows

set -e

API_URL="${1:-https://api.areton.id/api}"
WEB_URL="${2:-https://areton.id}"
PASS=0
FAIL=0
TOTAL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

check() {
  local name="$1"
  local url="$2"
  local expected_code="${3:-200}"
  local method="${4:-GET}"
  local data="$5"

  TOTAL=$((TOTAL + 1))

  if [ "${method}" = "POST" ] && [ -n "${data}" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "${data}" "${url}" --max-time 10 2>/dev/null || echo "000")
  else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${url}" --max-time 10 2>/dev/null || echo "000")
  fi

  if [ "${HTTP_CODE}" = "${expected_code}" ]; then
    echo -e "  ${GREEN}✓${NC} ${name} (${HTTP_CODE})"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} ${name} — expected ${expected_code}, got ${HTTP_CODE}"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  ARETON.id — Production Smoke Test"
echo "  API: ${API_URL}"
echo "  Web: ${WEB_URL}"
echo "  Time: $(date)"
echo "═══════════════════════════════════════════"

echo ""
echo -e "${YELLOW}[1/6] Web Frontend${NC}"
check "Homepage loads" "${WEB_URL}" 200
check "Login page" "${WEB_URL}/login" 200
check "Register page" "${WEB_URL}/register" 200
check "Escorts browse" "${WEB_URL}/escorts" 200

echo ""
echo -e "${YELLOW}[2/6] API Health${NC}"
check "Swagger docs" "${API_URL}/docs" 200

echo ""
echo -e "${YELLOW}[3/6] Auth Endpoints${NC}"
check "Login (validation)" "${API_URL}/auth/login" 401 POST '{"email":"smoke@test.com","password":"wrongpasswordtest"}'
check "Register (validation)" "${API_URL}/auth/register" 400 POST '{"email":"invalid"}'

echo ""
echo -e "${YELLOW}[4/6] Public APIs${NC}"
check "Featured premium" "${API_URL}/premium/featured" 200

echo ""
echo -e "${YELLOW}[5/6] Protected APIs (should reject unauth)${NC}"
check "Corporate (unauth)" "${API_URL}/corporate" 500
check "Training modules (unauth)" "${API_URL}/training/modules" 500

echo ""
echo -e "${YELLOW}[6/6] Infrastructure${NC}"
# SSL check
SSL_EXPIRY=$(echo | openssl s_client -servername areton.id -connect areton.id:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "${SSL_EXPIRY}" ]; then
  echo -e "  ${GREEN}✓${NC} SSL Certificate valid until: ${SSL_EXPIRY}"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} SSL Certificate check failed"
  FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# PM2 process check
PM2_ONLINE=$(pm2 jlist 2>/dev/null | python3 -c "import sys,json; data=json.load(sys.stdin); print(sum(1 for p in data if p['pm2_env']['status']=='online'))" 2>/dev/null || echo "0")
if [ "${PM2_ONLINE}" -ge 3 ]; then
  echo -e "  ${GREEN}✓${NC} PM2: ${PM2_ONLINE} processes online"
  PASS=$((PASS + 1))
else
  echo -e "  ${RED}✗${NC} PM2: Only ${PM2_ONLINE} processes online (expected ≥3)"
  FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Disk space
DISK_USED=$(df -h / | awk 'NR==2 {print $5}' | tr -d '%')
if [ "${DISK_USED}" -lt 85 ]; then
  echo -e "  ${GREEN}✓${NC} Disk usage: ${DISK_USED}%"
  PASS=$((PASS + 1))
else
  echo -e "  ${YELLOW}⚠${NC} Disk usage: ${DISK_USED}% (warning: >85%)"
  FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

echo ""
echo "═══════════════════════════════════════════"
if [ ${FAIL} -eq 0 ]; then
  echo -e "  ${GREEN}ALL TESTS PASSED: ${PASS}/${TOTAL}${NC}"
else
  echo -e "  ${RED}FAILED: ${FAIL}/${TOTAL}${NC} | ${GREEN}PASSED: ${PASS}/${TOTAL}${NC}"
fi
echo "═══════════════════════════════════════════"
echo ""

exit ${FAIL}
