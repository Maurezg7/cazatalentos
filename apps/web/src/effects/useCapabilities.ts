export type Capabilities = {
  reducedMotion: boolean;
  saveData: boolean;
  lowEnd: boolean;
  webgl: boolean;
  touch: boolean;
  allowRichMotion: boolean;
};

export function readCapabilities(): Capabilities {
  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = Boolean(connection?.saveData);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowEnd = memory <= 4 || cores <= 4;
  const touch = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;
  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    webgl = Boolean(canvas.getContext('webgl2'));
  } catch {
    webgl = false;
  }
  return {
    reducedMotion,
    saveData,
    lowEnd,
    webgl,
    touch,
    allowRichMotion: !reducedMotion && !saveData && !lowEnd,
  };
}
