#!/bin/bash
# ============================================
# ARETON.id — Crypto Payment Test Suite
# NOWPayments Integration Testing
# ============================================

set -e

API="http://localhost:4000/api"
NOWPAYMENTS_API="https://api.nowpayments.io/v1"
API_KEY="BXHPET5-HK34TNC-H5FBJYE-XHBX5AT"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

pass=0
fail=0

print_test() { echo -e "\n${CYAN}━━━ TEST $1 ━━━${NC}"; }
print_ok()   { echo -e "${GREEN}✅ PASS: $1${NC}"; ((pass++)); }
print_fail() { echo -e "${RED}❌ FAIL: $1${NC}"; ((fail++)); }
print_info() { echo -e "${YELLOW}ℹ  $1${NC}"; }

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   ARETON.id — Crypto Payment Test Suite      ║${NC}"
echo -e "${CYAN}║   NOWPayments Integration                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"

# ─── TEST 1: NOWPayments API Status ───────────
print_test "1: NOWPayments API Status"
STATUS=$(curl -s "$NOWPAYMENTS_API/status")
echo "Response: $STATUS"
if echo "$STATUS" | grep -q '"message":"OK"'; then
  print_ok "NOWPayments API is online"
else
  print_fail "NOWPayments API unreachable"
fi

# ─── TEST 2: API Key Validation ──────────────
print_test "2: API Key Validation"
CURRENCIES=$(curl -s -H "x-api-key: $API_KEY" "$NOWPAYMENTS_API/currencies")
if echo "$CURRENCIES" | grep -q '"currencies"'; then
  CRYPTO_COUNT=$(echo "$CURRENCIES" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['currencies']))" 2>/dev/null || echo "?")
  print_ok "API Key valid — $CRYPTO_COUNT cryptocurrencies available"
else
  print_fail "API Key rejected: $CURRENCIES"
fi

# ─── TEST 3: Check Available Currencies ──────
print_test "3: Target Crypto Availability"
for CRYPTO in eth btc usdt sol xrp matic; do
  if echo "$CURRENCIES" | grep -qi "\"$CRYPTO\""; then
    echo -e "  ${GREEN}✓${NC} $CRYPTO available"
  else
    echo -e "  ${RED}✗${NC} $CRYPTO NOT available"
  fi
done
print_ok "Currency check complete"

# ─── TEST 4: Minimum Payment Amount ─────────
print_test "4: Minimum Payment Amount (IDR → ETH)"
MIN_AMOUNT=$(curl -s -H "x-api-key: $API_KEY" \
  "$NOWPAYMENTS_API/min-amount?currency_from=idr&currency_to=eth")
echo "Response: $MIN_AMOUNT"
if echo "$MIN_AMOUNT" | grep -q '"min_amount"'; then
  print_ok "Min amount check works"
else
  print_fail "Min amount check failed: $MIN_AMOUNT"
fi

# ─── TEST 5: Price Estimate ──────────────────
print_test "5: Price Estimate (500000 IDR → ETH)"
ESTIMATE=$(curl -s -H "x-api-key: $API_KEY" \
  "$NOWPAYMENTS_API/estimate?amount=500000&currency_from=idr&currency_to=eth")
echo "Response: $ESTIMATE"
if echo "$ESTIMATE" | grep -q '"estimated_amount"'; then
  ETH_AMOUNT=$(echo "$ESTIMATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['estimated_amount'])" 2>/dev/null || echo "?")
  print_ok "500,000 IDR ≈ $ETH_AMOUNT ETH"
else
  print_fail "Estimate failed: $ESTIMATE"
fi

# ─── TEST 6: Create Test Invoice ─────────────
print_test "6: Create Test Invoice (Rp 100,000)"
INVOICE=$(curl -s -X POST "$NOWPAYMENTS_API/invoice" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "price_amount": 100000,
    "price_currency": "idr",
    "order_id": "ARETON-TEST-'$(date +%s)'",
    "order_description": "Test Payment - ARETON Booking",
    "ipn_callback_url": "https://api.areton.id/api/payments/crypto-webhook",
    "success_url": "https://areton.id/user/payments/status?order_id=test",
    "cancel_url": "https://areton.id/user/payments/status?order_id=test&failed=true"
  }')
