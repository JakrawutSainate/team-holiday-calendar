'use client';

import { useEffect, useRef } from 'react';

/**
 * Connects to the SSE endpoint and calls onUpdate whenever another client
 * performs a calendar mutation (claim shift, request leave, cancel leave).
 * EventSource auto-reconnects on connection loss — no manual retry needed.
 */
export function useRealtimeSync(onUpdate: () => void): void {
  // Stable ref so we never need to re-register the EventSource listener
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    const es = new EventSource('/api/sse');

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { type: string };
        if (data.type === 'calendar:update') {
          onUpdateRef.current();
        }
      } catch {
        // malformed frame — ignore
      }
    };

    return () => {
      es.close();
    };
  }, []); // register once per mount
}
