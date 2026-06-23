// Provide a minimal `window` global so controller methods that guard against
// SSR with `typeof window === 'undefined'` run normally in the Node test env.
if (typeof window === 'undefined') {
  // @ts-ignore
  global.window = global;
}
