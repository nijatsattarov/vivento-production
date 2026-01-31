# Test Results - Bug Fixes

## Testing Protocol
- DO NOT EDIT THIS SECTION

## Incorporate User Feedback
- N/A

## Test Cases to Execute

### 1. Forgot Password Link
- Go to /login
- Click "Şifrəni unutdunuz?" link
- Verify it redirects to /forgot-password (NOT to homepage)
- Verify the forgot password page loads correctly

### 2. Contact Page Phone Number
- Go to /contact
- Verify phone number is visible: +994 50 200 12 34
- Verify email, address, and working hours are displayed

### 3. Copyright Year
- Go to homepage
- Scroll to footer
- Verify copyright shows 2025 (not 2024)

### 4. Dashboard Upgrade Button
- Login with admin@vivento.az / Vivento123!
- Check that upgrade button shows "YÜKSƏLDİN" (not "Yeniləyin")
- Verify button navigates to /add-balance

### 5. Add Balance Placeholder
- Go to /add-balance (logged in)
- Check custom amount placeholder shows "Məbləği qeyd edin"
- Check max amount is 999 AZN (not 1000)

### Test Credentials
- Email: admin@vivento.az
- Password: Vivento123!

