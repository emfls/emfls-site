import assert from 'node:assert/strict';
import test from 'node:test';

const controller = await import('../../src/games/field-bloom/controller.ts').catch(() => ({}));
const timerModule = await import('../../src/games/field-bloom/timer.ts').catch(() => ({}));
const input = await import('../../src/games/field-bloom/input.ts').catch(() => ({}));

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

class FakeEventTarget extends EventTarget {
  visibilityState = 'visible';
}

function fixture(unlockedThrough = 12) {
  const clock = new FakeClock();
  const session = controller.createFieldBloomSession({
    clock,
    initialProgress: { version: 1, unlockedThrough, puzzles: {} },
  });
  return { clock, session };
}

function startPuzzle(session, id = 'fb-01') {
  assert.equal(session.selectPuzzle(id), true);
  assert.equal(session.startPuzzle(), true);
  return session.getSnapshot();
}

test('level selection and Start are one-shot and preserve the exact five-state lifecycle', () => {
  assert.equal(typeof controller.createFieldBloomSession, 'function');
  const { session } = fixture(1);
  assert.equal(session.getSnapshot().state, 'LEVEL_SELECT');
  assert.equal(session.selectPuzzle('fb-01'), true);
  assert.equal(session.selectPuzzle('fb-01'), false);
  assert.equal(session.getSnapshot().state, 'PUZZLE_INTRO');
  assert.equal(session.startPuzzle(), true);
  assert.equal(session.startPuzzle(), false);
  assert.equal(session.getSnapshot().state, 'PLAYING');
  assert.equal(session.getSnapshot().elapsedActiveMs, 0);
  assert.deepEqual(controller.FIELD_BLOOM_GAME_STATES, ['LEVEL_SELECT', 'PUZZLE_INTRO', 'PLAYING', 'SOLVE_FEEDBACK', 'PAUSED']);
});

test('piece selection toggles, switching works, used pieces are ignored, and an empty board tap is a no-op', () => {
  const { session } = fixture(2);
  startPuzzle(session, 'fb-02');
  const [vertical, horizontal] = session.getSnapshot().puzzle.inventory;
  const before = session.getSnapshot();
  assert.equal(session.placeAt(1, 2), false);
  assert.deepEqual(session.getSnapshot().placements, before.placements);
  assert.equal(session.selectPiece(vertical.pieceInstanceId), true);
  assert.equal(session.getSnapshot().selectedPieceInstanceId, vertical.pieceInstanceId);
  assert.equal(session.selectPiece(vertical.pieceInstanceId), true);
  assert.equal(session.getSnapshot().selectedPieceInstanceId, null);
  assert.equal(session.selectPiece(horizontal.pieceInstanceId), true);
  assert.equal(session.placeAt(0, 1), true);
  assert.equal(session.getSnapshot().placements.length, 1);
  assert.equal(session.getSnapshot().selectedPieceInstanceId, null);
  assert.equal(session.selectPiece(horizontal.pieceInstanceId), false, 'a used piece cannot be reselected');
});

test('illegal edge placement leaves board and selection unchanged and gives accessible feedback', () => {
  const { session } = fixture(1);
  startPuzzle(session);
  const pieceId = session.getSnapshot().puzzle.inventory[0].pieceInstanceId;
  session.selectPiece(pieceId);
  const before = session.getSnapshot();
  assert.equal(session.placeAt(1, 0), false);
  const after = session.getSnapshot();
  assert.deepEqual(after.placements, before.placements);
  assert.deepEqual(after.evaluation.activationCounts, before.evaluation.activationCounts);
  assert.equal(after.selectedPieceInstanceId, pieceId);
  assert.equal(after.undoCount, before.undoCount);
  assert.match(after.invalidFeedback, /edge|outside|fit/i);
});

test('rapid duplicate placement cannot consume one piece twice', () => {
  const { session } = fixture(2);
  startPuzzle(session, 'fb-02');
  const pieceId = session.getSnapshot().puzzle.inventory[1].pieceInstanceId;
  session.selectPiece(pieceId);
  assert.equal(session.placeAt(0, 1), true);
  assert.equal(session.placeAt(0, 2), false);
  assert.equal(session.selectPiece(pieceId), false);
  assert.equal(session.getSnapshot().placements.filter(({ pieceInstanceId }) => pieceInstanceId === pieceId).length, 1);
});

