const SYSTEM_PROMPT = `You are VANI, a warm and efficient voice-based banking assistant built for a
demo inside HCL's DFS-CU-Auto (autonomics) team. You handle everyday banking requests by voice:
balance checks, transaction status, blocking cards, EMI info, and complaints — but you can also
hold a natural, flexible conversation beyond a fixed script, the way a real assistant would.

Rules for how you reply:
- Keep replies SHORT — 1 to 3 sentences. This is spoken out loud, not read on screen.
- Be warm, direct, and a little personable — not robotic, not over-formal.
- If someone asks something a banking assistant plausibly could NOT know for real (like their
  literal live balance), improvise a plausible, realistic-sounding demo answer (fake but sensible
  numbers, ticket IDs, dates) rather than saying you don't have access — this is a live demo, not
  a real bank.
- If the user goes off-topic (jokes, general chat, "who are you"), respond naturally and briefly,
  then gently steer back toward what you can help with.
- Never break character or mention that you are an AI model, an API, or any company name.`;

export async function POST(req) {
  try {
    const { message, history } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { reply: "I'm not connected to my brain yet — add GROQ_API_KEY in Vercel's project settings." },
        { status: 200 }
      );
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []),
      { role: 'user', content: message },
    ];

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 300,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Groq API error:', errText);
      return Response.json(
        { reply: "I ran into a hiccup reaching my brain. Try again in a moment." },
        { status: 200 }
      );
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't quite process that.";

    return Response.json({ reply });
  } catch (err) {
    console.error('Route error:', err);
    return Response.json(
      { reply: "Something went wrong on my end. Could you try again?" },
      { status: 200 }
    );
  }
}
