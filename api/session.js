global.sessions = global.sessions || {};

export default function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "No session id" });
  }

  if (!global.sessions[id]) {
    global.sessions[id] = {
      offer: null,
      answer: null,
      candidates: []
    };
  }

  const session = global.sessions[id];

  if (req.method === "POST") {
    session.offer = req.body.offer;
    return res.status(200).json({ ok: true });
  }

  if (req.method === "PUT") {
    session.answer = req.body.answer;
    return res.status(200).json({ ok: true });
  }

  if (req.method === "PATCH") {
    session.candidates.push(req.body.candidate);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    return res.status(200).json(session);
  }

  if (req.method === "DELETE") {
    delete global.sessions[id];
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
