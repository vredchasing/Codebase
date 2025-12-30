export const localAgentModel = {
  async complete({
    system,
    prompt, 
    maxTokens = 256,
    temperature = 0.2,
    model = "qwen2.5-coder:7b"
  }) {
    const res = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt }
        ],
        options: { temperature, num_predict: maxTokens }
      })
    });

    const text = await res.text(); // read as plain text first
    if (!res.ok) throw new Error(`LLM error: ${text}`);

    try {
      const json = JSON.parse(text);
      return json.message?.content?.trim() ?? text.trim();
    } catch {
      // fallback to raw text if JSON parsing fails
      return text.trim();
    }
  }
};
