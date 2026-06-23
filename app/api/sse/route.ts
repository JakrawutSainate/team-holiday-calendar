import { NextRequest } from 'next/server';
import { sseEventBus } from './event-bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (payload: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // Client already disconnected
        }
      };

      // Confirm connection
      enqueue({ type: 'connected' });

      const onCalendarUpdate = (ts: number) => {
        enqueue({ type: 'calendar:update', ts });
      };

      sseEventBus.on('calendar:update', onCalendarUpdate);

      // Keepalive ping every 25 s to prevent proxy/load-balancer timeouts
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(pingInterval);
        }
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        sseEventBus.off('calendar:update', onCalendarUpdate);
        clearInterval(pingInterval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
