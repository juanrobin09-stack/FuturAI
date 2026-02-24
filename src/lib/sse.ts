import { NextResponse } from "next/server";

/**
 * Create a Server-Sent Events (SSE) response stream.
 * Uses polling-based approach compatible with SQLite (no pub/sub).
 *
 * @param pollFn - async function that returns data to send. Return null to skip.
 * @param intervalMs - polling interval in milliseconds (default 3000)
 */
export function createSSEResponse(
  pollFn: () => Promise<unknown | null>,
  intervalMs: number = 3000
): Response {
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (data: unknown) => {
        try {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Controller closed
          isActive = false;
        }
      };

      // Send initial heartbeat
      send({ type: "connected", timestamp: Date.now() });

      // Poll loop
      while (isActive) {
        try {
          const data = await pollFn();
          if (data !== null && data !== undefined) {
            send(data);
          }
        } catch {
          // Database error, skip this cycle
        }

        // Wait for interval
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    },
    cancel() {
      isActive = false;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
