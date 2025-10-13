# 🏗️ System Architecture - Post-Stream Reports

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Live Monitor │  │ Post-Stream  │  │  Referrals   │          │
│  │              │  │   Reports    │  │  Dashboard   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         Tab 1             Tab 2             Tab 3               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      REACT APPLICATION                          │
│  Components:                                                    │
│  • StreamAnalyzer (input form)                                  │
│  • IntentCard (buyer cards)                                     │
│  • StreamAnalysis (full dashboard)                              │
│  • ReferralDashboard (earnings)                                 │
└─────────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Node Server   │  │ Supabase Edge    │  │   PostgreSQL     │
│  (Scraper)     │  │   Functions      │  │   Database       │
│                │  │                  │  │                  │
│ • Puppeteer    │  │ • analyze-intents│  │ • stream_analyses│
│ • /api/scrape  │  │ • update-status  │  │ • message_approvals│
└────────────────┘  └──────────────────┘  └──────────────────┘
         ↓                    ↓
┌────────────────┐  ┌──────────────────┐
│  Whatnot.com   │  │  Claude API      │
│  (Target Site) │  │  (Anthropic)     │
└────────────────┘  └──────────────────┘
```

---

## Data Flow: Post-Stream Analysis

### Step-by-Step Process

```
1. USER ACTION
   └─ Pastes Whatnot stream URL
   └─ Clicks "Analyze Stream with AI"
          ↓
2. SCRAPING (Node Server)
   └─ POST /api/scrape-stream
   └─ Puppeteer launches browser
   └─ Navigates to Whatnot URL
   └─ Extracts chat messages
   └─ Returns: [{username, message, timestamp}]
          ↓
3. AI ANALYSIS (Supabase Edge Function)
   └─ POST analyze-stream-intents
   └─ Step 3a: Intent Detection
   │   └─ Send all comments to Claude
   │   └─ Prompt: "Find buying intent"
   │   └─ Claude returns: [{username, item_wanted, details, confidence}]
   └─ Step 3b: Message Generation
       └─ For each intent:
           └─ Send to Claude with context
           └─ Prompt: "Write casual DM"
           └─ Claude returns: "Hey Jessica! Yes I have..."
          ↓
4. DATABASE STORAGE
   └─ INSERT into stream_analyses
   └─ Data: {user_id, stream_url, intents_data[], total_intents}
   └─ Returns: {analysisId}
          ↓
5. UI RENDERING
   └─ Navigate to /stream-report/:analysisId
   └─ Fetch analysis from database
   └─ Render IntentCards
          ↓
6. USER APPROVAL
   └─ User clicks ✅ APPROVE & SEND
   └─ Copy message to clipboard
   └─ POST update-message-status
   └─ UPDATE stream_analyses.intents_data
   └─ INSERT into message_approvals
          ↓
7. EXTERNAL ACTION
   └─ User pastes in Whatnot DMs
   └─ Sale recovered! 💰
```

---

## Component Architecture

### Frontend Components

```
src/
├── pages/
│   ├── DashboardPage.tsx           # Container for Dashboard
│   │   └─ Handles: sessions, claims, auth
│   │
│   └── StreamReport.tsx            # Individual report page
│       └─ Fetches analysis by ID
│       └─ Renders StreamAnalysis component
│
├── components/
│   ├── Dashboard.tsx               # Main layout with tabs
│   │   ├─ Tab 1: Live Monitoring (existing)
│   │   ├─ Tab 2: Post-Stream Reports (NEW)
│   │   │   └─ <StreamAnalyzer />
│   │   └─ Tab 3: Referrals (NEW)
│   │       └─ <ReferralDashboard />
│   │
│   ├── StreamAnalyzer.tsx          # URL input + trigger
│   │   ├─ Input field for Whatnot URL
│   │   ├─ "Analyze" button
│   │   ├─ Progress indicator
│   │   └─ Calls: scrape → analyze → navigate
│   │
│   ├── StreamAnalysis.tsx          # Full report view
│   │   ├─ Stats cards (Total, Approved, Pending, Value)
│   │   ├─ Progress banner
│   │   ├─ Export CSV button
│   │   └─ List of <IntentCard />
│   │
│   ├── IntentCard.tsx              # Individual buyer card
│   │   ├─ Header: username, timestamp
│   │   ├─ Original comment
│   │   ├─ Drafted message (editable)
│   │   ├─ Actions: APPROVE / EDIT / SKIP
│   │   └─ Confidence badge
│   │
│   └── ReferralDashboard.tsx       # Referral tracking
│       ├─ Stats: earnings, referrals, MRR
│       ├─ Referral link with copy button
│       └─ How it works section
```

---

## Backend Architecture

### Supabase Edge Functions (Deno)

```
supabase/functions/
│
├── analyze-stream-intents/
│   └── index.ts
│       ├─ Auth: Validates user token
│       ├─ Input: {comments[], streamUrl, sellerName}
│       ├─ Process:
│       │   1. Batch all comments into one Claude prompt
│       │   2. Parse JSON response (array of intents)
│       │   3. For each intent:
│       │      - Generate personalized message
│       │      - Add to results array
│       │   4. Save to database
│       └─ Output: {intents[], totalIntents, estimatedValue, analysisId}
│
└── update-message-status/
    └── index.ts
        ├─ Auth: Validates user token
        ├─ Input: {analysisId, username, status, editedMessage}
        ├─ Process:
        │   1. Fetch analysis from DB
        │   2. Find specific intent
        │   3. Update status in intents_data
        │   4. Insert into message_approvals table
        └─ Output: {success, status, message}
