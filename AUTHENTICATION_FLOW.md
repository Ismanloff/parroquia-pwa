# Authentication Flow - Resply SaaS

## ✅ Completed Implementation

### 1. Registration with Workspace Creation

**Endpoint:** `/api/auth/register-with-workspace`

**Flow:**
1. User clicks "Comenzar Gratis" button (showing "14 días gratis" badge)
2. AuthModal opens in register mode
3. User enters: name, email, password
4. Backend creates:
   - User in `auth.users` (email auto-confirmed)
   - Workspace with `plan='free'`, `billing_status='trialing'`, `trial_ends_at=+14 days`
   - Workspace member with `role='owner'`
   - Initial workspace settings
   - Onboarding progress record
5. User auto-logged in
6. Redirected to `/onboarding`

### 2. Onboarding Wizard

**Route:** `/onboarding`

**Steps:**
- **Step 1: Workspace Configuration**
  - Set parish name
  - Set chatbot name

- **Step 2: Chatbot Customization**
  - Choose tone (formal/friendly/professional)
  - Select language (es/en/fr/pt)
  - Configure welcome message

- **Step 3: Upload Document (Optional)**
  - Upload first document for RAG
  - Can skip this step

**After Completion:**
- Marks onboarding as complete
- Redirects to `/dashboard`

### 3. Login Flow

**Flow:**
1. User clicks "Iniciar Sesión" button
2. AuthModal opens in login mode
3. User enters email + password
4. If authenticated:
   - Middleware checks onboarding status
   - Redirects to `/dashboard` if complete
   - Redirects to `/onboarding` if incomplete

### 4. Protected Routes

**Middleware:** `middleware.ts`

**Protection Rules:**
- `/` (Landing page)
  - Authenticated users → Redirect to `/dashboard` or `/onboarding`

- `/dashboard/*`
  - Unauthenticated → Redirect to `/`
  - No workspace → Redirect to `/`
  - Incomplete onboarding → Redirect to `/onboarding`

- `/onboarding`
  - Unauthenticated → Redirect to `/`
  - Must have workspace
  - After completion → Redirect to `/dashboard`

## 📁 Files Created/Modified

### New Files
1. `app/api/auth/register-with-workspace/route.ts` - Registration endpoint
2. `app/api/workspaces/my-workspace/route.ts` - Get user workspace
3. `app/api/workspaces/update/route.ts` - Update workspace
4. `app/api/workspaces/settings/route.ts` - Update workspace settings
5. `app/api/onboarding/progress/route.ts` - Update onboarding progress
6. `app/onboarding/page.tsx` - Onboarding wizard UI
7. `components/landing/AuthModal.tsx` - Login/Register modal
8. `middleware.ts` - Route protection
9. `supabase/migrations/20250103_001_add_trial_ends_at.sql` - Trial field

### Modified Files
1. `components/landing/Header.tsx` - Added AuthModal integration
2. `contexts/AuthContext.tsx` - Added `login` alias for `signIn`

## 🗄️ Database Schema Updates

### Added Field
- `workspaces.trial_ends_at` (timestamptz)
  - Stores when 14-day trial expires
  - Used to show trial banner in dashboard

## 🧪 Testing Instructions

### Test 1: New User Registration
1. Go to `http://localhost:3000`
2. Click "Comenzar Gratis" button
3. Fill in:
   - Name: "Test User"
   - Email: "test@example.com"
   - Password: "password123"
   - Check terms box
4. Click "Comenzar Gratis"
5. **Expected:** Redirected to `/onboarding`

### Test 2: Onboarding Flow
1. Complete Step 1 (workspace name)
2. Complete Step 2 (chatbot settings)
3. Skip or complete Step 3 (document upload)
4. **Expected:** Redirected to `/dashboard`

### Test 3: Login
1. Go to `http://localhost:3000`
2. Click "Iniciar Sesión"
3. Enter credentials from Test 1
4. **Expected:** Redirected to `/dashboard` (if onboarding complete)

### Test 4: Protected Routes
1. Logout or open incognito window
2. Try to access `http://localhost:3000/dashboard`
3. **Expected:** Redirected to `/`

### Test 5: Incomplete Onboarding
1. Register a new user
2. During onboarding, close browser before completing
3. Login again
4. **Expected:** Redirected back to `/onboarding` at the step you left off

## 📊 Trial System

### How It Works
- New users get 14-day PRO trial automatically
- Trial starts immediately upon registration
- `workspaces.billing_status = 'trialing'`
- `workspaces.trial_ends_at = now() + 14 days`
- After trial expires:
  - Can implement automatic downgrade to FREE plan
  - Show upgrade prompts in dashboard

### Next Steps for Trial
1. Create trial banner in dashboard showing days remaining
2. Create upgrade flow to PRO/Enterprise
3. Add Stripe integration for payments
4. Create webhook to handle trial expiration

## 🔐 Security Features

- ✅ Passwords hashed by Supabase Auth
- ✅ Email auto-confirmed (better UX for SaaS)
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Workspace-based multi-tenancy
- ✅ Role-based access control (RBAC)
- ✅ Server-side session validation via middleware
- ✅ Cookie-based authentication (SSR compatible)

## 🚀 What's Next

### Immediate (Next Tasks)
1. Test the complete flow end-to-end
2. Add trial banner to dashboard
3. Create document upload functionality
4. Add RLS policies for all tables

### Short-term
1. Implement Stripe billing integration
2. Create upgrade flows (FREE → PRO, PRO → Enterprise)
3. Add email notifications (welcome, trial ending, etc.)
4. Create admin panel for workspace management

### Long-term
1. Multi-channel integration (WhatsApp, Instagram)
2. AI chatbot with RAG (Pinecone + OpenAI)
3. Analytics dashboard
4. Team collaboration features

## 💡 Notes

- **Warning:** Next.js 16 deprecates `middleware.ts` in favor of `proxy`. The middleware still works but consider migrating in the future.
- **Database:** Remember to run migrations on production: `npm run db:push`
- **Environment:** Ensure all Supabase environment variables are set in production
- **Cookies:** Auth uses cookies for SSR compatibility. Make sure cookie domain is configured correctly in production.
