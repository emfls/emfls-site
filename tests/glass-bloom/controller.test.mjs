import assert from 'node:assert/strict';
import test from 'node:test';

const timerModule = await import('../../src/games/glass-bloom/timer.ts').catch(() => ({}));
const controllerModule = await import('../../src/games/glass-bloom/controller.ts').catch(() => ({}));
const inputModule = await import('../../src/games/glass-bloom/input.ts').catch(() => ({}));

class FakeClock {
  current = 0;
  nextId = 1;
  tasks = new Map();

  now = () => this.current;

  setTimeout = (callback, delayMs) => {
    const id = this.nextId++;
    this.tasks.set(id, { at: this.current + Math.max(0, delayMs), callback });
    return id;
  };

  clearTimeout = (id) => this.tasks.delete(id);

  advance(durationMs) {
    const end = this.current + durationMs;
    for (;;) {
      const next = [...this.tasks.entries()]
        .filter(([, task]) => task.at <= end)
        .sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0];
      if (!next) break;
      const [id, task] = next;
      this.tasks.delete(id);
      this.current = task.at;
      task.callback();
    }
    this.current = end;
  }
}

test('presentation timer resumes with exact remaining time and ignores an old callback', () => {
  assert.equal(typeof timerModule.createPresentationTimer, 'function');
  const clock = new FakeClock();
  const expired = [];
  const timer = timerModule.createPresentationTimer({ clock });

  assert.equal(timer.start(350, () => expired.push('done')), true);
  assert.equal(timer.start(100, () => expired.push('duplicate')), false);
  const staleCallback = [...clock.tasks.values()][0].callback;

  clock.advance(120);
  assert.equal(timer.pause(), true);
  assert.equal(timer.getRemaining(), 230);
  assert.equal(clock.tasks.size, 0);
  assert.equal(timer.resume(), true);
  staleCallback();
  assert.deepEqual(expired, []);
  assert.equal(clock.tasks.size, 1);

  clock.advance(229);
  assert.deepEqual(expired, []);
  clock.advance(1);
  assert.deepEqual(expired, ['done']);
  assert.equal(timer.pause(), false);
  assert.equal(timer.resume(), false);
});

function createControllerFixture(seed = 1) {
  assert.equal(typeof controllerModule.createGlassBloomController, 'function');
  const clock = new FakeClock();
  let seedCalls = 0;
  const controller = controllerModule.createGlassBloomController({
    clock,
    seedSource: () => {
      seedCalls += 1;
      return seed;
    },
  });
  return { clock, controller, getSeedCalls: () => seedCalls };
}

function enterDecision(fixture) {
  assert.equal(fixture.controller.start(), true);
  fixture.clock.advance(350);
  assert.equal(fixture.controller.getSnapshot().state, 'DECISION');
}

test('controller starts one session and completes Crystal intro without consuming RNG', () => {
  const fixture = createControllerFixture(0);
  assert.equal(fixture.controller.getState(), 'IDLE');
  assert.equal(fixture.controller.getSnapshot(), null);
  assert.equal(fixture.controller.start(), true);
  assert.equal(fixture.controller.start(), false);
  assert.equal(fixture.getSeedCalls(), 1);
  assert.equal(fixture.controller.getSnapshot().state, 'CRYSTAL_INTRO');
  assert.equal(fixture.controller.getSnapshot().rngState, 0);
  fixture.clock.advance(349);
  assert.equal(fixture.controller.getState(), 'CRYSTAL_INTRO');
  fixture.clock.advance(1);
  assert.equal(fixture.controller.getState(), 'DECISION');
  assert.equal(fixture.controller.getSnapshot().rngState, 0);
});

test('idle Grow prompt describes the first next-stage pot rather than the Stage 8 copy', () => {
  assert.equal(typeof controllerModule.getGrowButtonCopy, 'function');
  assert.equal(controllerModule.getGrowButtonCopy(null), 'Take the risk for 180');
});

