# 📊 WEEK 4: ADMIN DASHBOARD - Implementation Plan

**Duration**: 40 hours
**Priority**: HIGH
**Status**: 🚀 IN PROGRESS

---

## 🎯 Objectives

Build a comprehensive admin dashboard for workspace owners and admins to:
1. Monitor analytics and key metrics
2. Manage conversations and customer interactions
3. Manage team members and permissions
4. Upload and manage knowledge base documents
5. Customize widget appearance and behavior

---

## 🏗️ Architecture Overview

### Route Structure
```
/dashboard/[workspaceId]/
  ├── /analytics          # Metrics, charts, insights
  ├── /conversations      # Conversation list and details
  │   └── /[id]          # Individual conversation view
  ├── /team              # Team member management
  ├── /documents         # Document upload and management
  └── /widget            # Widget customization
```

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form + Zod validation
- **State**: React Context or Zustand (if needed)
- **Data Fetching**: SWR or React Query for real-time updates

---

## 📋 Tasks Breakdown

### 1. Analytics Dashboard (12 hours) ✅ Priority 1

**Goal**: Provide insights into workspace performance and usage.

#### Metrics to Display
- **Conversations**: Total, new today, active, resolved
- **Response Time**: Average, median, 95th percentile
- **Messages**: Total sent/received, by channel (WhatsApp, Widget)
- **Documents**: Total uploaded, storage used, most referenced
- **Team Activity**: Messages by agent, online agents

#### Components to Build
```
app/dashboard/[workspaceId]/analytics/
  ├── page.tsx                    # Main analytics page
  └── components/
      ├── MetricsGrid.tsx         # Overview cards (4-6 key metrics)
      ├── ConversationsChart.tsx  # Line chart (last 30 days)
      ├── ResponseTimeChart.tsx   # Bar chart (hourly distribution)
      ├── ChannelDistribution.tsx # Pie chart (WhatsApp vs Widget)
      ├── TopDocuments.tsx        # Table (most referenced docs)
      └── TeamActivity.tsx        # List (agent performance)
```

#### API Endpoints Needed
- `GET /api/analytics/overview?workspaceId={id}&period={7d|30d|90d}`
- `GET /api/analytics/conversations?workspaceId={id}&period={7d|30d|90d}`
- `GET /api/analytics/team?workspaceId={id}&period={7d|30d|90d}`

#### Sample Queries
```sql
-- Total conversations
SELECT COUNT(*) FROM conversations WHERE workspace_id = ? AND created_at > NOW() - INTERVAL '30 days';

-- Average response time
SELECT AVG(first_response_time) FROM conversations WHERE workspace_id = ? AND first_response_time IS NOT NULL;

-- Messages by channel
SELECT channel, COUNT(*) as count FROM messages WHERE workspace_id = ? GROUP BY channel;
```

---

### 2. Conversation Management (8 hours) ✅ Priority 2

**Goal**: Allow agents to view, search, and manage customer conversations.

#### Features
- **Conversation List**: Paginated, filterable, searchable
- **Filters**: Status (active/resolved), channel (WhatsApp/Widget), date range, assigned agent
- **Actions**: View details, assign agent, mark as resolved, delete
- **Detail View**: Full conversation thread, customer info, assign/reassign

#### Components to Build
```
app/dashboard/[workspaceId]/conversations/
  ├── page.tsx                    # Conversation list
  ├── [id]/
  │   └── page.tsx               # Conversation detail view
  └── components/
      ├── ConversationList.tsx    # Table with filters
      ├── ConversationFilters.tsx # Filter sidebar/toolbar
      ├── ConversationCard.tsx    # Individual conversation preview
      ├── MessageThread.tsx       # Message display (chat UI)
      ├── AssignAgentDialog.tsx   # Modal to assign/reassign agent
      └── ConversationActions.tsx # Action buttons (resolve, delete)
```

#### API Endpoints Needed
- `GET /api/conversations?workspaceId={id}&status={active|resolved}&channel={whatsapp|widget}&page={1}`
- `GET /api/conversations/[id]?includeMessages=true`
- `PATCH /api/conversations/[id]` (assign agent, update status)
- `DELETE /api/conversations/[id]` (soft delete)

---

### 3. Team Management (8 hours) ✅ Priority 3

**Goal**: Manage workspace members, roles, and permissions.

#### Features
- **Member List**: Show all team members with roles
- **Invite**: Email invitation with role selection
- **Edit Role**: Change member role (owner → admin, admin → agent, etc.)
- **Remove**: Remove member from workspace
- **Permissions Display**: Show what each role can do

