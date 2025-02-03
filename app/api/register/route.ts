import { NextResponse } from "next/server";

export async function POST (request: Request) {
    try {
        const data = await request.json();
        const response = await fetch(`${process.env.ARENAS_SERVER}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const error = await response.json();
            return NextResponse.json(
                {
                    error:
                    error.detail ||
                    "Failed to sign up!! please contact us on discord",
                },
                { status: response.status },
            );
        }
        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json(
            {error: (error as Error).message},
            { status: 500},
        );
    }
}