# QUICK REFERENCE - SERVICIOS Y APIs
## Guía de búsqueda rápida

---

## ARCHIVO FINDER

### Frontend Hotspots
```
Chat Logic:
  /hooks/useChat.ts                      → Main chat handler
  /hooks/useStreamingChat.ts             → SSE streaming
  /stores/chatStore.ts                   → Zustand state (messages)

Auth & Theme:
  /contexts/AuthContext.tsx              → User session + profile
  /contexts/ThemeContext.tsx             → Light/dark theme

Data Fetching:
  /hooks/useDailyContent.ts              → Saints & gospels
  /hooks/useIntelligentDetector.ts       → Message type detection

Utils:
  /lib/supabase.ts                       → Supabase client
  /lib/dayjs.ts                          → Date handling
  /lib/liturgicalColors.ts               → Liturgical calendar
  /constants/themes.ts                   → Design tokens
```

### Backend Hotspots
```
Chat:
  /backend/app/api/chat/message-stream   → Main streaming endpoint
  /backend/app/api/chat/quick            → Fast cache endpoint
  /backend/app/api/chat/detect           → Message detection

Tools:
  /backend/app/api/chat/tools/pineconeTool.ts    → Vector search
  /backend/app/api/chat/tools/calendarTool.ts    → Calendar events
  /backend/app/api/chat/tools/resourcesTool.ts   → Resources search

Utilities:
  /backend/app/api/chat/utils/memoryCache.ts     → FAQ cache (0ms)
  /backend/app/api/chat/utils/semanticCache.ts   → Redis cache (1h)
  /backend/app/api/chat/utils/quickActionsConfig.ts → Smart buttons

Auth:
  /backend/app/api/auth/login            → User login
  /backend/app/api/auth/register         → User signup
  /backend/app/api/auth/forgot-password  → Password reset
```

---

## API ENDPOINTS QUICK MAP

| Endpoint | Method | Purpose | Timeout | Cache |
|----------|--------|---------|---------|-------|
| /api/chat/message-stream | POST | Full agent + streaming | 60s | Redis |
| /api/chat/quick | POST | Fast cache/GPT-4o-mini | 15s | Memory |
| /api/chat/message | POST | Full agent (no stream) | 60s | Redis |
| /api/chat/detect | POST | Message type detection | 5s | - |
| /api/calendar/events | GET | Google Calendar fetch | 10s | 2min |
| /api/auth/login | POST | User authentication | 15s | - |
| /api/auth/register | POST | User signup | 15s | - |
| /api/debug/logger | GET | Real-time logs | 5s | - |

---

## STATE MANAGEMENT MATRIX

| State | Manager | Persistent | Location |
|-------|---------|-----------|----------|
| **Chat Messages** | Zustand | Yes (AsyncStorage) | /stores/chatStore.ts |
| **Input Text** | Zustand | No | /stores/chatStore.ts |
| **User Session** | React Context | Yes (AsyncStorage) | /contexts/AuthContext.tsx |
| **User Profile** | React Context | Computed from session | /contexts/AuthContext.tsx |
| **Theme** | React Context | Yes (AsyncStorage) | /contexts/ThemeContext.tsx |
| **Query Cache** | React Query | Yes (in-memory) | /app/_layout.tsx |

---

## INTEGRATION CHECKLIST

### Before Deploying

- [ ] OPENAI_API_KEY set in backend env
- [ ] ANTHROPIC_API_KEY set (Claude Haiku)
- [ ] PINECONE_API_KEY set + index "parroquias" exists
- [ ] SUPABASE_URL + SERVICE_ROLE_KEY set
- [ ] REDIS_URL set (fallback: memory cache)
- [ ] GOOGLE_CALENDAR_ICS_URL set
- [ ] RESEND_API_KEY set
- [ ] VERCEL_KV credentials set
- [ ] Frontend env vars: EXPO_PUBLIC_SUPABASE_*, EXPO_PUBLIC_API_BASE

### Health Checks

