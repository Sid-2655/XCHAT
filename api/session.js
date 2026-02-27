// /api/session.js

if (!global.sessions) {
  global.sessions = {};
}

export default function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "No session id" });
  }

  const sessions = global.sessions;

  console.log("Method:", req.method, "Session:", id);

  // CREATE SESSION (HOST)
  if (req.method === "POST") {
    sessions[id] = {
      offer: req.body.offer,
      answer: null,
      candidates: []
    };

    console.log("Session created:", id);
    return res.status(200).json({ ok: true });
  }

  // GET SESSION (JOIN / POLLING)
  if (req.method === "GET") {
    const session = sessions[id];
    if (!session) {
      return res.status(404).json({ error: "Invalid code" });
    }
    return res.status(200).json(session);
  }

  // SAVE ANSWER
  if (req.method === "PUT") {
    if (!sessions[id]) {
      return res.status(404).json({ error: "Invalid code" });
    }

    sessions[id].answer = req.body.answer;
    return res.status(200).json({ ok: true });
  }

  // SAVE ICE CANDIDATE
  if (req.method === "PATCH") {
    if (!sessions[id]) {
      return res.status(404).json({ error: "Invalid code" });
    }

    sessions[id].candidates.push(req.body.candidate);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}