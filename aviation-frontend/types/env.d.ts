declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_AVIATIONSTACK_API_KEY: string;
    }
  }
}

export {};