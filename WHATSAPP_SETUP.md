# WhatsApp Integration Setup Guide

Complete guide for integrating WhatsApp Business with Resply using either Kapso (quick setup) or Meta Direct API (full control).

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Option 1: Kapso Setup (Recommended for MVP)](#option-1-kapso-setup-recommended-for-mvp)
- [Option 2: Meta Direct API Setup](#option-2-meta-direct-api-setup)
- [Migration from Kapso to Meta](#migration-from-kapso-to-meta)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

Resply supports WhatsApp Business integration through two providers:

| Feature | Kapso | Meta Direct |
|---------|-------|-------------|
| Setup Time | 2 minutes | ~1 hour |
| Phone Numbers | Provided by Kapso | Your own |
| Multi-tenant | Built-in | Build yourself |
| Storage | Automatic | Manual |
| Cost | Higher (Kapso fee + Meta) | Lower (Meta only) |
| Control | Limited | Full |

**Recommendation:** Start with Kapso for quick MVP, migrate to Meta Direct when volume justifies it (>10k messages/month).

---

## Architecture

The integration uses a **Provider Pattern** that abstracts WhatsApp operations:

```
WhatsAppService (Orchestrator)
    ↓
BaseWhatsAppProvider (Abstract Interface)
    ↓
    ├── KapsoProvider (Kapso Implementation)
    └── MetaProvider (Meta Direct Implementation)
```

This architecture allows seamless switching between providers by changing environment variables.

### Files Structure

```
lib/services/whatsapp/
├── index.ts                    # Main exports
├── types.ts                    # Shared TypeScript types
├── whatsapp-service.ts         # Service orchestrator
└── providers/
    ├── base.ts                 # Abstract base class
    ├── kapso.ts                # Kapso implementation
    └── meta.ts                 # Meta Direct implementation

app/api/whatsapp/
├── webhooks/route.ts           # Webhook handler (GET & POST)
├── send-message/route.ts       # Send message endpoint
└── channels/
    └── connect/route.ts        # Channel connection API

components/channels/
└── WhatsAppConnectModal.tsx    # UI for connecting channels
```

---

## Option 1: Kapso Setup (Recommended for MVP)

### Prerequisites

1. Sign up for Kapso account: https://kapso.ai
2. Get your API key from Kapso dashboard

### Step 1: Configure Environment Variables

Add to your `.env.local`:

```bash
WHATSAPP_PROVIDER=kapso
KAPSO_API_KEY=ka-your-api-key-here
KAPSO_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 2: Get Phone Number from Kapso

1. Go to Kapso Dashboard
2. Navigate to "Phone Numbers"
3. Request a phone number (usually takes 1-2 minutes)
4. Copy the Phone Number ID

### Step 3: Connect Channel via UI

1. Go to `/dashboard/channels` in your Resply app
2. Click "Conectar WhatsApp"
3. Select "Kapso (Recomendado)"
4. Fill in:
   - **Channel Name**: "WhatsApp Sales" (or any name)
   - **Kapso API Key**: Your API key from Step 1
   - **Phone Number ID**: From Step 2
   - **Webhook Secret**: Your webhook secret from Step 1
5. Click "Conectar Canal"

### Step 4: Configure Webhook in Kapso

After connecting, you'll receive a webhook URL like:
```
https://your-domain.com/api/whatsapp/webhooks?channelId=xxx-xxx-xxx
```

1. Go to Kapso Dashboard → Webhooks
2. Add new webhook:
   - **URL**: (the one provided)
   - **Events**: Select "messages" and "message_status"
   - **Secret**: Your webhook secret
3. Save and verify

### Step 5: Test

1. Send a WhatsApp message to your Kapso number
2. Check Resply dashboard → Conversations
3. You should see the message appear!

---

## Option 2: Meta Direct API Setup

### Prerequisites

1. Facebook Business Account
2. WhatsApp Business Account
3. Meta Business Manager access
4. Verified business

### Step 1: Create WhatsApp App

1. Go to https://developers.facebook.com
2. Create new app → Business
3. Add WhatsApp product
4. Complete business verification (may take 1-3 days)

### Step 2: Get Credentials

From Meta Business Manager, get:

1. **Access Token**:
   - Go to App Settings → WhatsApp → API Setup
   - Generate permanent token (not temporary!)
2. **Phone Number ID**:
   - Listed under "Phone numbers"
3. **Business Account ID**:
   - Found in WhatsApp → API Setup
4. **App Secret**:
   - App Settings → Basic → App Secret

### Step 3: Configure Environment Variables

Add to your `.env.local`:

```bash
WHATSAPP_PROVIDER=meta
META_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
META_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
META_APP_SECRET=your-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token-123
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Step 4: Connect Channel via UI

1. Go to `/dashboard/channels`
2. Click "Conectar WhatsApp"
3. Select "Meta Direct"
4. Fill in all credentials
5. Click "Conectar Canal"

### Step 5: Configure Webhook in Meta

1. Go to App Settings → WhatsApp → Configuration
2. Edit webhook:
   - **Callback URL**: `https://your-domain.com/api/whatsapp/webhooks?channelId=xxx`
   - **Verify Token**: Your custom verify token from Step 3
3. Subscribe to fields:
   - `messages`
   - `message_status`
4. Test the webhook

### Step 6: Test

Send a test message and verify it appears in Resply.

---

## Migration from Kapso to Meta

When ready to migrate (recommended when >10k messages/month):

### Step 1: Prepare Meta Account

Complete "Option 2" steps above to get Meta credentials.

### Step 2: Update Environment Variables

```bash
# Change provider
WHATSAPP_PROVIDER=meta

# Keep Kapso vars for reference
# KAPSO_API_KEY=ka-...

# Add Meta vars
META_WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
META_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
META_APP_SECRET=your-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-custom-verify-token-123
```

### Step 3: Update Channel Configuration

Option A: Via UI
1. Go to `/dashboard/channels`
2. Click existing WhatsApp channel
3. Update credentials to Meta
4. Save

Option B: Via Database
```sql
UPDATE channels
SET
  credentials = '{"provider": "meta"}',
  whatsapp_access_token = 'EAAxxxxx',
  whatsapp_business_account_id = '123456789',
  whatsapp_webhook_verify_token = 'your-verify-token'
WHERE id = 'your-channel-id';
```

### Step 4: Update Webhooks

1. Remove Kapso webhook
2. Add Meta webhook (see Option 2, Step 5)

### Step 5: Test Migration

1. Send test message to your Meta phone number
2. Verify it appears in Resply
3. Reply from Resply
4. Confirm customer receives it

### Step 6: Monitor

- Check error logs for any issues
- Monitor message delivery rates
- Compare costs (Kapso vs Meta)

---

## Testing

### Test Webhook Locally

Use ngrok for local testing:

```bash
# Start ngrok
ngrok http 3000

# Update webhook URL to:
https://your-ngrok-url.ngrok.io/api/whatsapp/webhooks?channelId=xxx
```

### Test Message Sending

```bash
curl -X POST https://your-domain.com/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "your-channel-id",
    "to": "1234567890",
    "type": "text",
    "content": "Hello from Resply!"
  }'
```

### Test Webhook Reception

```bash
# Simulate incoming message
curl -X POST "https://your-domain.com/api/whatsapp/webhooks?channelId=xxx" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: your-signature" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "id": "wamid.xxx",
            "timestamp": "1234567890",
            "type": "text",
            "text": { "body": "Test message" }
          }],
          "contacts": [{
            "profile": { "name": "Test User" },
            "wa_id": "1234567890"
          }]
        }
      }]
    }]
  }'
```

---

## Troubleshooting

### Webhook Not Receiving Messages

**Check:**
1. Webhook URL is correct (includes `?channelId=xxx`)
2. Webhook signature verification is passing
3. Channel status is "active" in database
4. Webhook is subscribed to correct events

**Debug:**
```bash
# Check logs
grep "Webhook" /var/log/your-app.log

# Test webhook verification
curl "https://your-domain.com/api/whatsapp/webhooks?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=test123&channelId=xxx"
```

### Messages Not Sending

**Check:**
1. Channel ID is correct
2. Phone number format (E.164: +1234567890)
3. Provider credentials are valid
4. Channel status is "active"

**Debug:**
```bash
# Check provider cache
# In your app console:
WhatsAppService.clearProviderCache();

# Check API logs
tail -f /var/log/whatsapp-api.log
```

### Authentication Errors

**Kapso:**
- Verify API key is correct (`ka-...`)
- Check API key hasn't expired
- Ensure webhook secret matches

**Meta:**
- Verify access token is permanent (not temporary)
- Check token hasn't expired (regenerate if needed)
- Ensure app secret is correct
- Verify webhook verify token matches

### Rate Limiting

**Kapso:**
- 1000 requests/minute per API key
- 10 setup links/hour per customer

**Meta:**
- 80 messages/second
- Tier-based daily limits (250/2000/10000/100000)

**Solution:**
- Implement queue system for high volume
- Monitor rate limit headers
- Implement exponential backoff

### Message Delivery Failures

**Check:**
1. Customer number is valid WhatsApp number
2. Customer hasn't blocked your business
3. You're within 24-hour messaging window (or using template)
4. Message content follows WhatsApp policies

**Debug:**
```sql
-- Check message metadata for errors
SELECT
  id,
  content,
  metadata->>'delivery_status' as status,
  metadata->>'whatsapp_message_id' as wa_id
FROM messages
WHERE sender_type = 'agent'
ORDER BY created_at DESC
LIMIT 10;
```

---

## API Reference

### Send Message

```typescript
POST /api/whatsapp/send-message

Body:
{
  channelId: string;
  to: string;  // Phone in E.164 format
  type: 'text' | 'image' | 'document' | 'video';
  content: string | {
    text?: string;
    mediaUrl?: string;
    caption?: string;
  };
  conversationId?: string;  // Optional
}

Response:
{
  success: boolean;
  messageId: string;
  message: string;
}
```

### Connect Channel

```typescript
POST /api/whatsapp/channels/connect

Body:
{
  workspaceId: string;
  provider: 'kapso' | 'meta';
  name: string;

  // Kapso fields (if provider=kapso)
  kapsoApiKey?: string;
  kapsoPhoneNumberId?: string;
  kapsoWebhookSecret?: string;

  // Meta fields (if provider=meta)
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  metaBusinessAccountId?: string;
  metaWebhookVerifyToken?: string;
}

Response:
{
  success: boolean;
  channel: Channel;
  webhookUrl: string;
  instructions: {
    nextSteps: string[];
  };
}
```

---

## Next Steps

1. **Phase 1 (Current)**: Basic message sending/receiving ✅
2. **Phase 2**: Template messages for notifications
3. **Phase 3**: Interactive buttons and lists
4. **Phase 4**: Media messages (images, documents, videos)
5. **Phase 5**: WhatsApp Flows integration

---

## Support

- **Kapso Issues**: https://docs.kapso.ai
- **Meta Issues**: https://developers.facebook.com/support
- **Resply Issues**: Check your internal documentation or support team

---

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all secrets
3. **Verify webhook signatures** always
4. **Rate limit** your endpoints
5. **Encrypt** access tokens in database
6. **Monitor** for suspicious activity
7. **Rotate** credentials regularly

---

## Performance Optimization

1. **Cache providers** (already implemented)
2. **Queue messages** for high volume
3. **Batch webhook processing**
4. **Use CDN** for media files
5. **Implement retry logic** with exponential backoff

---

**Generated with ❤️ by Resply Team**
