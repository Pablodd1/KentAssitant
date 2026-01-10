import { NextRequest, NextResponse } from 'next/server';
import { eventEmitter } from '@/lib/events';

export async function GET(req: NextRequest, { params }: { params: { caseId: string } }) {
    const { caseId } = params;

    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            const onUpdate = (data: any) => {
                if (data.caseId === caseId) {
                    const message = `data: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                }
            };

            eventEmitter.on('update', onUpdate);

            // Keep connection alive with a comment every 15s
            const interval = setInterval(() => {
                controller.enqueue(encoder.encode(': keepalive\n\n'));
            }, 15000);

            req.signal.addEventListener('abort', () => {
                eventEmitter.off('update', onUpdate);
                clearInterval(interval);
            });
        }
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