test('accepted safe Grow samples once, locks competing inputs, and returns after 450ms', () => {
  const fixture = createControllerFixture(1);
  enterDecision(fixture);
  assert.equal(fixture.controller.grow(), true);
  const committed = fixture.controller.getSnapshot();
  assert.equal(committed.state, 'GROW_RESOLVING');
  assert.equal(committed.growOutcome, 'SAFE');
  assert.equal(committed.stage, 2);
  assert.equal(committed.pot, 180);
  assert.equal(committed.rngState, 0x6d2b79f6);
  assert.equal(fixture.controller.grow(), false);
  assert.equal(fixture.controller.bank(), false);
  assert.equal(fixture.controller.getSnapshot(), committed);
  fixture.clock.advance(449);
  assert.equal(fixture.controller.getState(), 'GROW_RESOLVING');
  fixture.clock.advance(1);
  assert.equal(fixture.controller.getState(), 'DECISION');
  assert.equal(fixture.controller.getSnapshot().rngState, 0x6d2b79f6);
});

test('Break commits one sample and advances exactly once after 650ms plus feedback', () => {
  const fixture = createControllerFixture(7);
  enterDecision(fixture);
  assert.equal(fixture.controller.grow(), true);
  const committed = fixture.controller.getSnapshot();
  assert.equal(committed.growOutcome, 'SHATTERED');
  assert.equal(committed.pot, 0);
  assert.equal(committed.totalScore, 0);
  assert.equal(committed.bankStreak, 0);
  assert.equal(committed.breaks, 1);
  assert.equal(committed.rngState, 0x6d2b79fc);
  assert.equal(fixture.controller.grow(), false);
  fixture.clock.advance(650);
  assert.equal(fixture.controller.getState(), 'ROUND_FEEDBACK');
  fixture.clock.advance(499);
  assert.equal(fixture.controller.getSnapshot().crystalIndex, 1);
  fixture.clock.advance(1);
  const next = fixture.controller.getSnapshot();
  assert.equal(next.state, 'CRYSTAL_INTRO');
  assert.equal(next.crystalIndex, 2);
  assert.equal(next.stage, 1);
  assert.equal(next.pot, 100);
  assert.equal(next.totalScore, 0);
  assert.equal(next.breaks, 1);
  assert.equal(next.rngState, committed.rngState);
});

test('Bank commits award and stats once, consumes no RNG, and follows 400ms plus feedback', () => {
  const fixture = createControllerFixture(1);
  enterDecision(fixture);
  assert.equal(fixture.controller.bank(), true);
  const committed = fixture.controller.getSnapshot();
  assert.equal(committed.state, 'BANK_RESOLVING');
  assert.equal(committed.bankAward, 100);
  assert.equal(committed.totalScore, 100);
  assert.equal(committed.successfulBanks, 1);
  assert.equal(committed.bankStreak, 1);
  assert.equal(committed.rngState, 1);
  assert.equal(fixture.controller.bank(), false);
  assert.equal(fixture.controller.grow(), false);
  assert.equal(fixture.controller.getSnapshot(), committed);
  fixture.clock.advance(399);
  assert.equal(fixture.controller.getState(), 'BANK_RESOLVING');
  fixture.clock.advance(1);
  assert.equal(fixture.controller.getState(), 'ROUND_FEEDBACK');
  fixture.clock.advance(500);
  assert.equal(fixture.controller.getState(), 'CRYSTAL_INTRO');
  assert.equal(fixture.controller.getSnapshot().crystalIndex, 2);
  assert.equal(fixture.controller.getSnapshot().totalScore, 100);
  assert.equal(fixture.controller.getSnapshot().rngState, 1);
});

test('Grow and Bank races accept only the first legal action synchronously', () => {
  const growFirst = createControllerFixture(1);
  enterDecision(growFirst);
  assert.equal(growFirst.controller.grow(), true);
  assert.equal(growFirst.controller.bank(), false);
  assert.equal(growFirst.controller.getSnapshot().state, 'GROW_RESOLVING');

  const bankFirst = createControllerFixture(1);
  enterDecision(bankFirst);
  assert.equal(bankFirst.controller.bank(), true);
  assert.equal(bankFirst.controller.grow(), false);
  assert.equal(bankFirst.controller.getSnapshot().state, 'BANK_RESOLVING');
});

