'use client';
import { useEffect, useRef, useState } from 'react';
export type IdlePhase = 'active' | 'warning' | 'idle';
export function useIdle({
  timeout = 300000,
  warningBefore = 30000,
  throttle = 1000,
  crossTab = false,
  channelName = 'lp-idle',
  onIdle,
  onActive,
  onWarning,
}: {
  timeout?: number;
  warningBefore?: number;
  throttle?: number;
  crossTab?: boolean;
  channelName?: string;
  onIdle?: () => void;
  onActive?: () => void;
  onWarning?: () => void;
} = {}) {
  if (
    ![timeout, warningBefore, throttle].every(Number.isFinite) ||
    timeout < 100 ||
    timeout > 86400000 ||
    warningBefore < 0 ||
    warningBefore >= timeout ||
    throttle < 0 ||
    throttle > timeout ||
    channelName.length > 128
  )
    throw new RangeError('Invalid idle timing limits.');
  const [state, setState] = useState<{
    phase: IdlePhase;
    remaining: number;
  }>({ phase: 'active', remaining: timeout });
  const last = useRef(0);
  const phase = useRef<IdlePhase>('active');
  const resetRef = useRef<() => void>(() => {});
  const callbacks = useRef({ onIdle, onActive, onWarning });
  callbacks.current = { onIdle, onActive, onWarning };
  useEffect(() => {
    last.current = Date.now();
    phase.current = 'active';
    let timer: ReturnType<typeof setTimeout>;
    let channel: BroadcastChannel | null = null;
    const update = () => {
      const remaining = Math.max(0, timeout - (Date.now() - last.current));
      const next: IdlePhase =
        remaining === 0 ? 'idle' : remaining <= warningBefore ? 'warning' : 'active';
      if (next !== phase.current) {
        phase.current = next;
        if (next === 'idle') callbacks.current.onIdle?.();
        else if (next === 'warning') callbacks.current.onWarning?.();
        else callbacks.current.onActive?.();
      }
      setState({ phase: next, remaining });
      clearTimeout(timer);
      const transition =
        next === 'active' && warningBefore > 0 ? remaining - warningBefore : remaining;
      timer = setTimeout(update, Math.max(1, Math.min(1000, transition || 1000)));
    };
    const activity = (force = false, timestamp = Date.now(), broadcast = true) => {
      const now = Date.now();
      if (
        timestamp > now + 1000 ||
        timestamp < last.current ||
        (!force && timestamp - last.current < throttle && phase.current === 'active')
      )
        return;
      last.current = Math.min(timestamp, now);
      if (broadcast) channel?.postMessage({ type: 'activity', at: last.current });
      update();
    };
    resetRef.current = () => activity(true);
    if (crossTab && typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(channelName);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        const message = event.data as {
          type?: unknown;
          at?: unknown;
        };
        if (
          message?.type === 'activity' &&
          typeof message.at === 'number' &&
          Number.isFinite(message.at)
        )
          activity(true, message.at, false);
      };
    }
    const handle = () => activity();
    const visible = () => {
      if (!document.hidden) activity(true);
    };
    for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart'])
      document.addEventListener(event, handle, { passive: true });
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', handle);
    update();
    return () => {
      clearTimeout(timer);
      channel?.close();
      for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart'])
        document.removeEventListener(event, handle);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('focus', handle);
      resetRef.current = () => {};
    };
  }, [timeout, warningBefore, throttle, crossTab, channelName]);
  return { ...state, isIdle: state.phase === 'idle', reset: () => resetRef.current() };
}
export default useIdle;
