import assert from "node:assert/strict";
import { MockNlpProvider } from "../.tmp/assistant-build/src/assistant/mockNlpProvider.js";
import { runTravelAssistantWithProvider } from "../.tmp/assistant-build/src/assistant/orchestrator.js";
import { SUGGESTED_PROMPTS } from "../.tmp/assistant-build/src/assistant/samplePrompts.js";

test("mock NLP returns deterministic assistant responses for every suggested prompt", async () => {
  const provider = new MockNlpProvider();

  for (const prompt of SUGGESTED_PROMPTS) {
    const first = await runTravelAssistantWithProvider(prompt, provider);
    const second = await runTravelAssistantWithProvider(prompt, provider);

    assert.deepEqual(second, first, `Mock response changed for prompt: ${prompt}`);
    assert.equal(first.provider, "mock");
    assert.ok(first.intent.cities.length > 0, `No city parsed for: ${prompt}`);
    assert.ok(first.trace.length > 0, `No tool calls made for: ${prompt}`);
    assert.ok(first.evaluations.length > 0, `No evaluations returned for: ${prompt}`);

    if (first.mode === "compare") {
      assert.ok(first.evaluations.length >= 2, `Compare prompt did not compare cities: ${prompt}`);
    }

    if (first.mode === "focus") {
      assert.ok(first.answer.length > 0, `Focus prompt did not return an answer: ${prompt}`);
    }

    if (first.mode === "plan") {
      assert.ok(first.plans.length > 0, `Plan prompt did not return plan options: ${prompt}`);
    }
  }
});

test("partial-data warnings are not exposed in user-facing trace or plan tradeoffs", async () => {
  const response = await runTravelAssistantWithProvider(
    "Plan a 4 day trip to Tokyo in July with food, art, and outdoor activities.",
    new MockNlpProvider(),
  );

  assert.ok(
    response.trace.every((trace) => !trace.warnings?.includes("PARTIAL_DATA")),
    "Trace should not expose PARTIAL_DATA warnings",
  );

  if (response.mode === "plan") {
    assert.ok(
      response.plans.every((plan) =>
        plan.tradeoffs.every((tradeoff) => !tradeoff.toLowerCase().includes("partial")),
      ),
      "Plan tradeoffs should not expose partial-data warnings",
    );
  }
});

async function test(name, run) {
  try {
    await run();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