test('manual pause preserves exact intro and decision state without RNG', () => {
  const intro = createControllerFixture(0);
  assert.equal(intro.controller.start(), true);
  intro.clock.advance(100);
  assert.equal(intro.controller.pause(), true);
  assert.equal(intro.controller.getState(), 'PAUSED');
  assert.equal(intro.controller.resume(), true);
  intro.clock.advance(249);
  assert.equal(intro.controller.getState(), 'CRYSTAL_INTRO');
  intro.clock.advance(1);
  assert.equal(intro.controller.getState(), 'DECISION');
  assert.equal(intro.controller.getSnapshot().rngState, 0);

  assert.equal(intro.controller.pause(), true);
  assert.equal(intro.controller.resume(), true);
  assert.equal(intro.controller.getState(), 'DECISION');
  assert.equal(intro.controller.getSnapshot().rngState, 0);
});

test('pausing committed Grow restores its exact remaining presentation without rerolling', () => {
  const fixture = createControllerFixture(1);
  enterDecision(fixture);
  fixture.controller.grow();
  const committed = fixture.controller.getSnapshot();
  const staleCallback = [...fixture.clock.tasks.values()][0].callback;
  fixture.clock.advance(200);
  assert.equal(fixture.controller.pause(), true);
  assert.equal(fixture.controller.getSnapshot().state, 'PAUSED');
  assert.equal(fixture.controller.getSnapshot().rngState, committed.rngState);
  assert.equal(fixture.controller.getSnapshot().stage, 2);
  assert.equal(fixture.controller.resume(), true);
  staleCallback();
  fixture.clock.advance(249);
  assert.equal(fixture.controller.getState(), 'GROW_RESOLVING');
  fixture.clock.advance(1);
  assert.equal(fixture.controller.getState(), 'DECISION');
  assert.equal(fixture.controller.getSnapshot().rngState, committed.rngState);
  assert.equal(fixture.controller.getSnapshot().stage, 2);
});

test('pausing committed Bank and round feedback never re-awards or double-advances', () => {
  const fixture = createControllerFixture(0);
  enterDecision(fixture);
  fixture.controller.bank();
  const banked = fixture.controller.getSnapshot();
  fixture.clock.advance(150);
  fixture.controller.pause();
  assert.equal(fixture.controller.getSnapshot().totalScore, 100);
  fixture.controller.resume();
  fixture.clock.advance(249);
  assert.equal(fixture.controller.getState(), 'BANK_RESOLVING');
  fixture.clock.advance(1);
  assert.equal(fixture.controller.getState(), 'ROUND_FEEDBACK');
  assert.equal(fixture.controller.getSnapshot().totalScore, 100);
  assert.equal(fixture.controller.getSnapshot().successfulBanks, 1);

  fixture.clock.advance(200);
  fixture.controller.pause();
  fixture.controller.resume();
  fixture.clock.advance(299);
  assert.equal(fixture.controller.getState(), 'ROUND_FEEDBACK');
  fixture.clock.advance(1);
  assert.equal(fixture.controller.getState(), 'CRYSTAL_INTRO');
  assert.equal(fixture.controller.getSnapshot().crystalIndex, 2);
  assert.equal(fixture.controller.getSnapshot().totalScore, banked.totalScore);
  assert.equal(fixture.controller.getSnapshot().successfulBanks, 1);
});

test('hidden documents pause once, visible documents never auto-resume, and cleanup invalidates work', () => {
  assert.equal(typeof controllerModule.bindGlassBloomLifecycle, 'function');
  class FakeDocument extends EventTarget {
    visibilityState = 'visible';
  }
  class FakeWindow extends EventTarget {}

  const fixture = createControllerFixture(1);
  const documentRef = new FakeDocument();
  const windowRef = new FakeWindow();
  const unbind = controllerModule.bindGlassBloomLifecycle({
    controller: fixture.controller,
    documentRef,
    windowRef,
  });
  enterDecision(fixture);
  fixture.controller.grow();
  documentRef.visibilityState = 'hidden';
  documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(fixture.controller.getState(), 'PAUSED');
  documentRef.visibilityState = 'visible';
  documentRef.dispatchEvent(new Event('visibilitychange'));
  assert.equal(fixture.controller.getState(), 'PAUSED');
  fixture.controller.resume();
  const staleCallback = [...fixture.clock.tasks.values()][0].callback;
  windowRef.dispatchEvent(new Event('pagehide'));
  staleCallback();
  fixture.clock.advance(1000);
  assert.equal(fixture.controller.getState(), 'GROW_RESOLVING');
  assert.equal(fixture.controller.start(), false);
  unbind();
});