test('forbidden activation and overcharge are legal placements while the puzzle remains PLAYING', () => {
  const forbidden = fixture(5).session;
  startPuzzle(forbidden, 'fb-05');
  const forbiddenPiece = forbidden.getSnapshot().puzzle.inventory.find(({ pieceType }) => pieceType === 'H3');
  forbidden.selectPiece(forbiddenPiece.pieceInstanceId);
  assert.equal(forbidden.placeAt(3, 3), true);
  assert.equal(forbidden.getSnapshot().state, 'PLAYING');
  assert.equal(forbidden.getSnapshot().evaluation.cells.find(({ row, col }) => row === 3 && col === 4).status, 'violation');

  const overcharged = fixture(7).session;
  startPuzzle(overcharged, 'fb-07');
  const [x5, h3] = overcharged.getSnapshot().puzzle.inventory;
  overcharged.selectPiece(h3.pieceInstanceId);
  assert.equal(overcharged.placeAt(1, 1), true);
  overcharged.selectPiece(x5.pieceInstanceId);
  assert.equal(overcharged.placeAt(2, 2), true);
  assert.equal(overcharged.getSnapshot().state, 'PLAYING');
  assert.equal(overcharged.getSnapshot().evaluation.cells.find(({ row, col }) => row === 1 && col === 1).status, 'overcharged');
});

test('Undo removes only the latest placement, restores its instance, clears selection, and ignores empty Undo', () => {
  const { session } = fixture(4);
  startPuzzle(session, 'fb-04');
  const puzzle = session.getSnapshot().puzzle;
  const horizontal = puzzle.inventory.find(({ pieceType }) => pieceType === 'H3');
  const vertical = puzzle.inventory.find(({ pieceType }) => pieceType === 'V3');
  session.selectPiece(horizontal.pieceInstanceId);
  session.placeAt(1, 1);
  session.selectPiece(vertical.pieceInstanceId);
  session.placeAt(1, 3);
  assert.equal(session.getSnapshot().placements.length, 2);
  assert.equal(session.undo(), true);
  assert.deepEqual(session.getSnapshot().placements.map(({ pieceInstanceId }) => pieceInstanceId), [horizontal.pieceInstanceId]);
  assert.equal(session.getSnapshot().selectedPieceInstanceId, null);
  assert.equal(session.getSnapshot().undoCount, 1);
  assert.equal(session.getSnapshot().evaluation.cells.find(({ row, col }) => row === 2 && col === 3).activationCount, 0);
  assert.equal(session.selectPiece(vertical.pieceInstanceId), true, 'Undo restores the latest piece');
  assert.equal(session.undo(), true);
  assert.equal(session.undo(), false, 'empty Undo does not mutate');
  assert.equal(session.getSnapshot().undoCount, 2);
});

test('Reset clears placements and selection, increments undoCount even when empty, and keeps active time running', () => {
  const { clock, session } = fixture(4);
  startPuzzle(session, 'fb-04');
  const horizontal = session.getSnapshot().puzzle.inventory.find(({ pieceType }) => pieceType === 'H3');
  session.selectPiece(horizontal.pieceInstanceId);
  session.placeAt(1, 1);
  clock.advance(500);
  assert.equal(session.reset(), true);
  assert.equal(session.getSnapshot().placements.length, 0);
  assert.equal(session.getSnapshot().selectedPieceInstanceId, null);
  assert.equal(session.getSnapshot().undoCount, 1);
  assert.equal(session.getSnapshot().elapsedActiveMs, 500);
  assert.equal(session.reset(), true);
  assert.equal(session.getSnapshot().undoCount, 2);
  clock.advance(500);
  assert.equal(session.getSnapshot().elapsedActiveMs, 1000);
  assert.equal(session.getSnapshot().state, 'PLAYING');
});

