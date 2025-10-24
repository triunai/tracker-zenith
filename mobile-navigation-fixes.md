# Simplified Mobile Navigation Revamp

## Overview

Simplify the mobile navigation to just 3 buttons with a prominent center camera button. Merge Dashboard and Transactions into a unified Home page. Add clear page titles with back buttons for better orientation.

## Phase 1: Update Bottom Navigation Structure

### 1.1 Modify MobileBottomNav Component

**File:** `src/components/Layout/MobileBottomNav.tsx`

Change from 5 buttons to 3 buttons:

```typescript
const navItems = [
  { 
    id: 'budgets', 
    icon: Wallet, 
    label: 'Budgets',
    path: '/budgets' 
  },
  { 
    id: 'center', 
    icon: null, 
    label: 'Scan',
    path: null // Handled by CentralButton
  },
  { 
    id: 'menu', 
    icon: Menu, 
    label: 'Menu',
    path: null // Opens drawer/sheet with all pages
  },
];
```

Remove: Search, Reports, Notifications from bottom nav (move to menu drawer)

### 1.2 Update CentralButton Logic

**File:** `src/components/Layout/CentralButton.tsx`

Simplify button logic:

- On Home page (`/`): Show camera icon, opens scanner immediately
- On all other pages: Show home icon, navigates to `/`
- Remove the Dashboard → Transactions navigation flow

Update `getButtonState()` function:

```typescript
const getButtonState = () => {
  const path = location.pathname;
  
  if (path === '/') {
    return {
      icon: Camera,
      label: 'Scan',
      action: () => {
        // Trigger immediate camera scanner
        document.dispatchEvent(new CustomEvent('openDocumentScanner'));
      },
      glow: 'from-emerald-500 to-cyan-500'
    };
  } else {
    return {
      icon: Home,
      label: 'Home',
      action: () => navigate('/'),
      glow: 'from-indigo-500 to-purple-500'
    };
  }
};
```

### 1.3 Create Menu Drawer Component

**File:** `src/components/Layout/MobileMenuDrawer.tsx` (new file)

Create a slide-out drawer that contains:

- Reports
- Smart Search
- Notifications
- Payment Methods
- Profile
- Settings
- Logout

Use shadcn Sheet component for the drawer.

## Phase 2: Merge Dashboard + Transactions into Home Page

### 2.1 Update Home Page (Index.tsx)

**File:** `src/pages/Index.tsx`

Combine dashboard summary with full transaction list:

```typescript
// Structure:
// - Welcome header
// - Date filter
// - Dashboard summary cards (balance, income, expenses)
// - Quick action buttons (hidden on mobile - use center button instead)
// - Transaction list (full component with all features)
// - Budget tracker (below transactions on mobile, sidebar on desktop)
// - Spending chart
```

Remove the separate transaction form buttons on mobile (use center button for scanning)

### 2.2 Remove Standalone Transactions Page

**File:** `src/pages/transactions/index.tsx`



- Keep it as a legacy route that redirects to `/`
-cuz i still want some of the components used in this, i need to refer to it, dont destroy it or anything DO NOT delete it

Update `App.tsx` to remove/redirect the `/transactions` route

### 2.3 Integrate AI Processing into Home

Move the document processing components into the home page:

- Keep `DocumentUploader` component available for scanner trigger
- Keep `ProcessedDocuments` component for showing AI results
- Position them in a way that works on mobile (possibly as overlay/modal)

## Phase 3: Add Page Title Headers

### 3.1 Create PageHeader Component

**File:** `src/components/Layout/PageHeader.tsx` (new file)

```typescript
interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

// Visual structure:
// [← Back]  |  [Page Title]  |  [empty space]
//            Clear separator line below
```

Styling:

- Large, bold title text (text-xl or text-2xl)
- Back button on left (only show if not on home page)
- Clear border/separator below header
- Sufficient padding for mobile touch targets

### 3.2 Update Layout Component

**File:** `src/components/Layout/Layout.tsx`

Add conditional page header rendering:

- Detect current page from route
- Show appropriate title
- Show back button (except on home page)
- Back button navigates to home (`/`) by default

### 3.3 Add Page Headers to Each Page

Update these files to include PageHeader:

- `src/pages/Index.tsx` - "Home" (no back button)
- `src/pages/budgets/index.tsx` - "Budgets" (with back)
- `src/pages/reports/index.tsx` - "Reports" (with back)
- `src/pages/payment-methods/index.tsx` - "Payment Methods" (with back)
- `src/pages/profile/index.tsx` - "Profile" (with back)
- `src/pages/notifications/index.tsx` - "Notifications" (with back)

## Phase 4: Fix Camera Scanner Immediate Open

### 4.1 Update DocumentUploader Component

**File:** `src/components/Documents/DocumentUploader.tsx`

Add auto-trigger functionality:

```typescript
interface DocumentUploaderProps {
  onDocumentProcessed: (document: Document) => void;
  autoOpen?: boolean; // New prop
}

// Add useEffect to auto-click input when autoOpen=true
useEffect(() => {
  if (autoOpen && inputRef.current) {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      inputRef.current?.click();
    }, 100);
  }
}, [autoOpen]);
```

### 4.2 Update Home Page Scanner Integration

**File:** `src/pages/Index.tsx`

When scanner overlay opens (triggered by center button):

```typescript
{showScanner && (
  <div className="fixed inset-0 z-[60] bg-background">
    <DocumentUploader 
      onDocumentProcessed={handleDocumentProcessed}
      autoOpen={true}  // Immediately trigger camera
    />
  </div>
)}
```

## Phase 5: Responsive Behavior & Polish

### 5.1 Update Mobile Detection

IMPORTANT: Desktop sidebar remains completely unchanged.

- Bottom nav (3 buttons) shows ONLY on mobile/tablet (< 1024px)
- Desktop (>= 1024px) keeps the ORIGINAL sidebar with all navigation items
- No changes to desktop navigation behavior

### 5.2 Adjust Page Padding

**File:** `src/components/Layout/Layout.tsx`

Update mobile padding to account for:

- Page header at top (add top padding)
- Bottom nav at bottom (keep bottom padding)

### 5.3 Update Active Page Indicators

Remove highlighting from bottom nav (only 3 buttons now, not representing all pages)

Page title header is the primary indicator of current location

## Testing Checklist

- [ ] Bottom nav shows 3 buttons on mobile
- [ ] Center button opens camera immediately on home page
- [ ] Center button goes home from other pages
- [ ] Menu drawer opens and shows all pages
- [ ] Home page shows dashboard summary + transactions list
- [ ] Page headers show correct titles
- [ ] Back buttons work and go to home
- [ ] Camera scanner auto-opens when triggered
- [ ] Desktop sidebar still works
- [ ] No navigation confusion for users

## Files to Modify

- `src/components/Layout/MobileBottomNav.tsx` - Reduce to 3 buttons
- `src/components/Layout/CentralButton.tsx` - Simplify logic
- `src/components/Layout/MobileMenuDrawer.tsx` - NEW: Create menu drawer
- `src/components/Layout/PageHeader.tsx` - NEW: Create page header
- `src/components/Layout/Layout.tsx` - Integrate header, update padding
- `src/pages/Index.tsx` - Merge dashboard + transactions
- `src/pages/transactions/index.tsx` - Remove or redirect
- `src/components/Documents/DocumentUploader.tsx` - Add auto-open prop
- `src/App.tsx` - Update routes

## Files to Read First

- Current MobileBottomNav to understand structure
- Current Index.tsx to see dashboard layout
- Current transactions/index.tsx to understand transaction features
- DocumentUploader to understand file upload flow