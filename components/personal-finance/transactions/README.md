# Personal Finance Transactions Components

This directory contains modular components for the personal finance transactions page, refactored from a single 1268-line file into focused, reusable components.

## Components Overview

### Display Components

#### TransactionSummaryCards.tsx
Three summary cards showing financial overview:
- **Total Income** - Green card with trending up icon
- **Total Expense** - Red card with trending down icon
- **Net Balance** - Dynamic color based on positive/negative balance

**Props:**
- `income: number` - Total income amount
- `expense: number` - Total expense amount
- `net: number` - Net balance (income - expense)

#### TransactionFilters.tsx
Comprehensive toolbar with filtering and action buttons:
- Search bar with clear button
- Type filter (All/Income/Expense)
- Category filter dropdown
- Account filter dropdown
- Date range inputs (from/to)
- Clear all filters button
- Add Income button (green)
- Add Expense button (red)

**Props:**
- Search state management
- Filter state management (type, category, account, dates)
- Category and account lists
- Action handlers for adding transactions

#### TransactionTable.tsx
Data table displaying all transactions:
- Columns: ID, Date, Description, Category, Account, Type Badge, Amount, Actions
- Row click navigation to transaction details
- Edit and Delete buttons per row
- Empty state with add transaction button
- Color-coded amounts (green for income, red for expense)

**Props:**
- `transactions: FinanceTransaction[]`
- Row and action handlers

### Dialog Components

#### TransactionDialog.tsx
Main add/edit transaction form dialog:
- Type selector (Income/Expense toggle buttons)
- Amount input with Rs. prefix
- Category dropdown with search and quick-add
- Account dropdown with search and quick-add
- Date picker
- Description text input
- Receipt upload (image/PDF) with preview
- Form validation and save handling

**Features:**
- Searchable dropdowns for category and account
- Inline quick-add buttons for category/account
- Image preview for uploaded receipts
- PDF indicator for PDF files
- Remove receipt functionality

#### DeleteConfirmDialog.tsx
Simple confirmation dialog for transaction deletion:
- Warning message
- Cancel button
- Delete button (red, destructive)

#### QuickAddCategoryDialog.tsx
Fast category creation dialog:
- Type selector (Income/Expense)
- Category name input (required)
- Description input (optional)
- Dynamic title based on selected type

#### QuickAddAccountDialog.tsx
Comprehensive account creation dialog:
- Account type selector (5 options with icons):
  - Bank Account
  - Cash
  - Credit Card
  - Loan
  - Investment
- Conditional fields:
  - Bank name dropdown (for bank accounts)
  - Account number (for bank accounts)
- Account name (required)
- Current balance with Rs. prefix
- Description (optional)
- Helper text for negative balances (liabilities)

**Special Features:**
- 19 Nepali banks in dropdown
- Conditional field rendering based on account type
- Helpful hints for users

## Main Page Structure

The main `page.tsx` file (reduced from 1268 to 468 lines) now:
- Imports all modular components
- Manages central state (transactions, categories, accounts)
- Handles API calls and data loading
- Orchestrates component interactions
- Provides handlers for CRUD operations
- Manages filter state and calculations

## Benefits of Refactoring

1. **Maintainability**: Each component has a single, clear responsibility
2. **Reusability**: Components can be used in other financial pages
3. **Testability**: Smaller, isolated components are easier to test
4. **Readability**: Clear component structure and separation of concerns
5. **Performance**: Components can be memoized and optimized independently
6. **Scalability**: Easy to add new features to individual components

## File Size Reduction

- **Before**: 1268 lines (single file)
- **After**: 468 lines (main page) + 7 component files
- **Reduction**: 63% smaller main file
- **Total Components**: 7 modular components + 1 main page

## Usage Example

```typescript
import { TransactionSummaryCards } from "@/components/personal-finance/transactions/TransactionSummaryCards";

<TransactionSummaryCards
  income={50000}
  expense={30000}
  net={20000}
/>
```

## Integration with Existing Code

All components maintain:
- ✅ Exact same design and styling (Tailwind classes preserved)
- ✅ Identical functionality and business logic
- ✅ Same user experience and interactions
- ✅ Compatible prop interfaces with parent state
- ✅ Full TypeScript type safety

## Files Created

1. `TransactionSummaryCards.tsx` - Financial summary cards
2. `TransactionFilters.tsx` - Search and filter toolbar
3. `TransactionTable.tsx` - Transactions data table
4. `TransactionDialog.tsx` - Add/edit transaction form
5. `DeleteConfirmDialog.tsx` - Delete confirmation
6. `QuickAddCategoryDialog.tsx` - Quick category creation
7. `QuickAddAccountDialog.tsx` - Quick account creation
8. `README.md` - This documentation

## Dependencies

- `@/components/ui/*` - Shadcn UI components (Button, Input, Dialog, Select, etc.)
- `@/lib/api/personal-finance` - API functions and types
- `@/components/shared/*` - Shared components (DateInput, FormattedDate)
- `@/lib/utils` - Utility functions (formatCurrency, cn)
- `lucide-react` - Icons
- `react-hot-toast` - Toast notifications

## State Management

The main page handles:
- **API State**: transactions, categories, accounts
- **UI State**: dialog visibility, form data, loading states
- **Filter State**: search, type, category, account, date range
- **Form State**: transaction form, category form, account form
- **Receipt State**: file upload and preview

## Future Enhancements

Potential improvements:
- Extract filter logic into a custom hook
- Add bulk operations support
- Implement transaction templates
- Add export functionality (CSV, Excel)
- Implement advanced search with multiple criteria
- Add transaction attachments management
- Create recurring transactions feature

## Notes

- All components are client-side rendered ("use client")
- Form validation handled in parent component
- API calls managed centrally in main page
- Dropdown state managed to prevent conflicts
- Receipt upload supports images (PNG, JPG, GIF) and PDFs up to 10MB
