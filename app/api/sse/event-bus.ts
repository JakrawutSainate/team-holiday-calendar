import { EventEmitter } from 'events';

class SSEEventBus extends EventEmitter {}

// Singleton — shared across all server-side code in the same process.
// For multi-instance deployments (e.g. multiple Node pods) replace this
// with a Redis pub/sub adapter.
const bus = new SSEEventBus();
bus.setMaxListeners(200); // support up to 200 concurrent SSE clients

export { bus as sseEventBus };
