# Artillery Load Testing Guide

## Overview

Artillery is configured for comprehensive load and performance testing of the Resply platform. This includes testing critical endpoints under realistic multi-tenant scenarios.

## What is Artillery?

Artillery is a modern load testing toolkit that:
- Simulates thousands of concurrent users
- Tests HTTP/WebSocket endpoints
- Measures performance metrics (latency, throughput, errors)
- Generates detailed HTML reports
- Integrates with CI/CD pipelines

## Test Suite Structure

```
tests/load/
├── .env.example                  # Configuration template
├── load-test-helpers.js          # Helper functions
├── health-check.yml              # Health endpoint test
├── chat-api.yml                  # Chat API test
├── document-processing.yml       # Document processing test
├── conversations.yml             # Conversations API test
└── multi-tenant.yml              # Full multi-tenant simulation
```

## Installation

Artillery is already installed as a dev dependency:

```bash
npm install --save-dev artillery
```

## Configuration

### 1. Setup Environment Variables

```bash
# Copy example config
cp tests/load/.env.example tests/load/.env.load-test

# Edit configuration
vim tests/load/.env.load-test
```

Required variables:
```bash
TEST_TARGET_URL=http://localhost:3000
TEST_AUTH_TOKEN=your-test-token
```

### 2. Load Environment Variables

Artillery automatically loads from `process.env`. Set variables before running tests:

```bash
export TEST_TARGET_URL=http://localhost:3000
export TEST_AUTH_TOKEN=your-test-token
```

Or use a `.env` file with a tool like `dotenv-cli`:

```bash
npm install -g dotenv-cli
dotenv -e tests/load/.env.load-test -- npm run test:load:health
```

## Running Tests

### Individual Test Suites

```bash
# Health check (simple, fast)
npm run test:load:health

# Chat API (medium complexity, OpenAI calls)
npm run test:load:chat

# Document processing (complex, long-running)
npm run test:load:documents

# Conversations API (widget traffic)
npm run test:load:conversations

# Multi-tenant simulation (comprehensive)
npm run test:load:multi-tenant
```

### All Tests in Sequence

```bash
npm run test:load:all
```

### Generate HTML Report

```bash
npm run test:load:report
# Opens load-test-report.html with visual metrics
```

### Custom Artillery Commands

```bash
# Run specific test with custom target
artillery run --target https://staging.resply.com tests/load/health-check.yml

# Run test and save raw JSON
artillery run --output results.json tests/load/multi-tenant.yml

# Generate report from saved JSON
artillery report results.json --output report.html

# Run with environment variables
TEST_TARGET_URL=https://staging.resply.com artillery run tests/load/chat-api.yml

# Quick test (reduce duration)
artillery quick --count 10 --num 50 http://localhost:3000/api/health
```

## Test Suites Explained

### 1. Health Check Test ([health-check.yml](tests/load/health-check.yml))

**Purpose:** Baseline test for API availability and database connectivity

**Load Profile:**
- Warm-up: 5 req/s for 30s
- Ramp-up: 5→20 req/s over 60s
- Sustained: 20 req/s for 120s
- Peak: 20→50 req/s over 60s
- Cool down: 50→5 req/s over 30s

**Metrics:**
- Max error rate: 1%
- P95 latency: < 2s
- P99 latency: < 5s

**What it tests:**
- `/api/health` endpoint
- Database connectivity
- API response time
- System health status

---

### 2. Chat API Test ([chat-api.yml](tests/load/chat-api.yml))

**Purpose:** Test AI chatbot performance under load

**Load Profile:**
- Warm-up: 2 req/s for 60s
- Normal: 5 req/s for 180s
- Peak ramp: 5→15 req/s over 120s
- Sustained peak: 15 req/s for 180s
- Cool down: 15→2 req/s over 60s

**Metrics:**
- Max error rate: 5% (OpenAI can fail)
- P95 latency: < 10s
- P99 latency: < 20s

**Scenarios:**
1. **With RAG** (70% weight): Uses Pinecone vector search
2. **No RAG** (20% weight): Direct OpenAI call
3. **Long conversation** (10% weight): 5-message threads

**What it tests:**
- OpenAI API integration
- Pinecone vector search
- RAG pipeline performance
- Token usage tracking
- Conversation history handling

---

### 3. Document Processing Test ([document-processing.yml](tests/load/document-processing.yml))

**Purpose:** Test document ingestion pipeline

**Load Profile:**
- Low: 1 doc/s for 120s
- Medium: 1→3 docs/s over 180s
- Sustained: 3 docs/s for 300s

**Metrics:**
- Max error rate: 10% (processing can fail)
- P95 latency: < 60s
- P99 latency: < 3 minutes

**Scenarios:**
1. **Small documents** (60% weight): < 10 pages
2. **Medium documents** (30% weight): 10-50 pages
3. **Large documents** (10% weight): > 50 pages

