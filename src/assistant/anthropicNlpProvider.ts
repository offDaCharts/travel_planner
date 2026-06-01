import type { NlpProvider, TravelRequestIntent } from "./types.js";

const MODEL = "claude-sonnet-4-5";

export class AnthropicNlpProvider implements NlpProvider {
  name = "anthropic-sonnet-4.5" as const;

  constructor(private readonly apiKey: string) {}

  async parse(request: string): Promise<TravelRequestIntent> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? MODEL,
        max_tokens: 1200,
        temperature: 0,
        system:
          "You parse travel planner requests into strict JSON only. Use supported cities only when present: Seattle, Lisbon, Austin, Chicago, Montreal, New York, San Francisco, Tokyo, Paris, Barcelona. Normalize dates to the 2026-06-01 through 2026-07-31 mock data window when the user gives June or July dates. Return no prose.",
        messages: [
          {
            role: "user",
            content: buildPrompt(request),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic NLP request failed with ${response.status}`);
    }

    const data = (await response.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text = data.content?.find((part) => part.type === "text")?.text;

    if (!text) {
      throw new Error("Anthropic NLP response did not include text content.");
    }

    return JSON.parse(extractJson(text)) as TravelRequestIntent;
  }
}

function buildPrompt(request: string): string {
  return `Parse this request into the JSON shape below.

Request:
${request}

JSON shape:
{
  "mode": "compare" | "focus" | "plan",
  "cities": ["Seattle"],
  "dateRange": { "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" },
  "requestedTools": ["weather" | "lodging" | "thingsToDo"],
  "interests": ["food"],
  "weatherInput": { "timeOfDay": ["full_day" | "morning" | "afternoon" | "evening" | "night"] },
  "lodgingInput": {
    "guests": { "adults": 2, "children": 0, "rooms": 1 },
    "luxuryLevel": "budget" | "standard" | "upscale" | "luxury" | "any",
    "priceRange": { "minNightlyRate": 0, "maxNightlyRate": 400, "currency": "USD" },
    "lodgingTypes": ["hotel" | "boutique_hotel" | "apartment" | "hostel" | "resort"],
    "amenities": ["wifi" | "breakfast" | "parking" | "pool" | "gym" | "kitchen" | "pet_friendly" | "accessible"],
    "starRatingMin": 4
  },
  "thingsToDoInput": {
    "interests": ["food" | "history" | "art" | "music" | "nature" | "architecture" | "sports" | "shopping" | "nightlife" | "family" | "wellness" | "local_culture"],
    "activityTypes": ["event" | "museum" | "landmark" | "tour" | "restaurant" | "nightlife" | "park" | "outdoor_activity" | "shopping" | "performing_arts" | "sports" | "family_activity" | "local_experience"],
    "indoorOutdoorPreference": "indoor" | "outdoor" | "mixed" | "unknown" | "any",
    "priceRange": { "minPrice": 0, "maxPrice": 40, "currency": "USD" }
  },
  "missingInfo": [],
  "rawRequest": ${JSON.stringify(request)}
}

Omit optional nested fields when not present.`;
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced?.[1]?.trim() ?? trimmed;
}