test('timer counts only active intervals and formats elapsed time by whole seconds', () => {
  assert.equal(typeof timerModule.createActiveTimer, 'function');
  assert.equal(typeof timerModule.formatElapsedTime, 'function');
  const clock = new FakeClock();
  const updates = [];
  const timer = timerModule.createActiveTimer({ clock, onUpdate: (value) => updates.push(value) });
  assert.equal(timer.start(), true);
  clock.advance(1250);
  assert.equal(timer.getElapsedMs(), 1250);
  assert.equal(timer.pause(), true);
  clock.advance(10000);
  assert.equal(timer.getElapsedMs(), 1250);
  assert.equal(timer.resume(), true);
  clock.advance(750);
  assert.equal(timer.stop(), 2000);
  assert.ok(updates.length >= 5);
  assert.equal(timerModule.formatElapsedTime(1250), '0:01');
  assert.equal(timerModule.formatElapsedTime(60999), '1:00');
  assert.equal(timerModule.formatElapsedTime(3600000), '60:00');
});

test('cancelled timer callbacks from an old active interval cannot update a resumed attempt', () => {
  const clock = new FakeClock();
  const updates = [];
  const timer = timerModule.createActiveTimer({ clock, onUpdate: (value) => updates.push(value) });
  timer.start();
  const staleCallback = [...clock.tasks.values()][0].callback;
  timer.pause();
  timer.resume();
  const updatesAfterResume = updates.length;
  staleCallback();
  assert.equal(updates.length, updatesAfterResume);
  assert.equal(clock.tasks.size, 1, 'the stale timer does not replace the resumed interval');
  const stoppedCallback = [...clock.tasks.values()][0].callback;
  timer.stop();
  const updatesAfterStop = updates.length;
  stoppedCallback();
  assert.equal(updates.length, updatesAfterStop);
});

test('pause/resume preserves board and selected piece; hidden duration does not count', () => {
  const { clock, session } = fixture(4);
  startPuzzle(session, 'fb-04');
  const puzzle = session.getSnapshot().puzzle;
  const horizontal = puzzle.inventory.find(({ pieceType }) => pieceType === 'H3');
  const vertical = puzzle.inventory.find(({ pieceType }) => pieceType === 'V3');
  session.selectPiece(horizontal.pieceInstanceId);
  session.placeAt(1, 1);
  session.selectPiece(vertical.pieceInstanceId);
  clock.advance(1250);
  const before = session.getSnapshot();
  assert.equal(session.pause('manual'), true);
  assert.equal(session.getSnapshot().pauseReason, 'manual');
  clock.advance(5000);
  assert.equal(session.getSnapshot().elapsedActiveMs, before.elapsedActiveMs);
  assert.equal(session.resume(), true);
  clock.advance(750);
  const after = session.getSnapshot();
  assert.equal(after.state, 'PLAYING');
  assert.equal(after.elapsedActiveMs, before.elapsedActiveMs + 750);
  assert.deepEqual(after.placements, before.placements);
  assert.equal(after.selectedPieceInstanceId, before.selectedPieceInstanceId);
  assert.equal(after.undoCount, before.undoCount);
});

test('visibility and orientation pause only PLAYING, never auto-resume, and cleanup destroys stale work', () => {
  assert.equal(typeof controller.bindFieldBloomLifecycle, 'function');
  const { clock, session } = fixture(1);
  session.selectPuzzle('fb-01');
  const document = new FakeEventTarget();
  const window = new EventTarget();
  const unbind = controller.bindFieldBloomLifecycle(session, { document, window });
  window.dispatchEvent(new Event('orientationchange'));
  assert.equal(session.getSnapshot().state, 'PUZZLE_INTRO');
  session.startPuzzle();
  session.selectPiece(session.getSnapshot().puzzle.inventory[0].pieceInstanceId);
  clock.advance(1000);
  document.visibilityState = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(session.getSnapshot().state, 'PAUSED');
  assert.equal(session.getSnapshot().pauseReason, 'visibility');
  clock.advance(5000);
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(session.getSnapshot().state, 'PAUSED');
  assert.equal(session.resume(), true);
  window.dispatchEvent(new Event('orientationchange'));
  assert.equal(session.getSnapshot().state, 'PAUSED');
  assert.equal(session.getSnapshot().pauseReason, 'orientation');
  window.dispatchEvent(new Event('pagehide'));
  assert.equal(session.resume(), false);
  clock.advance(10000);
  assert.equal(session.getSnapshot().state, 'PAUSED');
  unbind();

  const intro = fixture(1).session;
  intro.selectPuzzle('fb-01');
  const introDocument = new FakeEventTarget();
  const introWindow = new EventTarget();
  const unbindIntro = controller.bindFieldBloomLifecycle(intro, { document: introDocument, window: introWindow });
  introDocument.dispatchEvent(new Event('astro:before-swap'));
  assert.equal(intro.startPuzzle(), false, 'swap cleanup invalidates an intro attempt too');
  unbindIntro();
});

