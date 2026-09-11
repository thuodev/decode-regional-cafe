import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = body?.Body?.stkCallback;

  if (result?.ResultCode === 0) {
    const items = result.CallbackMetadata?.Item ?? [];
    const amount = items.find((item: any) => item.Name === "Amount")?.Value;
    const receipt = items.find(
      (item: any) => item.Name === "MpesaReceiptNumber"
    )?.Value;

    console.log(
      `Payment received: KES ${amount ?? "unknown"}, receipt ${receipt ?? "unknown"}`
    );
  } else {
    console.log(
      `Payment not completed: ${result?.ResultDesc ?? "unknown callback result"}`
    );
  }

  // Always 200 so Safaricom does not retry indefinitely.
  return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
}
