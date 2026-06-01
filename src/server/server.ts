import { createServer, type IncomingMessage } from "node:http";
import { runTravelAssistant } from "../assistant/orchestrator.js";

const PORT = Number(process.env.PORT ?? 8787);

const server = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5173");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/plan") {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  try {
    const body = await readJsonBody(request);
    const userRequest = typeof body.request === "string" ? body.request : "";

    if (!userRequest.trim()) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Request text is required." }));
      return;
    }

    const assistantResponse = await runTravelAssistant(userRequest);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(assistantResponse));
  } catch (error) {
    response.writeHead(500, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected server error.",
      }),
    );
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Travel planner API listening on http://127.0.0.1:${PORT}`);
});

async function readJsonBody(request: IncomingMessage): Promise<{ request?: unknown }> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
}
