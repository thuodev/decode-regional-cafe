import { NextRequest, NextResponse } from "next/server";
import { getAIClient } from "@/lib/ai-provider";

const SYSTEM_PROMPT = `You are PesaBot, a friendly savings assistant for Kenyan users.
Given a user's savings goal in free text, respond only with valid JSON.

If there is enough detail to compute a savings plan, return exactly:
{
  "goalSummary": string,
  "targetAmountKes": number,
  "targetDateHint": string,
  "suggestedDailyKes": number,
  "reasoning": string
}

If the user has not given enough detail, ask one concise clarifying question:
{ "needsClarification": string }

Use Kenyan Shillings. Make sensible assumptions only for today's date; do not invent a target amount or deadline.`;

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { needsClarification: "What are you saving for, how much, and by when?" },
      { status: 200 }
    );
  }

  try {
    const { client, model } = getAIClient();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Chat route failed:", error);

    return NextResponse.json(
      { needsClarification: "Sorry, could you rephrase your savings goal?" },
      { status: 200 }
    );
  }
}
