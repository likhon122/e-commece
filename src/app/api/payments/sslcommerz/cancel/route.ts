import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData.entries());
  const tran_id = data.tran_id as string;

  return NextResponse.redirect(
    new URL(
      `/checkout/cancelled?order=${tran_id}`,
      process.env.NEXT_PUBLIC_APP_URL,
    ),
  );
}
