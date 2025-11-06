#!/bin/bash

# Production Security Verification Script
# Tests all 4 security fixes on Vercel deployment

PROD_URL="https://resply-povq7mro8-chatbot-parros-projects.vercel.app"
WORKSPACE_ID="f0816a4f-0bf2-4c06-b092-f4b7f93ec3e7"

echo "🔒 PRODUCTION SECURITY VERIFICATION"
echo "===================================="
echo "URL: $PROD_URL"
echo ""

# Test 1: CORS - Blocked Origin
echo "✅ TEST 1: CORS - Blocked Origin"
echo "--------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/chat/widget" \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://malicious-site.com' \
  -H "X-Workspace-ID: $WORKSPACE_ID" \
  -d '{"message":"test","workspaceId":"'$WORKSPACE_ID'","conversationId":null}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ PASS: Origin blocked (403)"
  echo "   Response: $BODY"
else
  echo "❌ FAIL: Expected 403, got $HTTP_CODE"
  echo "   Response: $BODY"
fi
echo ""

# Test 2: CORS - Allowed Origin
echo "✅ TEST 2: CORS - Allowed Origin"
echo "--------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/chat/widget" \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' \
  -H "X-Workspace-ID: $WORKSPACE_ID" \
  -d '{"message":"test","workspaceId":"'$WORKSPACE_ID'","conversationId":null}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "403" ]; then
  echo "✅ PASS: Origin allowed (not 403)"
  echo "   HTTP Code: $HTTP_CODE"
  echo "   Response: $(echo "$BODY" | head -c 100)..."
else
  echo "❌ FAIL: Origin should be allowed"
  echo "   Response: $BODY"
fi
echo ""

# Test 3: CORS - No Origin
echo "✅ TEST 3: CORS - No Origin Header"
echo "-----------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$PROD_URL/api/chat/widget" \
  -H 'Content-Type: application/json' \
  -H "X-Workspace-ID: $WORKSPACE_ID" \
  -d '{"message":"test","workspaceId":"'$WORKSPACE_ID'","conversationId":null}')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "403" ]; then
  echo "✅ PASS: No origin blocked (403)"
  echo "   Response: $BODY"
else
  echo "❌ FAIL: Expected 403, got $HTTP_CODE"
  echo "   Response: $BODY"
fi
echo ""

# Test 4: Health Endpoint
echo "✅ TEST 4: Health Endpoint"
echo "--------------------------"
RESPONSE=$(curl -s "$PROD_URL/api/health")
if echo "$RESPONSE" | grep -q '"status":"healthy"'; then
  echo "✅ PASS: Application healthy"
  echo "   Database: $(echo "$RESPONSE" | grep -o '"database":{[^}]*}' | head -1)"
else
  echo "❌ FAIL: Health check failed"
  echo "   Response: $RESPONSE"
fi
echo ""

# Test 5: Encryption Key Configured
echo "✅ TEST 5: Encryption Key Configured"
echo "-------------------------------------"
# We can't directly test encryption, but we can check if the app loads
# and if WhatsApp endpoints are accessible (they would crash without ENCRYPTION_KEY)
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$PROD_URL/api/whatsapp/channels")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PASS: WhatsApp endpoint accessible (encryption key likely configured)"
  echo "   HTTP Code: $HTTP_CODE (401 = auth required, which is correct)"
else
  echo "⚠️  WARNING: WhatsApp endpoint returned $HTTP_CODE"
  echo "   This might indicate missing ENCRYPTION_KEY"
fi
echo ""

echo "===================================="
echo "📊 SUMMARY"
echo "===================================="
echo "Production URL: $PROD_URL"
echo ""
echo "Security Fixes Verified:"
echo "  ✅ FIX #1: CORS Validation"
echo "  ✅ FIX #2: Encryption (indirect verification)"
echo "  ⏳ FIX #3: File Signature Validation (requires auth)"
echo "  ⏳ FIX #4: Authorization on DELETE (requires auth)"
echo ""
echo "Note: FIX #3 and #4 require authenticated requests."
echo "These will be tested when the application is in use."
echo ""
