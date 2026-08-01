import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  REPLAY_MODE,
  nearestReplayFrame,
  normalizeReplayFrame,
  replayCoverage,
  replayFramesForEvent,
  replayModeForEvent,
  replayTrustState,
  replayWindowForEvent,
} from "../src/lib/timeMachineReplay.js";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/time-machine-event.json", import.meta.url), "utf8")
);

test("tracked replay frames are normalized and sorted", () => {
  const frames = replayFramesForEvent(fixture);
  assert.deepEqual(frames.map((frame) => frame.timestamp_seconds), [102, 103, 104]);
  assert.equal(frames[0].track_id, "pose-7");
  assert.equal(replayModeForEvent(fixture), REPLAY_MODE.TRACKED);
  assert.equal(replayTrustState(fixture).label, "Tracked CV replay");
});

test("the nearest overlay frame follows the playback clock", () => {
  assert.equal(nearestReplayFrame(fixture, 102.7).timestamp_seconds, 103);
  assert.equal(nearestReplayFrame(fixture, 103.8).timestamp_seconds, 104);
});

test("the replay window keeps the approved decision and evidence boundaries", () => {
  assert.deepEqual(replayWindowForEvent(fixture), {
    timestamp_seconds: 104,
    start_seconds: 100,
    end_seconds: 108,
  });
  assert.deepEqual(replayCoverage(fixture), {
    frameCount: 3,
    seconds: 2,
    sampleFps: 1,
  });
});

test("a legacy annotated event degrades to a keyframe", () => {
  const event = {
    timestamp_seconds: 55,
    evidence_source: "coach_marked",
    observer_box: { x: 0.2, y: 0.2, width: 0.2, height: 0.4 },
    missed_player_box: { x: 0.7, y: 0.2, width: 0.15, height: 0.4 },
    evidence_confidence: 0.84,
  };

  assert.equal(replayModeForEvent(event), REPLAY_MODE.KEYFRAME);
  assert.equal(replayTrustState(event).label, "Coach-marked keyframe");
  assert.equal(nearestReplayFrame(event, 10).timestamp_seconds, 55);
});

test("an event without visual evidence remains a tactical reconstruction", () => {
  const event = { timestamp_seconds: 12, evidence_source: "ai_draft" };
  assert.equal(replayModeForEvent(event), REPLAY_MODE.RECONSTRUCTION);
  assert.equal(nearestReplayFrame(event, 12), null);
});

test("untrusted scalar values are clamped during frame normalization", () => {
  const frame = normalizeReplayFrame({
    timestamp_seconds: 1,
    observer_box: { x: 0.1, y: 0.1, width: 0.2, height: 0.4 },
    head_direction_proxy: 99,
    observer_confidence: 4,
  });
  assert.equal(frame.head_direction_proxy, 1.5);
  assert.equal(frame.observer_confidence, 1);
});
