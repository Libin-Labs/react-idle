# @lp-labs/react-idle

Idle state, warning countdowns and optional cross-tab activity. React 18+ peer only; TypeScript, ESM and CommonJS included.

## Installation

```sh
npm install @lp-labs/react-idle
```

## Quick Start

```jsx
import { useIdle } from '@lp-labs/react-idle';
export default function Example() {
  const idle = useIdle({ timeout: 300000, warningBefore: 30000 });
  return (
    <>
      <output aria-live="polite">
        {idle.phase}: {Math.ceil(idle.remaining / 1000)}s
      </output>
      <button onClick={idle.reset}>Stay active</button>
    </>
  );
}
```

## API

`useIdle({timeout=300000,warningBefore=30000,throttle=1000,crossTab=false,channelName='lp-idle',onIdle,onActive,onWarning})` returns `phase` (`active/warning/idle`), `remaining` milliseconds, `isIdle`, `reset()`. Pointer, touch, wheel, key, focus and visibility events record activity. Callbacks fire on transitions. BroadcastChannel is used only when requested and available; peers exchange timestamps, not application data.

## Benefits

| Area                 | Details                                      |
| -------------------- | -------------------------------------------- |
| Transition callbacks | Respond to active, warning, and idle phases. |
| Cross-tab option     | Share activity timestamps only when enabled. |
| Lifecycle cleanup    | Remove timers and listeners on unmount.      |

## Customization

| Area         | Details                                                        |
| ------------ | -------------------------------------------------------------- |
| Timing       | Set idle timeout, warning lead, and event throttle.            |
| Coordination | Opt into BroadcastChannel and choose a channel name.           |
| Responses    | Handle phase callbacks and call reset from an explicit action. |

## Security And Limits

Timeout: 100 ms–24 h; warningBefore must be below timeout; throttle: 0–timeout; channel names: up to 128 characters. Timers and listeners are removed on unmount. Countdown precision is best effort: hidden tabs and suspended devices throttle timers. Cross-tab messages are same-origin coordination, not trusted evidence of user activity. Enforce session expiry on the server; do not use this hook as an authentication or authorization mechanism.

## Support

[Donate via PayPal](https://www.paypal.me/LibinPrasanth). Author: [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).

## License

MIT License. See the packaged [LICENSE](LICENSE) file.