#### Components to Build
```
app/dashboard/[workspaceId]/team/
  ├── page.tsx                    # Team list
  └── components/
      ├── TeamMemberList.tsx      # Table of members
      ├── InviteMemberDialog.tsx  # Modal to invite new member
      ├── EditRoleDialog.tsx      # Modal to change role
      ├── RemoveMemberDialog.tsx  # Confirmation modal
      └── RolePermissionsInfo.tsx # Info card showing permissions
```

#### Roles & Permissions
```typescript
// Already defined in database
type Role = 'owner' | 'admin' | 'agent' | 'viewer';

const PERMISSIONS = {
  owner: ['all'],
  admin: ['manage_team', 'manage_documents', 'view_analytics', 'manage_conversations'],
  agent: ['manage_conversations', 'view_documents'],
  viewer: ['view_conversations', 'view_analytics'],
};
```

#### API Endpoints Needed
- `GET /api/team?workspaceId={id}` (list members)
- `POST /api/team/invite` (existing endpoint - already implemented ✅)
- `PATCH /api/team/[memberId]` (update role)
- `DELETE /api/team/[memberId]` (remove member)

---

### 4. Document Management UI (8 hours) ✅ Priority 4

**Goal**: Interface for uploading, viewing, and managing knowledge base documents.

#### Features
- **Document List**: Table showing all documents with status
- **Upload**: Drag & drop zone with file validation (✅ signature validation already implemented)
- **Status Indicator**: pending, processing, completed, failed
- **Actions**: Download, reprocess, delete (✅ authorization already implemented)
- **Preview**: Show document metadata, chunks count, last updated

#### Components to Build
```
app/dashboard/[workspaceId]/documents/
  ├── page.tsx                    # Document list
  └── components/
      ├── DocumentList.tsx        # Table of documents
      ├── DocumentUpload.tsx      # Drag & drop upload zone
      ├── DocumentStatusBadge.tsx # Status indicator (pending/processing/done)
      ├── DocumentActions.tsx     # Action buttons (delete, reprocess)
      └── DocumentPreview.tsx     # Modal showing document details
```

#### Upload Flow (Already Implemented ✅)
1. User drops file or clicks to select
2. Client validates file type and size (Zod schema ✅)
3. POST to `/api/documents/upload` with multipart form data
4. Server validates file signature (✅ magic number validation implemented)
5. Server uploads to Supabase Storage
6. Server creates document record with status=pending
7. Server triggers async processing (`/api/documents/process`)
8. Client polls or uses WebSocket for status updates

#### API Endpoints (Already Exist ✅)
- `GET /api/documents?workspaceId={id}` (list documents)
- `POST /api/documents/upload` (✅ with file signature validation)
- `DELETE /api/documents/[id]` (✅ with authorization checks)
- `POST /api/documents/process` (trigger reprocessing)

---

### 5. Widget Customization (4 hours) ✅ Priority 5

**Goal**: Allow users to customize widget appearance and behavior with live preview.

#### Customization Options
```typescript
interface WidgetConfig {
  // Appearance
  primaryColor: string;        // Main color (buttons, header)
  headerText: string;          // "Chat with us" → Custom text
  welcomeMessage: string;      // Initial bot message
  position: 'bottom-right' | 'bottom-left';

  // Behavior
  autoOpen: boolean;           // Auto-open on page load
  autoOpenDelay: number;       // Delay before auto-open (ms)
  showAgentAvatar: boolean;    // Show agent profile pic

  // Branding
  agentName: string;           // "Support Team"
  agentAvatar: string;         // URL to avatar image
}
```

#### Components to Build
```
app/dashboard/[workspaceId]/widget/
  ├── page.tsx                    # Widget customization page
  └── components/
      ├── WidgetCustomizer.tsx    # Main customization form
      ├── WidgetPreview.tsx       # Live preview iframe/component
      ├── ColorPicker.tsx         # Color selection UI
      ├── PositionSelector.tsx    # Widget position selector
      └── WidgetCodeSnippet.tsx   # Embeddable script code
```

#### API Endpoints Needed
- `GET /api/workspaces/[id]/widget-config` (get current config)
- `PATCH /api/workspaces/[id]/widget-config` (update config)

#### Implementation Notes
- Store widget config in `workspaces` table (add JSONB column `widget_config`)
- Widget script reads config from `/api/workspaces/[id]/widget-config`
- Live preview updates in real-time as user changes options
- Provide copy-paste script tag for website integration

