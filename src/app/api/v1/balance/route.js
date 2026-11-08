import { NextResponse } from "next/server";
import { authenticateApiRequest } from "@/lib/apiAuth";

export async function GET(req) {
    const user = await authenticateApiRequest(req);
    if (!user) return NextResponse.json({ error: "Invalid or missing API token" }, { status: 401 });

    return NextResponse.json({
        balance: user.balance,
        plan: user.plan,
    });
}