**What it tests:**
- File download from storage
- Text extraction (PDF/DOCX)
- Embedding generation (Voyage AI)
- Pinecone upsert performance
- Chunking algorithm
- Error handling

---

### 4. Conversations API Test ([conversations.yml](tests/load/conversations.yml))

**Purpose:** Test widget traffic patterns

**Load Profile:**
- Warm-up: 5 req/s for 30s
- Normal: 10 req/s for 120s
- Peak ramp: 10→30 req/s over 180s
- Sustained peak: 30 req/s for 120s
- Cool down: 30→5 req/s over 60s

**Metrics:**
- Max error rate: 2%
- P95 latency: < 3s
- P99 latency: < 8s

**Scenarios:**
1. **Customer messages** (80% weight): Widget users asking questions
2. **Agent responses** (15% weight): Support team replies
3. **Get messages** (5% weight): Fetch conversation history

**What it tests:**
- Message creation
- Email notifications
- Conversation metadata updates
- Widget API performance
- Database write performance

---

### 5. Multi-Tenant Test ([multi-tenant.yml](tests/load/multi-tenant.yml))

**Purpose:** Simulate 50-100 tenants using the platform simultaneously

**Load Profile:**
- 10 tenants: 10 req/s for 120s
- Ramp to 50: 10→50 req/s over 180s
- 50 tenants sustained: 50 req/s for 300s
- Peak (100 tenants): 50→100 req/s over 180s
- Cool down: 100→10 req/s over 120s

**Metrics:**
- Max error rate: 5%
- P95 latency: < 10s
- P99 latency: < 30s

**Scenarios:**
1. **Widget user journey** (50% weight): Customer asks question
2. **Admin dashboard** (20% weight): View and manage conversations
3. **Document processing** (15% weight): Upload and process documents
4. **Knowledge base search** (10% weight): Multiple RAG queries
5. **Widget traffic burst** (5% weight): High-volume widget usage

**What it tests:**
- Full platform under realistic load
- Multi-tenancy isolation
- Resource contention
- Database connection pooling
- External API rate limits (OpenAI, Pinecone, Voyage AI)
- Concurrent document processing
- Widget scalability

---

## Understanding Test Results

### Terminal Output

```
Summary report @ 19:30:45(-0500)
──────────────────────────────────────────────────────
  Scenarios launched:  1000
  Scenarios completed: 1000
  Requests completed:  5000
  Mean response/sec:   16.67
  Response time (msec):
    min: 45
    max: 2345
    median: 125
    p95: 450
    p99: 890
  Scenario duration (msec):
    min: 1234
    max: 15678
    median: 5432
    p95: 8765
    p99: 12345
  Scenario counts:
    Widget User Journey: 500 (50%)
    Admin Dashboard: 200 (20%)
  Codes:
    200: 4950
    429: 50 (rate limit)
  Errors:
    ETIMEDOUT: 5 (0.1%)
```

### Key Metrics

1. **Scenarios launched/completed**: Total user sessions
2. **Requests completed**: Total HTTP requests
3. **Mean response/sec**: Throughput (requests per second)
4. **Response time**: Latency distribution
   - **Median**: 50% of requests faster than this
   - **P95**: 95% of requests faster than this
   - **P99**: 99% of requests faster than this
5. **Scenario duration**: End-to-end user journey time
6. **Codes**: HTTP status code distribution
7. **Errors**: Failed requests by type

### What "Good" Looks Like

**✅ Healthy System:**
```
Mean response/sec: 20-50 (high throughput)
P95: < 2000ms (fast responses)
P99: < 5000ms (acceptable worst case)
Error rate: < 1%
Codes 200: > 99%
```

**⚠️ Warning Signs:**
```
Mean response/sec: < 10 (low throughput)
P95: > 5000ms (slow responses)
P99: > 10000ms (very slow worst case)
Error rate: 5-10%
Codes 429: Many rate limit errors
Codes 503: Service unavailable
```

**🚨 Critical Issues:**
```
Mean response/sec: < 5
P95: > 10000ms
P99: > 30000ms
Error rate: > 10%
Codes 500: Many server errors
Errors ECONNREFUSED: Service down
```

---

## HTML Reports

Generate visual HTML reports:

```bash
npm run test:load:report
```

Opens `load-test-report.html` with:
- Interactive charts (response time, throughput)
- Latency heatmaps
- Error distribution
- Percentile graphs
- Request rate over time

---

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run load tests
        env:
          TEST_TARGET_URL: ${{ secrets.STAGING_URL }}
          TEST_AUTH_TOKEN: ${{ secrets.TEST_AUTH_TOKEN }}
        run: |
          npm run test:load:multi-tenant

      - name: Generate report
        if: always()
        run: artillery report results.json --output report.html

      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: load-test-report
          path: report.html

      - name: Alert on failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"🚨 Load test failed!"}'