```

### Node.js Scraper Server

```
realtime-scraper.js
├─ Express server on port 3001
├─ WebSocket for real-time monitoring
│
└─ POST /api/scrape-stream
    ├─ Input: {url}
    ├─ Process:
    │   1. Launch Puppeteer browser
    │   2. Navigate to Whatnot URL
    │   3. Wait for chat to load
    │   4. Extract chat elements
    │   5. Parse username + message pairs
    │   6. Deduplicate results
    │   7. Close browser
    └─ Output: {messages: [{username, message, timestamp}]}
```

---

## Database Schema

### Tables

```sql
-- Stream analyses (main table)
stream_analyses
├─ id (uuid, PK)
├─ user_id (uuid, FK → auth.users)
├─ stream_url (text)
├─ total_comments (integer)
├─ total_intents (integer)
├─ intents_data (jsonb)          # Array of buyer intents
│   └─ [{
│       username: string,
│       timestamp: string,
│       comment: string,
│       item_wanted: string,
│       details: string,
│       drafted_message: string,
│       status: 'pending' | 'approved' | 'skipped',
│       confidence: number
│     }]
├─ analyzed_at (timestamp)
└─ created_at (timestamp)

-- Message approvals (tracking)
message_approvals
├─ id (uuid, PK)
├─ analysis_id (uuid, FK → stream_analyses)
├─ user_id (uuid, FK → auth.users)
├─ username (text)
├─ original_message (text)
├─ edited_message (text, nullable)
├─ status ('pending' | 'approved' | 'skipped')
├─ approved_at (timestamp, nullable)
└─ created_at (timestamp)

-- Referrals (revenue share)
referrals
├─ id (uuid, PK)
├─ referrer_user_id (uuid, FK → auth.users)
├─ referred_user_id (uuid, FK → auth.users, nullable)
├─ referral_code (text, unique)
├─ referred_email (text, nullable)
├─ status ('pending' | 'active' | 'inactive')
├─ tier ('founding_member' | 'early_access' | 'regular')
├─ lifetime_earnings (decimal)
└─ created_at (timestamp)

-- Referral earnings (payout tracking)
referral_earnings
├─ id (uuid, PK)
├─ referral_id (uuid, FK → referrals)
├─ amount (decimal)
├─ period_start (timestamp)
├─ period_end (timestamp)
├─ paid_out (boolean)
└─ created_at (timestamp)
```

---

## External APIs

### Claude API (Anthropic)

```
Endpoint: https://api.anthropic.com/v1/messages
Model: claude-3-5-sonnet-20241022

Request:
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096,
  "temperature": 0.3,
  "messages": [{
    "role": "user",
    "content": "Analyze these comments for buying intent..."
  }]
}

Response:
{
  "content": [{
    "type": "text",
    "text": "[{\"username\": \"...\", ...}]"
  }]
}

Cost: ~$0.003/1K input tokens, ~$0.015/1K output tokens
Average per stream: $0.10-0.30
```

### Whatnot (via Puppeteer)

```
Target: https://www.whatnot.com/live/[username]/[stream-id]
Method: Web scraping (no API available)

Extraction Strategy:
1. Find chat container (right sidebar)
2. Identify message elements
3. Parse structure:
   Username (first line)
   Message (subsequent lines)
4. Filter out system messages
5. Deduplicate by username:message key
```

---

## Security & Authentication

### Row-Level Security (RLS)

```sql
-- Users can only see their own data
stream_analyses
├─ SELECT: WHERE auth.uid() = user_id
├─ INSERT: WITH CHECK auth.uid() = user_id
└─ UPDATE: WHERE auth.uid() = user_id

message_approvals
├─ SELECT: WHERE auth.uid() = user_id
├─ INSERT: WITH CHECK auth.uid() = user_id
└─ UPDATE: WHERE auth.uid() = user_id

