// Netlify serverless function — proxies the companion's requests to Anthropic.
// The API key lives here as an environment variable, never in the browser.
// Route: the netlify.toml redirect maps /api/chat -> /.netlify/functions/chat

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }) };
  }

  try {
    const { system, messages, max_tokens } = JSON.parse(event.body || "{}");

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: max_tokens || 1000,
        system: system,
        messages: messages
      })
    });

    const data = await resp.json();

    return {
      statusCode: resp.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
