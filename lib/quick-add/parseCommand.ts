/**
 * parseCommand.ts
 * 
 * Parses natural language commands into structured transaction data.
 * Uses regex patterns first (cheap & fast), falls back to Gemini only if unclear.
 */

interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string; // ISO date
  description?: string;
  unclear?: boolean;
}

interface ParseResult {
  success: boolean;
  data?: ParsedTransaction;
  error?: string;
  usedAI?: boolean;
}

/**
 * Parse a natural language command into transaction data
 */
export async function parseCommand(
  input: string,
  availableCategories: Array<{ name: string; type: 'income' | 'expense' }>
): Promise<ParseResult> {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return {
      success: false,
      error: "Please enter a command",
    };
  }

  // Try regex patterns first
  const regexResult = parseWithRegex(normalized, availableCategories);
  if (regexResult.success) {
    return regexResult;
  }

  // Fallback to Gemini only if regex failed
  try {
    const aiResult = await parseWithGemini(input, availableCategories);
    return aiResult;
  } catch (error) {
    return {
      success: false,
      error: "I didn't quite catch that — try 'add [amount] to [category]', or use the mic again.",
    };
  }
}

/**
 * Parse using regex patterns for common command shapes
 */
function parseWithRegex(
  input: string,
  categories: Array<{ name: string; type: 'income' | 'expense' }>
): ParseResult {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Extract date hint if present
  let dateStr = today;
  let cleanInput = input;
  
  if (/yesterday|हिजो/i.test(input)) {
    dateStr = yesterday;
    cleanInput = input.replace(/yesterday|हिजो/gi, '').trim();
  } else if (/today|आज/i.test(input)) {
    dateStr = today;
    cleanInput = input.replace(/today|आज/gi, '').trim();
  }

  // Pattern 1: "add [amount] to [category]"
  // Example: "add 5000 to rent"
  let match = cleanInput.match(/(?:add|थप्नुहोस्)\s+(\d+(?:\.\d+)?)\s+(?:to|in|मा)\s+(.+)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    const categoryName = match[2].trim();
    const category = fuzzyMatchCategory(categoryName, categories.filter(c => c.type === 'expense'));
    
    if (category) {
      return {
        success: true,
        data: {
          type: 'expense',
          amount,
          category: category.name,
          date: dateStr,
        },
      };
    }
  }

  // Pattern 2: "spent [amount] on [category]"
  // Example: "spent 300 on groceries"
  match = cleanInput.match(/(?:spent|paid|तिरें|खर्च)\s+(\d+(?:\.\d+)?)\s+(?:on|for|को|मा)\s+(.+)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    const categoryName = match[2].trim();
    const category = fuzzyMatchCategory(categoryName, categories.filter(c => c.type === 'expense'));
    
    if (category) {
      return {
        success: true,
        data: {
          type: 'expense',
          amount,
          category: category.name,
          date: dateStr,
        },
      };
    }
  }

  // Pattern 3: "add income [amount] [category]"
  // Example: "add income 50000 salary"
  match = cleanInput.match(/(?:add|received|पाएँ)\s+(?:income|आम्दानी)\s+(\d+(?:\.\d+)?)\s+(.+)/i);
  if (match) {
    const amount = parseFloat(match[1]);
    const categoryName = match[2].trim();
    const category = fuzzyMatchCategory(categoryName, categories.filter(c => c.type === 'income'));
    
    if (category) {
      return {
        success: true,
        data: {
          type: 'income',
          amount,
          category: category.name,
          date: dateStr,
        },
      };
    }
  }

  // Pattern 4: "[category] bill [amount]"
  // Example: "electricity bill 1200" or "rent 5000"
  match = cleanInput.match(/(.+?)\s+(?:bill|बिल)?\s*(\d+(?:\.\d+)?)/i);
  if (match) {
    const categoryName = match[1].trim();
    const amount = parseFloat(match[2]);
    const category = fuzzyMatchCategory(categoryName, categories.filter(c => c.type === 'expense'));
    
    if (category && amount > 0) {
      return {
        success: true,
        data: {
          type: 'expense',
          amount,
          category: category.name,
          date: dateStr,
        },
      };
    }
  }

  // Pattern 5: Simple "[amount] [category]"
  // Example: "5000 rent" or "300 groceries"
  match = cleanInput.match(/(\d+(?:\.\d+)?)\s+(.+)/);
  if (match) {
    const amount = parseFloat(match[1]);
    const categoryName = match[2].trim();
    const category = fuzzyMatchCategory(categoryName, categories);
    
    if (category && amount > 0) {
      return {
        success: true,
        data: {
          type: category.type,
          amount,
          category: category.name,
          date: dateStr,
        },
      };
    }
  }

  return {
    success: false,
    error: "Could not parse command with regex patterns",
  };
}

