// test-setup.ts
import "npm:@testing-library/jest-dom";

// Mock DOM environment for Deno
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.36-alpha/deno-dom-wasm.ts";

// Set up global DOM
(globalThis as any).DOMParser = DOMParser;

// Mock window and document if needed
if (typeof window === "undefined") {
  const { JSDOM } = await import("npm:jsdom@^22.0.0");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost",
    pretendToBeVisual: true,
    resources: "usable"
  });
  
  (globalThis as any).window = dom.window;
  (globalThis as any).document = dom.window.document;
  (globalThis as any).navigator = dom.window.navigator;
}