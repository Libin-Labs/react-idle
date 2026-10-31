import { beforeEach, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act, createElement } from 'react';
import { setup } from './helpers.mjs';
import { useIdle } from '../dist/index.js';
let ui;
beforeEach(async () => (ui = await setup()));
afterEach(async () => ui.cleanup());
test('warning and idle transitions reset from explicit activity', async (context) => {
  context.mock.timers.enable({ apis: ['Date', 'setTimeout'] });
  let api;
  function App() {
    api = useIdle({ timeout: 200, warningBefore: 100, throttle: 0 });
    return null;
  }
  await ui.render(createElement(App));
  await act(() => context.mock.timers.tick(100));
  assert.equal(api.phase, 'warning');
  await act(() => context.mock.timers.tick(100));
  assert.equal(api.isIdle, true);
  await act(() => api.reset());
  assert.equal(api.phase, 'active');
  await ui.render(null);
  context.mock.timers.reset();
});