---

## 🗄️ Database Schema Updates

### New Columns Needed

```sql
-- Widget customization
ALTER TABLE workspaces
ADD COLUMN IF NOT EXISTS widget_config JSONB DEFAULT '{
  "primaryColor": "#3b82f6",
  "headerText": "Chat con nosotros",
  "welcomeMessage": "¡Hola! ¿En qué puedo ayudarte?",
  "position": "bottom-right",
  "autoOpen": false,
  "autoOpenDelay": 3000,
  "showAgentAvatar": true,
  "agentName": "Equipo de Soporte",
  "agentAvatar": null
}'::jsonb;

-- Analytics caching (optional, for performance)
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'overview', 'conversations', 'team'
  period TEXT NOT NULL, -- '7d', '30d', '90d'
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, metric_type, period)
);

CREATE INDEX idx_analytics_cache_workspace ON analytics_cache(workspace_id);
```

---

## 📐 UI/UX Guidelines

### Design Principles
1. **Consistency**: Use shadcn/ui components throughout
2. **Responsiveness**: Mobile-first design (dashboard on tablet/desktop)
3. **Performance**: Virtualized lists for large datasets
4. **Accessibility**: ARIA labels, keyboard navigation
5. **Feedback**: Loading states, success/error toasts

### Color Scheme
- **Primary**: Blue (#3b82f6) - Actions, links
- **Success**: Green (#10b981) - Completed, success messages
- **Warning**: Yellow (#f59e0b) - Pending, warnings
- **Error**: Red (#ef4444) - Errors, destructive actions
- **Neutral**: Gray (#6b7280) - Text, borders

### Typography
- **Headings**: Inter font, semibold
- **Body**: Inter font, regular
- **Monospace**: JetBrains Mono (for code snippets)

---

## 🧪 Testing Plan

### Unit Tests
- ✅ API endpoint tests (conversation CRUD, team management, document upload)
- ✅ Component tests (form validation, button states)

### Integration Tests
- ✅ Full user flow: Login → Upload document → View in conversations
- ✅ Permission tests: Viewer can't delete documents, agent can

### Manual Testing
- ✅ Cross-browser testing (Chrome, Firefox, Safari)
- ✅ Responsive design testing (mobile, tablet, desktop)
- ✅ Performance testing (large datasets, slow network)

---

## 📦 Dependencies to Install

```bash
# Charts
npm install recharts

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Data fetching
npm install swr

# Utilities
npm install date-fns clsx tailwind-merge

# File upload
npm install react-dropzone
```

---

## ⏱️ Time Estimates

| Task | Hours | Priority | Dependencies |
|---|---|---|---|
| **1. Analytics Dashboard** | 12h | P1 | None |
| **2. Conversation Management** | 8h | P2 | Analytics APIs |
| **3. Team Management** | 8h | P3 | None (invite API exists) |
| **4. Document Management UI** | 8h | P4 | Upload/delete APIs exist |
| **5. Widget Customization** | 4h | P5 | None |
| **Total** | **40h** | | |

---

## 🚀 Implementation Order

### Phase 1: Foundation (Day 1-2)
1. Set up dashboard layout and navigation
2. Install dependencies
3. Create shared components (MetricCard, DataTable, etc.)
4. Set up analytics API endpoints

### Phase 2: Core Features (Day 3-5)
5. Build Analytics Dashboard (12h)
6. Build Conversation Management (8h)

### Phase 3: Team & Documents (Day 6-7)
7. Build Team Management (8h)
8. Build Document Management UI (8h)

### Phase 4: Polish (Day 8)
9. Build Widget Customization (4h)
10. Testing and bug fixes

---

## 📊 Success Metrics

- ✅ All 5 dashboard sections functional
- ✅ Admin can invite team members and manage roles
- ✅ Documents can be uploaded and managed via UI
- ✅ Conversations can be filtered and assigned to agents
- ✅ Widget can be customized and preview works
- ✅ Performance: Dashboard loads in < 2 seconds
- ✅ No critical bugs or security issues

---

## 🎯 Next Steps

1. ✅ Create dashboard layout and navigation
2. Install necessary dependencies
3. Build analytics API endpoints
4. Implement Analytics Dashboard UI
5. Continue with remaining sections

---

**Status**: 🚀 **READY TO START**

**Author**: Claude (Anthropic)
**Date**: 2025-11-06
**Project**: Resply SaaS - Week 4