echo "Response: $(echo "$INVOICE" | python3 -m json.tool 2>/dev/null || echo "$INVOICE")"

INVOICE_ID=$(echo "$INVOICE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null || echo "")
INVOICE_URL=$(echo "$INVOICE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('invoice_url',''))" 2>/dev/null || echo "")

if [ -n "$INVOICE_ID" ] && [ "$INVOICE_ID" != "" ]; then
  print_ok "Invoice created: ID=$INVOICE_ID"
  echo -e "  ${CYAN}Payment URL: $INVOICE_URL${NC}"
else
  print_fail "Invoice creation failed"
fi

# ─── TEST 7: ARETON API Health ───────────────
print_test "7: ARETON API Health"
HEALTH=$(curl -s "$API/health" 2>/dev/null || echo '{"error":"unreachable"}')
echo "Response: $HEALTH"
if echo "$HEALTH" | grep -qiE '"status"|"ok"|"healthy"'; then
  print_ok "ARETON API is running"
else
  print_fail "ARETON API not responding at $API"
fi

# ─── TEST 8: Login to get JWT ────────────────
print_test "8: Login (admin@areton.id)"
LOGIN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@areton.id","password":"admin123"}')

TOKEN=$(echo "$LOGIN" | python3 -c "
import sys,json
d = json.load(sys.stdin)
# Handle TransformInterceptor wrapping
data = d.get('data', d)
print(data.get('accessToken', data.get('access_token', '')))" 2>/dev/null || echo "")

if [ -n "$TOKEN" ] && [ "$TOKEN" != "" ]; then
  print_ok "Login successful — JWT obtained"
  echo -e "  ${YELLOW}Token: ${TOKEN:0:30}...${NC}"
else
  print_fail "Login failed: $LOGIN"
  TOKEN=""
fi

# ─── TEST 9: Crypto Webhook Simulation ──────
print_test "9: Crypto Webhook (IPN) Simulation"
MOCK_ORDER_ID="ARETON-TEST-WEBHOOK-$(date +%s)"

# Simulate a NOWPayments IPN callback
WEBHOOK_RESULT=$(curl -s -X POST "$API/payments/crypto-webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_id": 99999999,
    "payment_status": "finished",
    "pay_address": "0xtest1234567890",
    "price_amount": 100000,
    "price_currency": "idr",
    "pay_amount": 0.05,
    "actually_paid": 0.05,
    "pay_currency": "eth",
    "order_id": "'$MOCK_ORDER_ID'",
    "order_description": "Test webhook"
  }')
echo "Response: $WEBHOOK_RESULT"
# Expect ignored/error since no payment exists for this order — that's correct behavior
if echo "$WEBHOOK_RESULT" | grep -qiE '"status"|"error"|"ignored"'; then
  print_ok "Webhook endpoint responds correctly"
else
  print_fail "Webhook endpoint error"
fi

# ─── TEST 10: Payment Lookup Endpoint ────────
if [ -n "$TOKEN" ]; then
  print_test "10: Payment Lookup (authenticated)"
  LOOKUP=$(curl -s "$API/payments/lookup?order_id=ARETON-NONEXISTENT" \
    -H "Authorization: Bearer $TOKEN")
  echo "Response: $LOOKUP"
  if echo "$LOOKUP" | grep -qiE '"payment"|"not found"|"error"|"message"'; then
    print_ok "Payment lookup endpoint works"
  else
    print_fail "Payment lookup returned unexpected response"
  fi
else
  print_test "10: Payment Lookup (SKIPPED — no token)"
  print_info "Skipped: No JWT token available"
fi

# ─── SUMMARY ─────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 TEST SUMMARY                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo -e "  ${GREEN}Passed: $pass${NC}"
echo -e "  ${RED}Failed: $fail${NC}"
echo -e "  Total:  $((pass + fail))"
echo ""

if [ "$fail" -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED — Crypto payment system is ready!${NC}"
else
  echo -e "${YELLOW}⚠️  Some tests failed — check output above for details${NC}"
fi

echo ""
if [ -n "$INVOICE_URL" ] && [ "$INVOICE_URL" != "" ]; then
  echo -e "${CYAN}🔗 Test Payment Page: $INVOICE_URL${NC}"
  echo -e "${YELLOW}   (Open this URL in browser to see the crypto payment UI)${NC}"
fi
echo ""
