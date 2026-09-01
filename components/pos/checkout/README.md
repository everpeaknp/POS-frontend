# POS Checkout Components

This directory contains modular components for the POS checkout page, refactored from a single 1169-line file into focused, reusable components.

## Components Overview

### Dialog Components

#### POSCheckoutDialog.tsx
Complete sale confirmation dialog with:
- Order summary (subtotal, discount, tax, total)
- Customer selection with quick-add button
- Payment method selection (Cash, eSewa, FonePay, Khalti, Bank Transfer, Card, Credit)
- Cash input with change calculator
- QR code preview buttons for digital payments
- Validation and action buttons

#### POSQRPaymentDialog.tsx
QR code payment display dialog showing:
- Total amount
- QR code image (if uploaded)
- Merchant/bank information
- Payment instructions
- Configuration status

#### POSThankYouDialog.tsx
Transaction success dialog with:
- Success animation
- Receipt number and total
- Change given (if applicable)
- Action buttons (Print Receipt, View Transaction, View Invoice, New Sale)

#### POSCouponDialog.tsx
Coupon selection and application dialog featuring:
- Manual coupon code entry
- Available coupons list with validation
- Discount badges and details
- Expiration and minimum order validation
- Current order summary

#### POSCustomerDialog.tsx
Quick customer add dialog with:
- Name and phone (required fields)
- Email, address, type (optional fields)
- Enter key support for quick submission
- Navigation back to checkout when opened from checkout

#### POSInvoiceDialog.tsx
Full invoice display dialog with:
- Complete invoice rendering
- Print functionality
- PDF download functionality
- Close and new sale button

### Layout Components

#### POSHeader.tsx
Dashboard header with conditional action buttons:
- Hold Order button
- Held Orders button (with count badge)
- Cash In/Out button
- Only shown when session is active and cart has items
- Adapts to sidebar width

#### POSSessionBanner.tsx
Warning banner for inactive session:
- Amber-themed alert
- Clear message about no active session
- Start Session button
- Only shown when no POS session is active

## Main Page Structure

The main `page.tsx` file (reduced from 1169 to 368 lines) now:
- Imports all modular components
- Manages state and handlers
- Orchestrates component interactions
- Handles print and PDF generation
- Maintains resize functionality

## Benefits of Refactoring

1. **Maintainability**: Each component has a single responsibility
2. **Reusability**: Dialog components can be reused in other POS pages
3. **Testability**: Smaller components are easier to test
4. **Readability**: Clear separation of concerns
5. **Performance**: Components can be optimized independently

## Usage Example

```typescript
import { POSCheckoutDialog } from "@/components/pos/checkout/POSCheckoutDialog";

<POSCheckoutDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  subtotal={1000}
  discountValue={100}
  taxAmount={130}
  total={1030}
  // ... other props
/>
```

## Integration with Existing Code

All components maintain the exact same:
- Design and styling (Tailwind classes preserved)
- Functionality and business logic
- User experience and interactions
- Prop interfaces compatible with usePOSCheckout hook

## Files Created

1. `POSCheckoutDialog.tsx` - Checkout confirmation
2. `POSQRPaymentDialog.tsx` - QR payment display
3. `POSThankYouDialog.tsx` - Success message
4. `POSCouponDialog.tsx` - Coupon selection
5. `POSCustomerDialog.tsx` - Quick customer add
6. `POSInvoiceDialog.tsx` - Invoice display
7. `POSHeader.tsx` - Page header
8. `POSSessionBanner.tsx` - Session warning
9. `README.md` - This documentation

## Dependencies

- `@/components/ui/*` - Shadcn UI components
- `@/hooks/usePOSCheckout` - Main checkout hook
- `@/components/pos/POSInvoice` - Invoice rendering component
- `lucide-react` - Icons
- `sonner` - Toast notifications

## Notes

- All original functionality preserved
- No breaking changes to API
- Backward compatible with existing code
- TypeScript interfaces included for type safety