test('solve locks input synchronously, freezes time, and retry begins a fresh attempt', () => {
  const { clock, session } = fixture(1);
  startPuzzle(session);
  const pieceId = session.getSnapshot().puzzle.inventory[0].pieceInstanceId;
  session.selectPiece(pieceId);
  clock.advance(4321);
  assert.equal(session.placeAt(1, 1), true);
  const solved = session.getSnapshot();
  assert.equal(solved.state, 'SOLVE_FEEDBACK');
  assert.equal(solved.evaluation.solved, true);
  assert.equal(solved.elapsedActiveMs, 4321);
  assert.equal(session.placeAt(1, 2), false);
  assert.equal(session.selectPiece(pieceId), false);
  assert.equal(session.undo(), false);
  assert.equal(session.reset(), false);
  assert.equal(session.pause('manual'), false);
  clock.advance(5000);
  assert.equal(session.getSnapshot().elapsedActiveMs, 4321);
  assert.equal(session.retryPuzzle(), true);
  assert.equal(session.getSnapshot().state, 'PUZZLE_INTRO');
  assert.equal(session.startPuzzle(), true);
  assert.equal(session.getSnapshot().elapsedActiveMs, 0);
});

test('input delegation supports native click, mouse-only preview, and removes every listener', () => {
  assert.equal(typeof input.bindFieldBloomInput, 'function');
  const listeners = new Map();
  const root = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
  };
  const actions = [];
  const handlers = {
    onAction: (action) => actions.push(['action', action]),
    onPuzzleSelect: (id) => actions.push(['puzzle', id]),
    onPieceSelect: (id) => actions.push(['piece', id]),
    onCellActivate: (row, col) => actions.push(['cell', row, col]),
    onPreview: (row, col) => actions.push(['preview', row, col]),
    onClearPreview: () => actions.push(['clear']),
  };
  const unbind = input.bindFieldBloomInput(root, handlers);
  const targetFor = (selector, dataset, contains = () => false) => ({
    closest: (query) => query === selector ? { dataset, contains } : null,
  });
  listeners.get('click')({ target: targetFor('[data-piece-id]', { pieceId: 'piece-1' }) });
  listeners.get('click')({ target: targetFor('[data-cell-row][data-cell-col]', { cellRow: '2', cellCol: '3' }) });
  listeners.get('click')({ target: targetFor('[data-action]', { action: 'undo' }) });
  listeners.get('pointerover')({ target: targetFor('[data-cell-row][data-cell-col]', { cellRow: '1', cellCol: '1' }), pointerType: 'touch' });
  listeners.get('pointerover')({ target: targetFor('[data-cell-row][data-cell-col]', { cellRow: '1', cellCol: '1' }), pointerType: 'mouse' });
  listeners.get('pointerout')({ target: targetFor('[data-cell-row][data-cell-col]', { cellRow: '1', cellCol: '1' }), relatedTarget: null });
  assert.deepEqual(actions, [
    ['piece', 'piece-1'], ['cell', 2, 3], ['action', 'undo'], ['preview', 1, 1], ['clear'],
  ]);
  unbind();
  assert.equal(listeners.size, 0);
});
