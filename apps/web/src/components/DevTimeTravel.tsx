const STORAGE_KEY = 'cazatalentos:simulatedTimeOffset';
const OFFSET_SECONDS = '172800';
export const TIME_TRAVEL_EVENT = 'cazatalentos:simulated-time';

export function DevTimeTravel() {
  if (!import.meta.env.DEV) return null;

  const active = readSimulatedOffset() > 0n;

  function onClick() {
    try {
      if (readSimulatedOffset() > 0n) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, OFFSET_SECONDS);
      }
    } catch {
      return;
    }
    window.dispatchEvent(new Event(TIME_TRAVEL_EVENT));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 rounded-full bg-violet-600 px-3 py-2 text-xs text-white opacity-70 hover:opacity-100"
    >
      {active ? '⏪ Tiempo real (dev)' : '⏩ Simular +48h (dev)'}
    </button>
  );
}

export function readSimulatedOffset(): bigint {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return 0n;
    return BigInt(raw);
  } catch {
    return 0n;
  }
}
