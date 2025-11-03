# Resply

Multi-tenant B2B SaaS platform with AI-powered customer support assistant.

## Stack Tecnológico

- **Next.js 16.0.0** with Turbopack
- **React 19.2.0** with React Compiler
- **TypeScript** with strict mode
- **Tailwind CSS** with modern design system
- **OpenAI Agents SDK** for intelligent chatbot
- **Pinecone** for multi-tenant vector search (RAG)
- **Voyage AI** for embeddings (1024 dims)
- **Anthropic Claude** for query expansion and conversational rewriting
- **Supabase** for authentication and multi-tenant data
- **Redis Cloud** for semantic caching
- **Resend** for transactional emails

## Features

✅ **AI Chatbot** - Customer support assistant with RAG-powered document search
✅ **Calendar** - Event management with Google Calendar sync
✅ **Multi-tenant** - Workspace-based isolation (Supabase + Pinecone namespaces)
✅ **Authentication** - Secure login/register with Supabase
✅ **Document Search** - AI-powered search across uploaded resources
✅ **Semantic Cache** - Redis-based intelligent response caching
✅ **Quick Actions** - Context-aware button suggestions
✅ **Modern UI** - Responsive design with dark mode support

## Local Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Accounts in: OpenAI, Pinecone, Anthropic, Supabase, Resend, Redis Cloud, Voyage AI

### Setup

1. **Clone repository**

```bash
git clone <repo-url>
cd resply
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env.local` file with the following variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key

# ChatKit Workflow ID (optional if using OpenAI Agents SDK)
CHATKIT_WORKFLOW_ID=wf_...

# Agent Configuration
AGENT_NAME=Resply Assistant
OPENAI_AGENT_MODEL=gpt-4o-mini
OPENAI_VECTOR_STORE_ID=vs_...

# Agent instructions
AGENT_INSTRUCTIONS="You are a business assistant that helps with customer support..."

# Google Calendar ICS URL
GOOGLE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/...

# Supabase (authentication + multi-tenant data)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (transactional emails)
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Resply <noreply@resply.com>

# Pinecone (multi-tenant vector search)
# Index: saas | Embeddings: voyage-3-large (1024 dims)
# Namespace pattern: ws_{workspace_id}
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=saas
PINECONE_NAMESPACE=saas

# Voyage AI (embeddings provider)
VOYAGE_API_KEY=your_voyage_api_key

# Anthropic (Query Expansion with Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Redis Cloud (semantic caching)
REDIS_URL=your_redis_url
```

4. **Run in development**

```bash
npm run dev
```

Application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

```bash
npm run dev          # Development with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint linter
npm run lint:fix     # Auto-fix linting errors
npm run type-check   # TypeScript type checking
npm test             # Tests with Vitest
npm run analyze      # Bundle analyzer
```

## Deployment on Vercel

### 1. Preparation

Ensure local build works correctly:

```bash
npm run build
```

### 2. Deploy to Vercel

#### Option A: From GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Configure environment variables (see next section)
5. Automatic deployment

#### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Configure Environment Variables in Vercel

In Vercel dashboard > Settings > Environment Variables, add all variables from `.env.local`:

**Required variables:**
- `OPENAI_API_KEY`
- `OPENAI_VECTOR_STORE_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`
- `PINECONE_NAMESPACE`
- `VOYAGE_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_CALENDAR_ICS_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

**Optional variables:**
- `CHATKIT_WORKFLOW_ID`
- `REDIS_URL`
- `AGENT_NAME`
- `OPENAI_AGENT_MODEL`
- `AGENT_INSTRUCTIONS`

### 4. Verify Deployment

Once deployed:

1. Test AI chatbot
2. Verify calendar events
3. Test authentication (login/register)
4. Test document upload and RAG search
5. Verify semantic caching is working

## Architecture

```
app/
├── (tabs)/                  # Main tabs (Home, Calendar, Chat, Profile)
├── api/                     # API Routes
│   ├── chat/               # Chatbot endpoints
│   │   ├── message/        # Chat with OpenAI Agents
│   │   ├── message-stream/ # Response streaming
│   │   ├── tools/          # Agent tools (Pinecone, Calendar)
│   │   ├── data/           # Resources & knowledge base
│   │   └── utils/          # Cache, query expansion, quick actions
│   ├── calendar/           # Calendar events
│   ├── auth/               # Supabase authentication
│   └── workspaces/         # Multi-tenant workspace management
├── auth/                    # Auth pages (login, register)
components/                  # React components
├── landing/                # Landing page components
└── ui/                     # Reusable UI components
lib/                         # Utilities and configuration
├── supabase.ts             # Supabase client
├── pinecone.ts             # Pinecone vector store
└── voyage.ts               # Voyage AI embeddings
```

## Optimizations Implemented

### Performance
- ✅ React 19 Compiler for automatic optimization
- ✅ Turbopack for ultra-fast builds
- ✅ ISR (Incremental Static Regeneration) for static pages
- ✅ Automatic code splitting
- ✅ Image optimization with next/image
- ✅ Semantic caching with Redis (reduces API calls by 60%)

### SEO
- ✅ Dynamic metadata on each page
- ✅ Sitemap and robots.txt
- ✅ Open Graph tags
- ✅ Structured data

### UX
- ✅ Dark mode support
- ✅ Toast notifications
- ✅ Elegant loading states
- ✅ Error boundaries
- ✅ Quick action buttons (context-aware)
- ✅ Responsive mobile-first design

### Multi-tenancy
- ✅ Workspace-based isolation
- ✅ Pinecone namespaces per workspace (ws_{workspace_id})
- ✅ Supabase RLS policies for data security
- ✅ Separate vector stores per tenant

## Testing

```bash
# Run tests
npm test

# Tests in watch mode
npm test -- --watch

# Tests with coverage
npm test -- --coverage
```

## Troubleshooting

### Build Errors

If build fails on Vercel, verify:

1. All environment variables are configured
2. API keys are valid
3. OpenAI models exist and you have access
4. Pinecone index exists with correct dimensions (1024)
5. Voyage AI API key is valid

### Chatbot Not Responding

1. Verify `OPENAI_API_KEY` in environment variables
2. Check that `OPENAI_VECTOR_STORE_ID` is correct
3. Review logs in Vercel Dashboard
4. Verify OpenAI rate limits
5. Check Pinecone index status

### Semantic Cache Not Working

1. Verify `REDIS_URL` is configured
2. Check Redis Cloud connection status
3. Review semantic cache logs in API route

## Roadmap

- [ ] Admin dashboard for workspace management
- [ ] Advanced analytics and usage tracking
- [ ] Multi-language support (i18n)
- [ ] Integration with CRM systems
- [ ] Advanced document parsing (Excel, Word, PPT)
- [ ] Voice assistant integration
- [ ] Team collaboration features

## Contributing

Contributions are welcome. Please:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

To report bugs or request features, open an issue on GitHub.

## License

[MIT License](LICENSE)

---

**Built with ❤️ for modern businesses**