class FakeDocument extends EventTarget {
  activeElement = null;
  visibilityState = 'visible';
}

class FakeRoot extends EventTarget {
  contains(element) {
    return element?.root === this;
  }
}

class TargetedClickEvent extends Event {
  constructor(target) {
    super('click', { bubbles: true, cancelable: true });
    this.intendedTarget = target;
  }

  get target() {
    return this.intendedTarget ?? super.target;
  }
}

class FakeKeyboardEvent extends Event {
  constructor(key, options = {}) {
    super('keydown', { bubbles: true, cancelable: true });
    Object.assign(this, {
      key,
      code: key === ' ' ? 'Space' : key,
      repeat: false,
      isComposing: false,
      keyCode: 0,
      ctrlKey: false,
      altKey: false,
      metaKey: false,
      shiftKey: false,
      ...options,
    });
  }
}

function createInputFixture(seed = 1) {
  assert.equal(typeof inputModule.bindGlassBloomInput, 'function');
  const game = createControllerFixture(seed);
  const root = new FakeRoot();
  const documentRef = new FakeDocument();
  const unbind = inputModule.bindGlassBloomInput({ root, documentRef, controller: game.controller });
  return { ...game, root, documentRef, unbind };
}

function createActionButton(root, action) {
  return {
    root,
    dataset: { action },
    disabled: false,
    closest(selector) {
      return selector.includes('button') || selector.includes('[data-action]') ? this : null;
    },
  };
}

function clickAction(fixture, action) {
  fixture.root.dispatchEvent(new TargetedClickEvent(createActionButton(fixture.root, action)));
}

function pressGameKey(fixture, key, options) {
  const event = new FakeKeyboardEvent(key, options);
  fixture.documentRef.dispatchEvent(event);
  return event;
}

test('delegated native Start, Grow, and Bank clicks share the controller lock', () => {
  const fixture = createInputFixture(1);
  clickAction(fixture, 'start');
  clickAction(fixture, 'start');
  assert.equal(fixture.controller.getState(), 'CRYSTAL_INTRO');
  assert.equal(fixture.getSeedCalls(), 1);
  fixture.clock.advance(350);
  clickAction(fixture, 'grow');
  clickAction(fixture, 'bank');
  assert.equal(fixture.controller.getState(), 'GROW_RESOLVING');
  assert.equal(fixture.controller.getSnapshot().rngState, 0x6d2b79f6);
  fixture.unbind();
});

test('Space grows and Enter banks only when accepted in DECISION', () => {
  const fixture = createInputFixture(1);
  clickAction(fixture, 'start');
  fixture.clock.advance(350);
  const growEvent = pressGameKey(fixture, ' ');
  assert.equal(growEvent.defaultPrevented, true);
  assert.equal(fixture.controller.getState(), 'GROW_RESOLVING');
  fixture.clock.advance(450);
  const bankEvent = pressGameKey(fixture, 'Enter');
  assert.equal(bankEvent.defaultPrevented, true);
  assert.equal(fixture.controller.getState(), 'BANK_RESOLVING');
  assert.equal(fixture.controller.getSnapshot().totalScore, 180);
  assert.equal(fixture.controller.getSnapshot().rngState, 0x6d2b79f6);
  fixture.unbind();
});

