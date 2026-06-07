import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ecagraray.app",
  appName: "e-Cagraray",
  webDir: "www",
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  ios: {
    contentInset: "automatic",
  },
  server: {
    androidScheme: "https",
    cleartext: true,
  },
};

export default config;
