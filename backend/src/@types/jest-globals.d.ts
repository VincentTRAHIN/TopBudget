/**
 * Types globaux Jest pour TypeScript
 */

/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperty(property: string): R;
      toBe(value: any): R;
      toContain(value: any): R;
    }
  }
}

export {};