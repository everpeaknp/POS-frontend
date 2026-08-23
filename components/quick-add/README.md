# Quick Add Transaction Feature

A natural language interface for quickly adding income/expense transactions via text or voice input.

## Features

- **Text Input**: Type commands like "add 5000 to rent" or "spent 300 on groceries"
- **Voice Input**: Web Speech API support (English and Nepali)
- **Smart Parsing**: Regex patterns first (fast & free), Gemini AI fallback
- **Confirmation Step**: Always shows parsed data before saving
- **Category Matching**: Fuzzy matches user input to existing categories
- **Account Selection**: Choose which account to post the transaction to

## Usage

### Text Commands

English examples:
- `add 5000 to rent`
- `spent 300 on groceries yesterday`
- `add income 50000 salary`
- `paid electricity bill 1200`
- `5000 rent` (simple format)

Nepali examples:
- `भाडामा ५००० थप्नुहोस्`
- `बिजुली बिल १२०० तिरें`

### Voice Commands

1. Click the microphone icon
2. Speak your command clearly
3. Review the transcribed text (editable)
4. Click "Add" to parse

## Parsing Strategy

### 1. Regex Patterns (First Priority)
Covers common command shapes instantly with no AI call:

- Pattern 1: `add [amount] to [category]`
- Pattern 2: `spent [amount] on [category]`
- Pattern 3: `add income [amount] [category]`
- Pattern 4: `[category] bill [amount]`
- Pattern 5: `[amount] [category]` (simple)

Supports date keywords: `yesterday`, `today`, `हिजो`, `आज`

### 2. Gemini AI Fallback (Only if Regex Fails)
- **Model**: `gemini-2.0-flash-exp` (fast & cheap)
- **Required**: `NEXT_PUBLIC_GEMINI_API_KEY` environment variable
- **Usage**: Only called when regex patterns don't match
- **Safety**: Returns `{ unclear: true }` if cannot confidently parse

### 3. Category Fuzzy Matching
Maps user input to existing categories:
- Exact match first
- Partial match (contains)
- Common aliases (e.g., "food" → "Groceries", "gas" → "Transportation")
- Nepali aliases (e.g., "खाना" → "Groceries", "भाडा" → "Rent")

**Never invents new categories** - only matches to existing ones.

## API Integration

Uses existing authenticated transaction API:
```typescript
financeTransactionAPI.create({
  type: 'income' | 'expense',
  amount: string,
  category: number,  // Category ID
  account: number,   // Account ID
  date: string,      // ISO date
  description?: string
})
```

## Security Notes

1. **Authentication**: Inherits from existing `financeTransactionAPI` (tenant-scoped)
2. **Gemini API Key**: 
   - Must be server-side only in production (currently `NEXT_PUBLIC_*` for testing)
   - Free tier may use prompts to improve Google's products
   - Consider rate-limiting per user before production
   - Move to paid tier before handling real financial data
3. **Voice Input**: Uses browser's Web Speech API (no external service)
4. **Confirmation Required**: Never creates transactions without user confirmation

## Files

- `components/quick-add/QuickAddBar.tsx` - Main component (floating button + dialog)
- `lib/quick-add/parseCommand.ts` - Parsing logic (regex + Gemini fallback)
- `components/dashboard/DashboardWidgets.tsx` - Mount point

## Setup

1. (Optional) Add Gemini API key to `.env.local`:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
   ```
   
2. Create at least one account in the system (required for transactions)

3. The Quick Add floating button appears in the bottom-right of all dashboard pages

## Known Limitations

1. **Web Speech API**: 
   - Only works in Chrome/Edge (not Firefox/Safari)
   - Requires HTTPS (or localhost for testing)
   - May have accuracy issues with accents/background noise

2. **Gemini Fallback**:
   - Requires API key (feature degrades gracefully without it)
   - Adds ~500-1000ms latency when used
   - Free tier has daily limits

3. **Date Parsing**:
   - Currently supports: "today", "yesterday" (and Nepali equivalents)
   - Specific dates (e.g., "Jan 15") not yet supported
   - Defaults to today if no date mentioned

## Future Enhancements

- [ ] Support for specific date formats ("Jan 15", "2024-01-15")
- [ ] Multi-transaction commands ("add 5000 rent and 300 groceries")
- [ ] Transfer commands ("move 10000 from Cash to Bank")
- [ ] Recurring transaction shortcuts ("add monthly rent 5000")
- [ ] Learning from user's command patterns
- [ ] Offline mode (localStorage queue for sync later)
