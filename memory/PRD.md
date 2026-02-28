# Vivento - Dəvətnamə Platforması PRD

## Original Problem Statement
Vivento is an Azerbaijani digital wedding/event invitation platform that allows users to create, customize, and share digital invitations with guests. The platform includes template management, event creation, guest management, balance/payment system, and multilingual support (AZ, EN, RU).

## User Personas
- **Event Organizers**: Primary users creating invitations for weddings, birthdays, etc.
- **Admin Users**: Manage templates, categories, CMS content, and user data

## Core Requirements
1. Template selection and customization
2. Guest management with invitation tracking
3. Balance-based payment system (Epoint.az integration)
4. Multilingual support (Azerbaijani, English, Russian)
5. Admin panel for content management

---

## What's Been Implemented

### December 2024
- Full multi-language system (Navbar, Slider, Pages)
- Forgot Password page and backend endpoint
- Subscription/pricing sections removed
- AddBalance page simplified
- EventDetail balance display
- Features page created
- Footer links fixed
- Template selection flow fixed

### February 2025 (This Session)
**P0 BUG FIX - Payment Gateway Cancellation**
- **Issue**: Users could receive balance credits even when cancelling payment on Epoint.az gateway
- **Root Cause**: Multiple endpoints could auto-confirm pending payments
- **Fix Applied**:
  - Removed dangerous `/api/admin/sync-payments` endpoint
  - `/api/balance` now only expires old pending payments (>30 min), does NOT auto-confirm
  - New `/api/admin/expire-pending-payments` marks payments as expired WITHOUT crediting balance
  - `/api/payments/callback` is now the ONLY endpoint that can credit user balance
  - `PaymentResult.jsx` no longer trusts URL parameters - always checks backend API status
- **Status**: VERIFIED - 100% test pass rate (14/14 backend tests)

**EMAIL INTEGRATION - Resend.com**
- **Domain**: myvivento.com (verified on Resend)
- **Sender**: noreply@myvivento.com
- **Features Implemented**:
  1. **Welcome Email**: Sent automatically on new user registration
  2. **Password Reset Email**: Sent via `/api/auth/forgot-password` with secure token
  3. **Payment Invoice Email**: Sent after successful payment via Epoint callback
- **New Endpoints**:
  - `/api/auth/forgot-password` - Generates reset token and sends email
  - `/api/auth/reset-password` - Validates token and updates password
- **New Pages**:
  - `/reset-password` - Frontend page for setting new password
- **Status**: VERIFIED - 100% test pass rate, emails confirmed sent via Resend

**PAYMENT VERIFICATION FIX**
- **Issue**: Epoint callback wasn't reaching production server
- **Fix**: Added `/api/payments/{payment_id}/verify` endpoint that checks payment status directly with Epoint API
- **Key Change**: Changed field from `transaction` to `order_id` in Epoint status check
- **Status**: VERIFIED - Payments now correctly update balance

**GUEST LIST VIEW MODES**
- **Feature**: Added toggle between "Kartlar" (Cards) and "Siyahı" (List) views for guest list
- **List View**: Table format with #, Name, Phone, Status, Actions (copy link, view invite, WhatsApp)
- **Cards View**: Original card-based layout
- **Status**: IMPLEMENTED

**MOBILE EDITOR FIXES**
- **Issues Fixed**:
  1. Header buttons ("Saxla", "Növbəti Addım") no longer overflow on mobile
  2. Invitation design now shows fully with correct aspect ratio
  3. Touch drag & drop support added for moving elements on mobile
- **Technical Changes**:
  - Added `touchstart`, `touchmove`, `touchend` event handlers
  - Canvas uses responsive width with `aspectRatio` CSS property
  - Reordered grid layout - canvas shows first on mobile, tools below
  - Added `touch-none` CSS to prevent default touch scrolling on elements
- **Status**: IMPLEMENTED

---

## Prioritized Backlog

### P1 - High Priority
- [ ] Invitation Thumbnail Display Bug (recurring visual issue - images cropped/zoomed incorrectly)
- [ ] Full Epoint.az Payment Flow Production Testing

### P2 - Medium Priority
- [ ] Multilingual Blog Posts Editing in Admin CMS
- [ ] Re-enable Google/Facebook Login

### P3 - Low Priority
- [ ] Envelope Animation Enhancements (sound effects)
- [ ] Refactor server.py into routers directory
- [ ] Refactor EventDetail.jsx (decouple complex logic)

---

## Technical Architecture

### Backend
- FastAPI with MongoDB
- Epoint.az payment integration
- Cloudinary for image uploads
- JWT authentication

### Frontend
- React with React Router
- i18next for translations
- Tailwind CSS + Shadcn/UI
- Framer Motion for animations

### Key Endpoints
- `/api/payments/callback` - ONLY endpoint that credits balance (via Epoint webhook)
- `/api/balance` - Get balance, expire old pending payments
- `/api/admin/expire-pending-payments` - Safely expire stuck payments
- `/api/auth/forgot-password` - Send password reset email
- `/api/auth/reset-password` - Reset password with token

### Integrations
- **Epoint.az**: Payment gateway for balance top-up
- **Resend.com**: Transactional emails (welcome, password reset, invoices)
- **Cloudinary**: Image uploads
- **Google OAuth**: Social login (available but on hold)

---

## Test Credentials
- Email: admin@vivento.az
- Password: Vivento123!

## Test Reports
- `/app/test_reports/iteration_3.json` - Payment bug fix verification
- `/app/test_reports/iteration_4.json` - Email integration verification
- `/app/backend/tests/test_payment_bug_fix.py` - Automated payment tests
- `/app/backend/tests/test_email_integration.py` - Automated email tests
