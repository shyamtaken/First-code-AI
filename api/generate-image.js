export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const prompt = req.body.prompt;
  if (!prompt) return res.status(400).json({ error: "No prompt provided" });

  const HF_TOKEN = process.env.HF_TOKEN; // 🔒 Use env variable

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Hugging Face API Error:", errorText);
      return res.status(500).send("❌ Image generation failed.");
    }

    const imageBuffer = await response.arrayBuffer();

    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(imageBuffer));
  } catch (err) {
    console.error("❌ Unexpected Error:", err);
    res.status(500).send("❌ Error generating image.");
  }
}
