export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { to, subject, html } = req.body;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "DirectDeed <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}