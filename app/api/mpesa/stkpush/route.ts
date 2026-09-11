import { NextRequest, NextResponse } from "next/server";
import {
  DARAJA_BASE_URL,
  darajaPassword,
  darajaTimestamp,
  getAccessToken,
} from "@/lib/daraja";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing from your environment`);
  }
  return value;
}

export async function POST(req: NextRequest) {
  const { phone, amountKes, goalSummary } = await req.json();

  if (typeof phone !== "string" || !/^2547\d{8}$/.test(phone)) {
    return NextResponse.json(
      {
        errorCode: "INVALID_PHONE",
        errorMessage: "Use the format 2547XXXXXXXX.",
      },
      { status: 400 }
    );
  }

  if (typeof amountKes !== "number" || !Number.isFinite(amountKes)) {
    return NextResponse.json(
      {
        errorCode: "INVALID_AMOUNT",
        errorMessage: "amountKes must be a number.",
      },
      { status: 400 }
    );
  }

  try {
    const token = await getAccessToken();
    const timestamp = darajaTimestamp();
    const shortcode = requiredEnv("MPESA_SHORTCODE");
    const passkey = requiredEnv("MPESA_PASSKEY");
    const appUrl = requiredEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");

    const payload = {
      BusinessShortCode: shortcode,
      Password: darajaPassword(shortcode, passkey, timestamp),
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.max(1, Math.round(amountKes)),
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: `${appUrl}/api/mpesa/callback`,
      AccountReference: "PesaBot",
      TransactionDesc:
        typeof goalSummary === "string" && goalSummary.trim()
          ? goalSummary.slice(0, 20)
          : "Savings",
    };

    const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (error) {
    console.error("STK Push failed:", error);
    return NextResponse.json(
      {
        errorCode: "STK_PUSH_FAILED",
        errorMessage:
          error instanceof Error ? error.message : "Failed to send STK Push.",
      },
      { status: 500 }
    );
  }
}