```

---

## Common Issues & Solutions

### Issue: Rate Limits (429 errors)

**Symptoms:**
```
Codes:
  200: 4500
  429: 500  ← Too many!
```

**Solutions:**
1. Reduce `arrivalRate` in test config
2. Increase `duration` to spread load
3. Upgrade OpenAI/Pinecone tier
4. Implement request queuing

---

### Issue: Slow Response Times

**Symptoms:**
```
Response time (msec):
  p95: 8500   ← Should be < 2000
  p99: 15000  ← Should be < 5000
```

**Solutions:**
1. Check database query performance
2. Optimize slow endpoints (use Sentry traces)
3. Add caching (Redis/Upstash)
4. Increase database connection pool
5. Review Vercel function size/memory

---

### Issue: High Error Rate

**Symptoms:**
```
Errors:
  ETIMEDOUT: 150 (15%)  ← Too high!
```

**Solutions:**
1. Increase function timeout (maxDuration)
2. Check external service status (OpenAI, Supabase)
3. Review error logs in Sentry
4. Add retry logic with exponential backoff

---

### Issue: Database Connection Pool Exhausted

**Symptoms:**
```
Errors:
  "remaining connection slots reserved" ← Supabase
```

**Solutions:**
1. Increase Supabase connection limit
2. Use connection pooling (PgBouncer)
3. Review long-running queries
4. Close connections properly

---

## Best Practices

### 1. Test Environments

**Never test production directly!**

```
✅ Local (localhost:3000) - Development testing
✅ Staging (staging.resply.com) - Pre-deployment validation
❌ Production (resply.com) - Only with extreme caution
```

### 2. Gradual Load Increases

Always ramp up slowly:

```yaml
phases:
  - duration: 60
    arrivalRate: 5        # Start low
  - duration: 120
    arrivalRate: 5
    rampTo: 20            # Ramp gradually
  - duration: 180
    arrivalRate: 20       # Sustained load
```

### 3. Monitor While Testing

Keep these open during tests:
- **Sentry**: Watch for errors
- **Vercel Dashboard**: Monitor function invocations
- **Supabase Dashboard**: Check database metrics
- **OpenAI Usage**: Track API costs

### 4. Baseline First

Run tests on a quiet system to establish baseline:

```bash
# Baseline (no load)
artillery quick --count 1 --num 10 http://localhost:3000/api/health

# Then scale up
npm run test:load:health
```

### 5. Test Realistic Scenarios

Don't just hammer one endpoint:

```yaml
scenarios:
  - name: "Realistic User Flow"
    flow:
      - get: "/api/health"           # Check system
      - think: 2                     # Wait 2s
      - post: "/api/conversations"   # Start conversation
      - think: 5                     # User types for 5s
      - post: "/api/chat"            # Send message
      - think: 10                    # Read response
```

---

## Interpreting Results for Optimization

### Scenario 1: Database is Slow

**Signs:**
- `/api/health` showing high `db_latency`
- Queries taking > 1000ms

**Actions:**
1. Check slow query log in Supabase
2. Add missing indexes
3. Optimize N+1 queries
4. Consider read replicas

---

### Scenario 2: OpenAI Rate Limits

**Signs:**
- Many 429 errors on `/api/chat/completions`
- `Error: Rate limit exceeded`

**Actions:**
1. Upgrade OpenAI tier
2. Implement request queuing
3. Add caching for similar queries
4. Use batch processing where possible

---

### Scenario 3: Document Processing Bottleneck

**Signs:**
- `/api/documents/process` timing out
- P99 > 5 minutes

**Actions:**
1. Move to background jobs (BullMQ, Inngest)
2. Batch embeddings generation
3. Increase Vercel function timeout
4. Use streaming for large files

---

### Scenario 4: Widget Overload

**Signs:**
- `/api/conversations/[id]/messages` errors
- High database write contention

**Actions:**
1. Implement rate limiting per workspace
2. Use write-through cache
3. Optimize email notification logic
4. Consider async notification processing

---

## Next Steps

After completing artillery setup:

1. ✅ Run baseline tests (Task 2.1 complete)
2. ⏳ Run full load tests (Task 2.2)
3. ⏳ Identify bottlenecks
4. ⏳ Implement optimizations (Task 2.3)
5. ⏳ Run stress tests (Task 2.4)
6. ⏳ Document findings

---

## Related Documentation

- [Sentry Setup](SENTRY_SETUP.md) - Error tracking during tests
- [Uptime Monitoring](UPTIME_MONITORING_SETUP.md) - Monitor availability
- [Slack Alerting](SLACK_ALERTING_SETUP.md) - Get notified of issues
- [Artillery Docs](https://www.artillery.io/docs) - Official documentation

---

**Last Updated**: 2025-01-05
**Status**: ✅ Setup complete, ready for load testing
**Estimated Time to Run Full Suite**: 30-45 minutes