/**
 * Fuzzy match a category name against available categories
 */
function fuzzyMatchCategory(
  input: string,
  categories: Array<{ name: string; type: 'income' | 'expense' }>
): { name: string; type: 'income' | 'expense' } | null {
  const normalized = input.toLowerCase().trim();

  // Exact match first
  const exact = categories.find(c => c.name.toLowerCase() === normalized);
  if (exact) return exact;

  // Partial match (category name contains input or vice versa)
  const partial = categories.find(
    c => 
      c.name.toLowerCase().includes(normalized) || 
      normalized.includes(c.name.toLowerCase())
  );
  if (partial) return partial;

  // Common aliases
  const aliases: Record<string, string> = {
    'food': 'Groceries',
    'gas': 'Transportation',
    'car': 'Transportation',
    'transport': 'Transportation',
    'medical': 'Healthcare',
    'doctor': 'Healthcare',
    'hospital': 'Healthcare',
    'house': 'Rent',
    'flat': 'Rent',
    'apartment': 'Rent',
    'electricity': 'Utilities',
    'water': 'Utilities',
    'internet': 'Utilities',
    'phone': 'Utilities',
    'mobile': 'Utilities',
    'restaurant': 'Dining',
    'cafe': 'Dining',
    'coffee': 'Dining',
    'movie': 'Entertainment',
    'gym': 'Entertainment',
    'school': 'Education',
    'college': 'Education',
    'course': 'Education',
    'salary': 'Salary',
    'wage': 'Salary',
    'wages': 'Salary',
    'freelancing': 'Freelance',
    'contract': 'Freelance',
    'side': 'Freelance',
    // Nepali aliases
    'खाना': 'Groceries',
    'भाडा': 'Rent',
    'बिजुली': 'Utilities',
    'पानी': 'Utilities',
    'तलब': 'Salary',
  };

  const aliasMatch = aliases[normalized];
  if (aliasMatch) {
    const found = categories.find(c => c.name === aliasMatch);
    if (found) return found;
  }

  return null;
}

/**
 * Parse using Google Gemini API (fallback only)
 * 
 * NOTE: This requires GEMINI_API_KEY in environment variables
 * Free tier may use prompts to improve Google products
 * Consider rate-limiting per user before production use
 */
async function parseWithGemini(
  input: string,
  categories: Array<{ name: string; type: 'income' | 'expense' }>
): Promise<ParseResult> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: "AI parsing not available (missing API key)",
    };
  }

  const categoryList = categories.map(c => `${c.name} (${c.type})`).join(', ');

  const prompt = `Extract transaction details from this command: "${input}"

Available categories: ${categoryList}

Return ONLY a JSON object with this exact structure:
{
  "type": "expense" or "income",
  "category": "exact category name from the list above",
  "amount": number,
  "date": "YYYY-MM-DD" or null if not mentioned (default to today),
  "unclear": true if you cannot confidently extract all fields
}

Rules:
- Map the category to the closest match from the available categories list
- If no close match exists, return { "unclear": true }
- Amount must be a positive number
- Do not invent categories that aren't in the list
- Return valid JSON only, no markdown or explanation`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response from Gemini');
    }

    // Extract JSON from markdown code blocks if present
    const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                     textResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                     [null, textResponse];
    
    const parsed = JSON.parse(jsonMatch[1].trim());

    if (parsed.unclear) {
      return {
        success: false,
        error: "I didn't quite catch that — try 'add [amount] to [category]', or use the mic again.",
        usedAI: true,
      };
    }

    // Validate parsed data
    if (!parsed.type || !parsed.amount || !parsed.category) {
      throw new Error('Invalid response from AI');
    }

    // Default date to today if not provided
    const today = new Date().toISOString().split('T')[0];

    return {
      success: true,
      usedAI: true,
      data: {
        type: parsed.type,
        amount: parseFloat(parsed.amount),
        category: parsed.category,
        date: parsed.date || today,
        description: parsed.description,
      },
    };
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return {
      success: false,
      error: "I didn't quite catch that — try 'add [amount] to [category]', or use the mic again.",
      usedAI: true,
    };
  }
}