referrals
├─ SELECT: WHERE auth.uid() = referrer_user_id
└─ INSERT: WITH CHECK auth.uid() = referrer_user_id
```

### API Authentication

```
Supabase Functions:
├─ Header: Authorization: Bearer <user-jwt-token>
├─ Validation: supabase.auth.getUser(token)
└─ Fail: Return 401 Unauthorized

Node Scraper:
├─ No auth (internal API)
└─ TODO: Add API key for production
```

---

## Performance Considerations

### Analysis Speed
- **Scraping**: 5-10 seconds (depends on Whatnot load time)
- **Intent Detection**: 3-5 seconds (batch API call)
- **Message Generation**: 5-15 seconds (N individual calls)
- **Total**: 15-30 seconds for typical stream

### Optimization Strategies
1. **Parallel message generation**: Can generate multiple messages simultaneously
2. **Cache common responses**: For similar item types
3. **Batch size limits**: Cap at 100 comments per analysis
4. **Database indexing**: On user_id, analyzed_at

### Scaling
- **Claude API**: No rate limits with proper key
- **Supabase**: Auto-scales edge functions
- **Scraper**: Stateless, can run multiple instances
- **Database**: Indexed queries, JSONB for flexibility

---

## Error Handling

### Error Flow

```
User Action
    ↓
Try: Scrape stream
    ├─ Fail → Show: "Failed to scrape stream"
    └─ Success → Continue
            ↓
Try: Analyze with AI
    ├─ Fail → Show: "Analysis failed, try again"
    │         Log: Error to console
    │         Fallback: Return empty intents
    └─ Success → Continue
            ↓
Try: Save to database
    ├─ Fail → Show: "Couldn't save analysis"
    │         Log: Error to console
    │         Fallback: Still show results (no save)
    └─ Success → Continue
            ↓
Navigate to report page
```

### Error States
- No stream URL provided
- Invalid Whatnot URL
- Stream has no comments
- Claude API key not configured
- Scraper server not running
- Database connection failed
- Analysis not found (bad ID)

---

## Deployment Architecture

### Current (Development)
```
┌─────────────────────────────────────────┐
│         Local Development               │
├─────────────────────────────────────────┤
│ Frontend: localhost:8080 (Vite)         │
│ Scraper: localhost:3001 (Node)          │
│ Database: Supabase Cloud                │
│ Functions: Supabase Cloud               │
│ AI: Claude API (Anthropic Cloud)        │
└─────────────────────────────────────────┘
```

### Recommended (Production)
```
┌─────────────────────────────────────────┐
│          Production Stack               │
├─────────────────────────────────────────┤
│ Frontend: Vercel/Netlify                │
│ Scraper: Render/Railway/Fly.io          │
│ Database: Supabase Cloud                │
│ Functions: Supabase Cloud               │
│ AI: Claude API (Anthropic Cloud)        │
└─────────────────────────────────────────┘

Domain: app.dealflow.com
SSL: Auto (Vercel/Netlify)
CDN: Included
```

---

## Monitoring & Observability

### Logs
- **Supabase Functions**: Built-in logging (view in dashboard)
- **Scraper**: Console logs (TODO: Add structured logging)
- **Frontend**: Browser console + error tracking (TODO: Sentry)

### Metrics to Track
- Analysis completion rate
- Average analysis time
- Intent detection accuracy
- Message approval rate
- User engagement (approvals per analysis)
- API costs (Claude API usage)

### Health Checks
```
GET /health → Scraper server status
GET /api/functions/analyze-stream-intents → 401 (function exists)
```

---

## Cost Analysis

### Per Stream Analysis
- **Claude API**: $0.10-0.30
- **Supabase**: Free tier covers ~1000 analyses/day
- **Scraper**: Free (self-hosted) or $5/mo (Render)

### Monthly Costs (100 users, 10 streams/user/month)
- Claude API: $100-300
- Supabase: $0 (free tier) or $25 (pro)
- Scraper: $5-10 (Render/Railway)
- **Total**: $105-335/month

### Revenue
- 100 users × $79/mo = $7,900/month
- Gross margin: ~95%

---

## Future Architecture Improvements

### V2 Features
1. **Real-time monitoring**: WebSocket to Claude API
2. **Message templates**: Pre-defined response styles
3. **Batch operations**: Approve all, skip all
4. **Analytics dashboard**: Conversion tracking
5. **A/B testing**: Different message styles
6. **Webhook integration**: Notify on completion

### Scalability
- Add Redis cache for common item types
- Queue system for batch analyses (Bull/BeeQueue)
- CDN for static assets
- Database read replicas for analytics

---

**Architecture Complete! Ready for production deployment. 🚀**
