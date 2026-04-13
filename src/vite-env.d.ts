/// <reference types="vite/client" />

interface BrowserConnection {
  effectiveType?: string;
  downlink?: number;
}

interface Navigator {
  connection?: BrowserConnection;
  mozConnection?: BrowserConnection;
  webkitConnection?: BrowserConnection;
}
