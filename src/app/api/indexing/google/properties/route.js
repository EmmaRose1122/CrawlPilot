import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { readUserByIdFromInsforge, withPrismaFallback } from "@/lib/adminData";
import { listProperties, mapGoogleError } from "@/lib/engines/googleSearchConsole";

// Lists the Search Console properties the user's service account can access.
export async function GET() {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const user = await withPrismaFallback("Google config",
            () => readUserByIdFromInsforge(session.user.id, "id,googleIndexingConfig"),
            () => prisma.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, googleIndexingConfig: true },
            })
        );

        if (!user?.googleIndexingConfig) {
            return NextResponse.json(
                { error: "GOOGLE_CONFIG_MISSING", message: "Add your Google service account JSON in My profile first." },
                { status: 400 }
            );
        }

        const properties = await listProperties(user.googleIndexingConfig);
        return NextResponse.json({ properties });
    } catch (error) {
        const mapped = mapGoogleError(error);
        console.error("Search Console properties error:", mapped.message);
        return NextResponse.json({ error: mapped.message, httpStatus: mapped.httpStatus }, { status: 502 });
    }
}
