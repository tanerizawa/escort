#!/bin/bash
# Phase 16 — Admin Integration Test Script
# Run: bash test-phase16.sh

echo "=== Phase 16: Admin Integration Tests ==="
echo ""

# 1. Get admin token
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s https://api.areton.id/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@areton.id","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken // .accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "   ❌ Login failed!"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi
echo "   ✅ Token obtained (${#TOKEN} chars)"
echo ""

# Helper function
test_endpoint() {
  local name="$1"
  local path="$2"
  local response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "https://api.areton.id/api${path}")
  local http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo "   ✅ $name ($http_code)"
    echo "      $(echo "$body" | jq -c '.' 2>/dev/null | head -c 200)..."
  else
    echo "   ❌ $name ($http_code)"
    echo "      $(echo "$body" | jq -c '.message' 2>/dev/null)"
  fi
}

# 2. Test new admin endpoints
echo "2. Testing NEW admin endpoints..."
test_endpoint "Referral Admin Overview"   "/referrals/admin/overview"
test_endpoint "Referral Admin List"       "/referrals/admin/all"
test_endpoint "GDPR Admin Overview"       "/gdpr/admin/overview"
test_endpoint "GDPR Admin Exports"        "/gdpr/admin/exports"
echo ""

# 3. Test existing endpoints used by new admin pages
echo "3. Testing existing endpoints (used by new pages)..."
test_endpoint "Articles Admin List"       "/articles/admin/all"
test_endpoint "Testimonials Admin List"   "/testimonials/admin/all"
test_endpoint "Analytics Overview"        "/analytics/overview"
test_endpoint "Analytics Revenue Forecast" "/analytics/revenue/forecast"
test_endpoint "Analytics Escort Benchmarks" "/analytics/escorts/benchmarks"
test_endpoint "Analytics Booking Trend"   "/analytics/bookings/trend"
echo ""

# 4. Test admin pages (HTTP status only)
echo "4. Testing admin pages..."
for page in articles testimonials analytics referrals data-requests; do
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://admin.areton.id/$page")
  if [ "$http_code" = "200" ]; then
    echo "   ✅ /$page ($http_code)"
  else
    echo "   ❌ /$page ($http_code)"
  fi
done
echo ""

echo "=== Tests Complete ==="
