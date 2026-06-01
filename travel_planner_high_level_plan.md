# Travel Planner Agentic Assistant Plan

## Summary

Build a web app assistant that can understand natural-language travel requests, call informational travel tools, and synthesize useful travel research results. The assistant must support three request modes:

- `compare`: compare multiple destinations/date windows.
- `focus`: answer a focused question about a destination/date range.
- `plan`: generate complete trip plan options.

The tool layer is now implemented with mocked Weather, Lodging, and Things To Do tools. These tools provide data only. They do not make recommendations, rank options, or decide what the traveler should do. The assistant orchestration and synthesis layer is responsible for interpreting tool outputs, handling partial data, comparing options, and presenting final user-facing responses.

Default implementation stack: React + TypeScript web app with TypeScript assistant/orchestration modules.

## Implemented Tool Layer

The current mocked tools live in `src/tools` and each has an agent-facing README:

- Weather: `src/tools/weather/README.md`
- Lodging: `src/tools/lodging/README.md`
- Things To Do: `src/tools/thingsToDo/README.md`

All three tools:

- use city-level location input
- cover the same 10 mock cities: Seattle, Lisbon, Austin, Chicago, Montreal, New York, San Francisco, Tokyo, Paris, and Barcelona
- cover the same mock date window: `2026-06-01` through `2026-07-31`
- return warnings instead of failing for unsupported cities, missing data, restrictive filters, or unavailable date ranges where possible
- allow partial output data, which the assistant must treat as unknown rather than false, zero, or negative

### Weather Tool

Function: `lookupMockWeather(input)`

Inputs:

- city
- start/end date
- optional time-of-day periods
- optional units

Outputs:

- forecast periods
- forecast basis, such as `forecast` or `historical_average`
- temperature, precipitation, cloudiness, wind, humidity, UV, visibility, sunrise/sunset, alerts, and summaries where available
- warnings for partial data, unsupported city, unavailable dates, or intraday downgrade

Important behavior:

- Intraday weather is only supported through `2026-06-08`.
- Later intraday requests are downgraded to `full_day`.
- Future dates use historical-average style mock data.

### Lodging Tool

Function: `lookupMockLodging(input)`

Inputs:

- city
- check-in/check-out dates
- optional guests
- optional luxury level
- optional nightly price range with currency
- optional lodging types
- optional amenities
- optional minimum star rating

Outputs:

- multiple lodging options
- nightly rates with currency
- total before taxes
- taxes/fees and total estimated cost where available
- amenities
- factual notes
- availability status
- warnings for partial data, unsupported city, unavailable dates, restrictive filters, or unsupported currency

Important behavior:

- Checkout date is not a billed night.
- Mock prices are USD.
- Missing taxes/fees or total estimated cost are valid partial data.

### Things To Do Tool

Function: `lookupMockThingsToDo(input)`

Inputs:

- city
- start/end date
- optional weather context
- optional interests
- optional activity types
- optional indoor/outdoor preference
- optional price range with currency

Outputs:

- events, landmarks, museums, parks, food activities, and local experiences
- activity date model: `scheduled`, `date_range`, `recurring`, or `general`
- price with currency where available
- duration
- indoor/outdoor classification
- interests
- weather suitability metadata
- factual notes
- warnings for partial data, unsupported city, unavailable dates, restrictive filters, or unsupported currency

Important behavior:

- Weather context is accepted but does not cause recommendations.
- Scheduled activities return only when they overlap the requested dates.
- General and recurring activities can return for any in-window city/date request.

## NLP And Request Understanding

Natural-language request parsing should use Anthropic Sonnet 4.5 when an Anthropic API key is available in the local `.env` file.

Expected environment behavior:

- Look for an Anthropic key in `.env`, for example `ANTHROPIC_API_KEY`.
- If the key exists, use Sonnet 4.5 to parse the user request into a structured `TravelRequestIntent`.
- If there is no `.env` file or no usable Anthropic key, use a deterministic mocked NLP parser.
- Never require real NLP for local tests; mocked NLP must remain available.

The NLP layer should output:

- request mode: `compare`, `focus`, or `plan`
- destination cities
- date ranges
- requested tool categories: weather, lodging, things to do
- lodging filters where present
- activity filters where present
- time-of-day requests for weather where present
- budget or price hints where present
- traveler preferences/interests
- missing information that may require a follow-up question

The parser should normalize fuzzy user language before tools are called. For example, tools should receive `YYYY-MM-DD` dates, not phrases like “next weekend” or “late June.”

## Mocked NLP Examples

The mocked NLP parser should include a handful of deterministic examples so the app works without Anthropic credentials.

### Multi-City Comparison

User request:

> I'm considering Lisbon, Seattle, Austin, Chicago, and Montreal from June 12 to June 16. Compare weather, lodging costs, and things to do.

Mock intent:

- mode: `compare`
- cities: Lisbon, Seattle, Austin, Chicago, Montreal
- date range: `2026-06-12` to `2026-06-16`
- requested tools: weather, lodging, things to do
- lodging filters: none
- activity filters: none

Expected assistant response:

- side-by-side destination comparison
- weather summary per city
- lodging price range/representative options per city
- notable activities per city
- clear handling of missing or partial data

### Focused Activities Request

User request:

> What is there to do in Seattle from June 10 to June 13?

Mock intent:

- mode: `focus`
- city: Seattle
- date range: `2026-06-10` to `2026-06-13`
- requested tools: things to do

Expected assistant response:

- direct activity-focused answer
- group activities by type or date model
- do not include lodging unless the user asks

### Full Trip Planning Request

User request:

> Plan a 4 day trip to Tokyo in July with food, art, and outdoor activities.

Mock intent:

- mode: `plan`
- city: Tokyo
- date range: `2026-07-10` to `2026-07-14`
- requested tools: weather, lodging, things to do
- interests: food, art, nature/local culture

Expected assistant response:

- 2-4 plan options
- each option should cite weather, lodging, and activity data used
- explain tradeoffs without pretending partial data is complete

### Lodging-Constrained Request

User request:

> Find upscale places to stay in Paris from July 5 to July 8 under $400 per night with breakfast.

Mock intent:

- mode: `focus`
- city: Paris
- date range: `2026-07-05` to `2026-07-08`
- requested tools: lodging
- lodging filters:
  - luxury level: upscale
  - max nightly rate: 400
  - amenities: breakfast

Expected assistant response:

- lodging-focused result
- include nightly prices and estimated totals where available
- mention when filters are restrictive or data is partial

## Assistant Orchestration

The orchestrator should:

- receive raw user text
- call the NLP parser, using Sonnet 4.5 or mocked NLP fallback
- determine which tools are needed
- call tools once per relevant city/date range/filter set
- keep tool calls informational and side-effect free
- collect warnings and partial data from each tool
- synthesize the final response according to request mode

Response modes:

- Compare mode: destination-by-destination comparison using only available data.
- Focus mode: direct answer for the requested category or city/date slice.
- Plan mode: multiple trip plan options assembled from the tool outputs.

The assistant should include a compact development trace in the UI showing:

- parsed intent
- tools called
- cities/date ranges used
- warnings returned by tools
- whether NLP used Sonnet 4.5 or mocked fallback

## Public Types And Interfaces

Add shared assistant-layer types:

- `TravelRequestMode`: `compare | focus | plan`
- `TravelRequestIntent`: structured parsed request from NLP
- `TravelTool<Input, Output>`: common interface for current and future tools
- `ToolResult`: standardized success/error wrapper
- `DestinationEvaluation`: per-destination aggregation of weather, lodging, and activities
- `TravelPlanOption`: synthesized itinerary-style option
- `AssistantResponse`: discriminated response for comparison, focused answer, or plan options
- `NlpProvider`: interface implemented by `AnthropicNlpProvider` and `MockNlpProvider`

Tool-specific schemas remain owned by each tool directory and documented in each tool README.

## Web App Experience

- First screen is the planner/research assistant interface, not a marketing landing page.
- User enters a natural-language request in a large input area.
- UI shows loading/progress by destination and tool category.
- Results render according to response mode:
  - Compare mode: side-by-side destination cards or table.
  - Focus mode: direct answer with supporting details.
  - Plan mode: 2-4 detailed plan options.
- Show a compact development trace for parsed intent, tool calls, warnings, and NLP provider.
- Clearly surface uncertainty or missing data without treating it as a hard failure.

## Test Plan

- Unit test mocked NLP examples:
  - multi-city comparison
  - focused things-to-do request
  - full trip planning request
  - lodging-constrained request
- Unit test NLP provider selection:
  - uses Anthropic provider when `.env` contains a usable key
  - falls back to mocked NLP when no key is available
- Keep existing tool tests for:
  - Weather
  - Lodging
  - Things To Do
- Unit test orchestrator behavior:
  - calls only requested/needed tools
  - supports multiple destinations
  - handles multiple date windows where present
  - propagates tool warnings
  - tolerates partial tool output
  - returns the correct response variant
- UI tests:
  - comparison request renders multiple destination evaluations
  - focused request renders a direct answer
  - planning request renders multiple plan options
  - loading and error states appear correctly
  - mocked NLP fallback is visible in the development trace

## Assumptions

- First version is a web app.
- Use React + TypeScript unless changed later.
- Use Sonnet 4.5 for real NLP parsing when `ANTHROPIC_API_KEY` is available in `.env`.
- Use mocked NLP parsing when `.env` or the Anthropic key is unavailable.
- Tool calls remain mocked for now.
- Cost data currently comes from Lodging only.
- Tool data is informational. The assistant decides how to compare, summarize, and plan.
- Future tools should be addable through the shared tool interface without rewriting the assistant flow.
