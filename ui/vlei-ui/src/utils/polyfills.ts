// Browser polyfills for Node.js modules
import { Buffer } from 'buffer';

// Make Buffer globally available for libraries that expect it
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = Buffer;
}

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (window as any).global = window;
}

// Also make it available as a module global
(global as any).Buffer = Buffer;

export { Buffer };