test('keyboard ignores repeats, composition, modifiers, guarded focus, and non-decision states', () => {
  const fixture = createInputFixture(1);
  clickAction(fixture, 'start');
  const duringIntro = pressGameKey(fixture, ' ');
  assert.equal(duringIntro.defaultPrevented, false);
  fixture.clock.advance(350);

  const ignored = [
    { repeat: true },
    { isComposing: true },
    { keyCode: 229 },
    { shiftKey: true },
    { ctrlKey: true },
    { altKey: true },
    { metaKey: true },
  ];
  for (const options of ignored) {
    assert.equal(pressGameKey(fixture, ' ', options).defaultPrevented, false);
    assert.equal(fixture.controller.getState(), 'DECISION');
  }

  for (const selector of ['input', 'button', 'contenteditable']) {
    fixture.documentRef.activeElement = {
      closest(value) {
        return value.includes(selector) ? this : null;
      },
      isContentEditable: selector === 'contenteditable',
    };
    assert.equal(pressGameKey(fixture, ' ').defaultPrevented, false);
    assert.equal(fixture.controller.getState(), 'DECISION');
  }
  fixture.documentRef.activeElement = null;
  fixture.unbind();
});

test('native focused button activation is not duplicated by the Space game shortcut', () => {
  const fixture = createInputFixture(1);
  clickAction(fixture, 'start');
  fixture.clock.advance(350);
  const growButton = createActionButton(fixture.root, 'grow');
  fixture.documentRef.activeElement = growButton;
  const shortcut = pressGameKey(fixture, ' ');
  assert.equal(shortcut.defaultPrevented, false);
  assert.equal(fixture.controller.getState(), 'DECISION');

  fixture.root.dispatchEvent(new TargetedClickEvent(growButton));
  assert.equal(fixture.controller.getState(), 'GROW_RESOLVING');
  assert.equal(fixture.controller.getSnapshot().rngState, 0x6d2b79f6);
  fixture.unbind();
});

test('Play Again click delegates once to the controller and starts a new session only from RESULT', () => {
  const fixture = createInputFixture(1);
  clickAction(fixture, 'play-again');
  assert.equal(fixture.controller.getState(), 'IDLE');

  clickAction(fixture, 'start');
  fixture.clock.advance(350);
  for (let crystal = 1; crystal <= 8; crystal += 1) {
    clickAction(fixture, 'bank');
    fixture.clock.advance(900);
    if (crystal < 8) fixture.clock.advance(350);
  }
  assert.equal(fixture.controller.getState(), 'RESULT');
  clickAction(fixture, 'play-again');
  assert.equal(fixture.controller.getState(), 'CRYSTAL_INTRO');
  assert.equal(fixture.controller.getSnapshot().crystalIndex, 1);
  assert.equal(fixture.getSeedCalls(), 2);
  clickAction(fixture, 'play-again');
  assert.equal(fixture.getSeedCalls(), 2);
  fixture.unbind();
});

function createBestStorage(initial = { bestScore: 0, highestStageReached: 0 }) {
  const values = new Map([['emfls:glass-bloom:best:v1', JSON.stringify(initial)]]);
  const writes = [];
  return {
    writes,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); writes.push([key, value]); },
    read() { return JSON.parse(values.get('emfls:glass-bloom:best:v1')); },
  };
}

