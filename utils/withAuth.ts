import { NextRequest, NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";
import { User } from "@supabase/auth-helpers-nextjs";

type AuthenticationHandler = (
    request: NextRequest & {user: User},
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticationHandler) {
    return async (request: NextRequest) => {
        const supabase = await createClient();
        const {
            data: {user},
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized "}, {status: 401});
        }

        const authenticatedRequest = request as NextRequest & { user: User };
        authenticatedRequest.user = user;
        return handler(authenticatedRequest);
    }
}