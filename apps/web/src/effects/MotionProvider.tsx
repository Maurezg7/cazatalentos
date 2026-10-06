import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { readCapabilities, type Capabilities } from './useCapabilities';

const MotionContext = createContext<Capabilities | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => readCapabilities(), []);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotionFlags(): Capabilities {
  const value = useContext(MotionContext);
  if (!value) {
    return {
      reducedMotion: false,
      saveData: false,
      lowEnd: false,
      webgl: false,
      touch: false,
      allowRichMotion: false,
    };
  }
  return value;
}