```bash
# Check Pinecone
curl -H "Api-Key: $PINECONE_API_KEY" https://api.pinecone.io/indexes

# Check Redis
redis-cli -u $REDIS_URL ping

# Check Supabase
curl -H "Authorization: Bearer $SUPABASE_ANON_KEY" https://[project].supabase.co/rest/v1/profiles

# Check OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

---

## PERFORMANCE METRICS

### Expected Latencies (p50)

```
Memory Cache Hit:        0.3s    (FAQ lookup)
GPT-4o-mini Only:        2-3s    (quick endpoint)
Pinecone + Agent:        3-5s    (full endpoint)
Streaming Perceived:     1-2s    (chunks start appearing)
Calendar Fetch:          0.5-1s  (cached)
Auth Operations:         1-2s    (Supabase)
```

### Cost Estimates (Monthly, ~1000 users)

```
OpenAI Agents:     ~$200    (depends on usage)
Pinecone:          ~$20     (71 docs, low volume)
Anthropic (Haiku): ~$5      (query expansion)
Supabase:          ~$25     (auth + DB)
Redis Cloud:       ~$15     (cache)
Vercel:            ~$50     (Edge Functions)
Total:             ~$315
```

---

## COMMON DEBUGGING SCENARIOS

### Problem: Slow responses
**Check:**
1. Is Pinecone up? → Check latency at /api/chat/cache-stats
2. Is OpenAI rate limited? → Check circuit breaker state
3. Is query good? → Verify Query Expansion generating 3 variations

**Solution:**
- Increase memory cache hit rate (add more FAQs)
- Use /api/chat/quick endpoint (faster)
- Increase Pinecone pre-filter threshold

### Problem: Wrong answers
**Check:**
1. Are documents indexed? → Check Pinecone index size
2. Is query expansion working? → Check /api/test-pinecone-tool
3. Is agent confused? → Check conversational rewriting

**Solution:**
- Rebuild Pinecone index with better metadata
- Refine system prompts in agent
- Use more specific Query Expansion patterns

### Problem: High costs
**Check:**
1. Query Expansion making 3x requests? → Yes, intentional
2. Cache miss rate too high? → Check Redis + Memory cache stats
3. Agent using too many tool calls? → Monitor /api/debug/logger

**Solution:**
- Increase Redis TTL (cache longer)
- Add more FAQs to Memory cache (0ms)
- Optimize system prompts to reduce tool calls

---

## CODE SNIPPETS

### Using the Chat Hook
```typescript
const { handleSend, messages, inputText, setInputText } = useChat();

// Send message
await handleSend("¿Qué es Eloos?");

// Or use input field
setInputText("Nueva pregunta");
await handleSend();
```

### Using Auth Context
```typescript
const { session, profile, signIn, signOut } = useAuth();

if (!session) {
  await signIn(email, password);
}

if (profile) {
  console.log(profile.full_name);
}
```

### Calling Backend Manually
```typescript
const response = await fetch(`${API_BASE}/api/chat/message-stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Tu pregunta",
    conversationHistory: []
  })
});

// Read SSE stream
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  console.log(new TextDecoder().decode(value));
}
```

---

## ENVIRONMENT VARIABLES TEMPLATE

### Frontend (.env)
```bash
# Critical - Chat won't work without these
EXPO_PUBLIC_SUPABASE_URL=https://[project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON=[anon-key]
EXPO_PUBLIC_API_BASE=https://chat-app-parroquias.vercel.app

# Optional
EXPO_PUBLIC_TIMEZONE=Europe/Madrid
EXPO_PUBLIC_CHATKIT_WORKFLOW_ID=ywf_...
```

### Backend (.env.local)
```bash
# Critical APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
PINECONE_API_KEY=...
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=redis://...

# Optional services
RESEND_API_KEY=...
GOOGLE_CALENDAR_ICS_URL=https://calendar.google.com/...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

---

## DEPLOYMENT CHECKLIST

### Before Pushing to Prod
- [ ] All env vars set
- [ ] Tests passing (npm test)
- [ ] No console errors
- [ ] Pinecone index has 71+ documents
- [ ] Redis connection working
- [ ] Email templates tested
- [ ] Rate limits configured
- [ ] Circuit breaker thresholds reviewed

### Monitoring Alerts
- [ ] OpenAI API errors
- [ ] Circuit breaker activated
- [ ] Pinecone search latency > 2s
- [ ] Memory usage > 500MB
- [ ] Error rate > 1%

---

## USEFUL COMMANDS

```bash
# Local development
npm run dev                  # Start both frontend and backend

# Testing
npm test                     # Run tests
npm test:watch              # Watch mode
npm test:coverage           # Coverage report

# Deployment
npm run build               # Build next.js

# Database
supabase db pull            # Sync schema locally
supabase functions deploy   # Deploy edge functions

# Debugging
curl http://localhost:3000/api/debug/logger  # View logs
curl http://localhost:3000/api/chat/cache-stats  # Cache metrics
```

---

## REFERENCE LINKS

- OpenAI Agent SDK: https://github.com/openai/agents
- Pinecone Docs: https://docs.pinecone.io
- Supabase Auth: https://supabase.com/docs/guides/auth
- Vercel KV: https://vercel.com/docs/storage/vercel-kv
- React Query: https://tanstack.com/query/latest
- Zustand: https://github.com/pmndrs/zustand

---

**Last Updated:** October 26, 2025
