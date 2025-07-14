export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { prompt } = req.body;

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/CompVis/stable-diffusion-v1-4", {
      method: "POST",
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: "HuggingFace error: " + errorText });
    }

    const imageBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(imageBuffer));
  } catch (error) {
    res.status(500).json({ error: "Server error: " + error.message });
  }
}
