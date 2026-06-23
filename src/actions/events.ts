'use server';

import { sseEventBus } from '@/app/api/sse/event-bus';

/**
 * Call this after any mutation that changes calendar state.
 * Emits an SSE event to every connected client so they can re-sync.
 */
export async function broadcastCalendarUpdate(): Promise<void> {
  sseEventBus.emit('calendar:update', Date.now());
}
