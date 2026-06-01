import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { SUGGESTED_PROMPTS } from "../assistant/samplePrompts.js";
import type { AssistantResponse, DestinationEvaluation } from "../assistant/types.js";
import "./styles.css";

function App() {
  const [request, setRequest] = useState<string>(SUGGESTED_PROMPTS[0]);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit(nextRequest = request) {
    if (!nextRequest.trim()) {
      return;
    }

    setRequest(nextRequest);
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request: nextRequest }),
      });

      if (!result.ok) {
        const payload = (await result.json()) as { error?: string };
        throw new Error(payload.error ?? "Request failed.");
      }

      setResponse((await result.json()) as AssistantResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="planner-panel">
        <div className="title-row">
          <div>
            <p className="eyebrow">Agentic travel research</p>
            <h1>Travel Planner Assistant</h1>
          </div>
          <span className="mode-pill">{response?.mode ?? "ready"}</span>
        </div>

        <div className="prompt-grid" aria-label="Suggested prompts">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              className="prompt-chip"
              key={prompt}
              type="button"
              onClick={() => void submit(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <form
          className="request-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <textarea
            value={request}
            onChange={(event) => setRequest(event.target.value)}
            rows={5}
            aria-label="Travel request"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Researching..." : "Plan"}
          </button>
        </form>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {isLoading ? <LoadingState /> : null}
      {response ? <Results response={response} /> : <EmptyState />}
    </main>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      Choose a prompt or write your own request. Results will adapt for comparison,
      focused lookup, or trip planning.
    </section>
  );
}

function LoadingState() {
  return (
    <section className="loading-state">
      <div className="loader" />
      Parsing the request, selecting tools, and gathering mock travel data.
    </section>
  );
}

function Results({ response }: { response: AssistantResponse }) {
  return (
    <section className="results-layout">
      <Trace response={response} />
      {response.mode === "compare" ? <CompareResults response={response} /> : null}
      {response.mode === "focus" ? <FocusResults response={response} /> : null}
      {response.mode === "plan" ? <PlanResults response={response} /> : null}
    </section>
  );
}

function CompareResults({ response }: { response: Extract<AssistantResponse, { mode: "compare" }> }) {
  return (
    <div className="result-section">
      <h2>Destination Comparison</h2>
      <p>{response.summary}</p>
      <div className="comparison-grid">
        {response.evaluations.map((evaluation) => (
          <DestinationCard evaluation={evaluation} key={evaluation.city} />
        ))}
      </div>
    </div>
  );
}

function FocusResults({ response }: { response: Extract<AssistantResponse, { mode: "focus" }> }) {
  return (
    <div className="result-section">
      <h2>Focused Results</h2>
      <p>{response.answer}</p>
      <div className="stack">
        {response.evaluations.map((evaluation) => (
          <DestinationCard evaluation={evaluation} key={evaluation.city} />
        ))}
      </div>
    </div>
  );
}

function PlanResults({ response }: { response: Extract<AssistantResponse, { mode: "plan" }> }) {
  return (
    <div className="result-section">
      <h2>Trip Plan Options</h2>
      <div className="plan-grid">
        {response.plans.map((plan) => (
          <article className="plan-card" key={plan.title}>
            <h3>{plan.title}</h3>
            <p>{plan.summary}</p>
            <InfoList title="Weather" items={plan.weatherHighlights} />
            <InfoList title="Lodging" items={plan.lodgingHighlights} />
            <InfoList title="Activities" items={plan.activityHighlights} />
            <InfoList title="Tradeoffs" items={plan.tradeoffs} />
          </article>
        ))}
      </div>
    </div>
  );
}

function DestinationCard({ evaluation }: { evaluation: DestinationEvaluation }) {
  const weather = useMemo(() => summarizeWeather(evaluation), [evaluation]);
  const lodging = useMemo(() => summarizeLodging(evaluation), [evaluation]);
  const activities = evaluation.thingsToDo?.activities.slice(0, 5) ?? [];

  return (
    <article className="destination-card">
      <h3>{evaluation.city}</h3>
      <InfoList title="Weather" items={weather} />
      <InfoList title="Lodging" items={lodging} />
      <div>
        <h4>Things To Do</h4>
        {activities.length ? (
          <ul>
            {activities.map((activity) => (
              <li key={activity.id}>
                {activity.name} <span>{activity.activityType}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No activity data returned.</p>
        )}
      </div>
      <Warnings evaluation={evaluation} />
    </article>
  );
}

function Trace({ response }: { response: AssistantResponse }) {
  return (
    <aside className="trace-panel">
      <h2>Trace</h2>
      <div className="trace-grid">
        <span>Mode</span>
        <strong>{response.mode}</strong>
        <span>NLP</span>
        <strong>{response.provider}</strong>
        <span>Cities</span>
        <strong>{response.intent.cities.join(", ")}</strong>
        <span>Dates</span>
        <strong>
          {response.intent.dateRange.startDate} to {response.intent.dateRange.endDate}
        </strong>
      </div>
      <div className="tool-calls">
        {response.trace.map((trace, index) => (
          <div className="tool-call" key={`${trace.tool}-${trace.city}-${index}`}>
            <span>{trace.tool}</span>
            <strong>{trace.city}</strong>
            {trace.warnings?.length ? <em>{trace.warnings.join(", ")}</em> : null}
          </div>
        ))}
      </div>
    </aside>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Warnings({ evaluation }: { evaluation: DestinationEvaluation }) {
  const warnings = [
    ...(evaluation.weather?.warnings ?? []),
    ...(evaluation.lodging?.warnings ?? []),
    ...(evaluation.thingsToDo?.warnings ?? []),
  ].filter((warning) => warning.code !== "PARTIAL_DATA");

  if (!warnings.length) {
    return null;
  }

  return (
    <div className="warnings">
      {warnings.map((warning) => (
        <span key={`${warning.code}-${warning.message}`}>{warning.code}</span>
      ))}
    </div>
  );
}

function summarizeWeather(evaluation: DestinationEvaluation): string[] {
  const forecasts = evaluation.weather?.forecasts ?? [];

  if (!forecasts.length) {
    return ["No weather data returned."];
  }

  const summaries = forecasts.slice(0, 2).map((forecast) => forecast.summary).filter(isString);
  return summaries.length ? summaries : [`${forecasts.length} forecast period(s) returned.`];
}

function summarizeLodging(evaluation: DestinationEvaluation): string[] {
  const options = evaluation.lodging?.lodgingOptions ?? [];

  if (!options.length) {
    return ["No lodging options returned."];
  }

  return options.slice(0, 3).map((option) => {
    const total = option.totalEstimatedCost ? `$${option.totalEstimatedCost}` : "total unknown";
    return `${option.name}: ${total}`;
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

function isString(value: unknown): value is string {
  return typeof value === "string";
}