test('eight real controller Banks commit one six-stat result and rematch starts a fresh seeded session', () => {
  const clock = new FakeClock();
  const storage = createBestStorage();
  const seeds = [1, 22];
  let seedCalls = 0;
  const controller = controllerModule.createGlassBloomController({
    clock,
    seedSource: () => seeds[seedCalls++],
    storage: () => storage,
  });
  let resultNotifications = 0;
  controller.subscribe((snapshot) => {
    if (snapshot?.state === 'RESULT') resultNotifications += 1;
  });

  assert.equal(controller.start(), true);
  clock.advance(350);
  let finalFeedbackCallback;
  for (let crystal = 1; crystal <= 8; crystal += 1) {
    assert.equal(controller.getSnapshot().crystalIndex, crystal);
    assert.equal(controller.bank(), true);
    assert.equal(controller.bank(), false, 'a second Bank cannot duplicate a committed award');
    assert.equal(storage.writes.length, 0, 'partial sessions are never persisted');
    clock.advance(400);
    assert.equal(controller.getState(), 'ROUND_FEEDBACK');
    finalFeedbackCallback = [...clock.tasks.values()][0]?.callback;
    clock.advance(500);
    if (crystal < 8) clock.advance(350);
  }

  assert.equal(controller.getState(), 'RESULT');
  assert.equal(controller.getSnapshot().crystalIndex, 8, 'there is no ninth Crystal');
  assert.deepEqual({
    totalScore: controller.getSnapshot().totalScore,
    successfulBanks: controller.getSnapshot().successfulBanks,
    breaks: controller.getSnapshot().breaks,
    highestStage: controller.getSnapshot().highestStage,
    bestBankStreak: controller.getSnapshot().bestBankStreak,
  }, { totalScore: 910, successfulBanks: 8, breaks: 0, highestStage: 1, bestBankStreak: 8 });
  assert.deepEqual(controller.getBestStats(), { bestScore: 910, highestStageReached: 1 });
  assert.deepEqual(storage.read(), { bestScore: 910, highestStageReached: 1 });
  assert.equal(storage.writes.length, 1);
  assert.equal(resultNotifications, 1);
  finalFeedbackCallback?.();
  assert.equal(storage.writes.length, 1, 'a stale final callback cannot finalize twice');
  assert.equal(resultNotifications, 1);
  assert.equal(controller.grow(), false);
  assert.equal(controller.bank(), false);

  assert.equal(controller.playAgain(), true);
  assert.equal(controller.getState(), 'CRYSTAL_INTRO');
  assert.deepEqual(controller.getSnapshot(), {
    state: 'CRYSTAL_INTRO', seed: 22, rngState: 22, crystalIndex: 1, stage: 1, pot: 100,
    totalScore: 0, bankStreak: 0, bestBankStreak: 0, successfulBanks: 0, breaks: 0,
    highestStage: 1, growOutcome: null, roundOutcome: null, bankAward: 0,
  });
  assert.deepEqual(controller.getBestStats(), { bestScore: 910, highestStageReached: 1 });
  assert.equal(seedCalls, 2);
  assert.equal(controller.playAgain(), false, 'duplicate rematch cannot replace the fresh session');
  assert.equal(seedCalls, 2);
  assert.equal(storage.writes.length, 1);
  controller.destroy();
});

test('Crystal 8 Break finalizes once and preserves all previously banked score', () => {
  const clock = new FakeClock();
  const storage = createBestStorage();
  const controller = controllerModule.createGlassBloomController({
    clock,
    seedSource: () => 0,
    storage: () => storage,
  });
  controller.start();
  clock.advance(350);

  for (let crystal = 1; crystal <= 7; crystal += 1) {
    assert.equal(controller.bank(), true);
    clock.advance(900);
    clock.advance(350);
  }
  assert.equal(controller.getSnapshot().crystalIndex, 8);
  assert.equal(controller.getSnapshot().totalScore, 790);
  while (controller.getState() === 'DECISION' && controller.getSnapshot().stage < 8) {
    assert.equal(controller.grow(), true);
    const outcome = controller.getSnapshot().growOutcome;
    clock.advance(outcome === 'SAFE' ? 450 : 650);
    if (outcome === 'SHATTERED') clock.advance(500);
  }

  assert.equal(controller.getState(), 'RESULT');
  assert.equal(controller.getSnapshot().crystalIndex, 8);
  assert.equal(controller.getSnapshot().totalScore, 790);
  assert.equal(controller.getSnapshot().successfulBanks, 7);
  assert.equal(controller.getSnapshot().breaks, 1);
  assert.equal(controller.getBestStats().bestScore, 790);
  assert.equal(controller.getBestStats().highestStageReached, 2);
  assert.equal(storage.writes.length, 1);
  assert.equal(controller.grow(), false);
  assert.equal(controller.playAgain(), true);
  assert.equal(controller.getSnapshot().crystalIndex, 1);
  assert.equal(controller.getSnapshot().totalScore, 0);
  assert.equal(controller.getBestStats().bestScore, 790);
  controller.destroy();
});
