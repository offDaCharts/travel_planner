# Travel Planner Agentic Assistant Outline

## Summary

Build a web app assistant that handles three travel request modes: comparing multiple destinations, answering focused questions about a place/date, and generating trip plan options. The initial tools remain limited to mocked weather, places to stay, and things to do; cost information will come from lodging data only for now.

Default stack assumption: React + TypeScript, with mocked services behind replaceable interfaces.

## Core Request Modes

### Compare

User provides multiple cities and dates, and the assistant returns side-by-side destination options.

Example: "I'm considering Lisbon, Seattle, Austin, Chicago, and Montreal in late October. Compare weather, lodging costs, and things to do."

### Focus

User asks about one slice of travel information for a destination.

Example: "What is there to do in Seattle on these dates?"

### Plan

User asks for complete travel plan options.

Example: "Plan a relaxing 4-day trip to Seattle in October with good food and museums."

## Key Architecture

- Add a mocked NLP/request-understanding layer that returns:
  - request mode: `compare`, `focus`, or `plan`
  - destinations
  - dates or date ranges
  - trip length, if present
  - interests, constraints, and budget hints
  - requested info categories
- Add an assistant orchestrator that:
  - chooses tool calls based on request mode and requested categories
  - supports multiple destinations and multiple date windows
  - aggregates results by destination/date
  - produces the correct response shape for comparison, focused answer, or full plan
- Define a reusable tool contract:
  - name
  - description
  - input schema
  - output schema
  - `execute(input)`
- Implement three mocked tools:
  - Weather lookup
  - Places to stay lookup, including lodging price ranges
  - Things to do lookup
- Keep tool interfaces stable enough that real APIs can later replace mocks without changing the orchestration contract.

## Public Types And Interfaces

- `TravelRequestIntent`: normalized request details from mocked NLP.
- `TravelRequestMode`: `compare | focus | plan`.
- `TravelTool<Input, Output>`: shared interface for current and future tools.
- `ToolResult`: standardized success/error wrapper.
- `DestinationEvaluation`: per-destination/date weather, lodging, and activity summary.
- `TravelPlanOption`: full proposed itinerary-style option.
- `AssistantResponse`: discriminated response for comparison tables, focused answers, or plan options.

## Web App Experience

- First screen is the planner/research assistant interface.
- User enters a natural language request in a large input area.
- UI shows loading/progress by destination and tool category.
- Results render according to response mode:
  - Compare mode: side-by-side destination cards or table.
  - Focus mode: direct answer with supporting details.
  - Plan mode: 2-4 detailed plan options.
- Show a compact development trace listing parsed mode, destinations, dates, and mocked tools used.

## Test Plan

- Unit test mocked NLP for:
  - multi-city comparison requests
  - focused destination/date questions
  - full trip planning requests
- Unit test each mocked tool's input/output shape.
- Unit test orchestrator behavior:
  - calls tools once per destination/date where needed
  - supports multiple destinations
  - handles missing dates gracefully
  - returns the correct response variant
  - continues with partial results if one mocked tool fails
- UI test:
  - comparison request renders multiple destination evaluations
  - focused request renders a direct answer
  - planning request renders multiple plan options
  - loading and error states appear correctly

## Assumptions

- First version is a web app.
- Use React + TypeScript unless changed later.
- Cost data means lodging price ranges from the places-to-stay tool only.
- Weather, lodging, activities, NLP parsing, and response synthesis are mocked.
- Future tools should be addable through the shared tool interface without rewriting the assistant flow.
