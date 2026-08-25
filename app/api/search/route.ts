import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/search
 * Accepts a query and optionally falls back to Google Gemini API
 * 
 * Rate limit: ~100 req/hour per user (via userId in request)
 * 
 * NOTE: Google Gemini free tier may use prompts to improve products.
 * For production with real user financial data, migrate to paid tier.
 */

interface SearchRequest {
  query: string;
  language: "en" | "ne";
  userId?: string; // Client-side hint only; always re-verify server-side
}

interface SearchResponse {
  type: "matched" | "ai_answer" | "error";
  answer?: string;
  answer_ne?: string;
  link?: string;
  error?: string;
}

// Simple in-memory rate limiting (not production-grade)
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(userId) || { count: 0, reset: now + 3600000 };

  if (now > limit.reset) {
    rateLimitMap.set(userId, { count: 1, reset: now + 3600000 });
    return true;
  }

  if (limit.count >= 100) {
    return false;
  }

  limit.count++;
  rateLimitMap.set(userId, limit);
  return true;
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse>> {
  try {
    const body = (await request.json()) as SearchRequest;
    const { query, language } = body;

    // Get userId from session (server-side)
    // IMPORTANT: Never trust client-sent userId; fetch from auth context
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { type: "error", error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Extract userId from token or session (simplified; you'd validate JWT here)
    // For now, use a hash of auth header as rate-limit key
    const userId = Buffer.from(authHeader).toString("base64").slice(0, 32);

    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          type: "error",
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    // For this MVP, we're not calling Gemini yet since it requires API key setup.
    // Returning a fallback response for now.
    // In production, call Google Gemini API here via fetch.

    return NextResponse.json(
      {
        type: "ai_answer",
        answer:
          "I couldn't understand that query. Try asking about your spending, bills, tax, or income. Or use the Quick Actions button for common tasks.",
        answer_ne:
          "मैले त्यो प्रश्न बुझिन सकेन। आपनो खर्च, बिल, कर वा आय बारे सोध्नुहोस्। वा सामान्य कार्यहरूको लागि क्विक एक्शन बटन प्रयोग गर्नुहोस्।",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { type: "error", error: "Internal server error" },
      { status: 500 }
    );
  }
}
