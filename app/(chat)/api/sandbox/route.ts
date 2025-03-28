import Sandbox from "@e2b/code-interpreter";
import { Attachment } from "@/shared/chat";
import { generateUUID } from "@/lib/utils";
import { NextResponse } from "next/server";

const sandboxTimeout = 10 * 60 * 1000;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const code = formData.get('code') as string;

        const files: Attachment[] = [];
        for (const value of formData.values()) {
            if (value instanceof File) {
                const content = await value.text();
                files.push({
                    name: value.name,
                    type: value.type as Attachment['type'],
                    content: content,
                    mimeType: value.type,
                    id: generateUUID(),
                    url: `sandbox-${generateUUID()}.${value.type.split('/')[1]}`
                });
            }
        }

        const sandbox = await Sandbox.create({
            apiKey: process.env.E2B_API_KEY,
            timeoutMs: sandboxTimeout,
        });

        // Write files to sandbox
        for (const file of files) {
            await sandbox.files.write(file.name, file.content ?? '');
        }

        const { text, results, logs, error } = await sandbox.runCode(code);

        // Parse the output if it's JSON
        let parsedData;
        try {
            if (text) {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedData = JSON.parse(jsonMatch[0]);
                }
            }
        } catch (e) {
            console.error('Failed to parse output:', e);
        }

        return NextResponse.json({
            text,
            results,
            logs,
            error,
            data: parsedData
        });
    } catch (error) {
        console.error('Sandbox execution error:', error);
        return NextResponse.json(
            { error: 'Failed to execute code in sandbox' },
            { status: 500 }
        );
    }
}   