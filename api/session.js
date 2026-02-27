// /api/session.js

let sessions = global.sessions || {};
global.sessions = sessions;

export default function handler(req, res) {
  const { method } = req;

  if (method === "POST") {
    const { id, offer } = req.body;
    sessions[id] = {
      offer,
      answer: null,
      hostCandidates: [],
      joinCandidates: []
    };
    return res.status(200).json({ ok: true });
  }

  if (method === "PUT") {
    const { id, answer } = req.body;
    if (!sessions[id]) return res.status(404).json({ error: "No session" });

    sessions[id].answer = answer;
    return res.status(200).json({ ok: true });
  }

  if (method === "PATCH") {
    const { id, candidate, role } = req.body;
    if (!sessions[id]) return res.status(404).json({ error: "No session" });

    if (role === "host") {
      sessions[id].hostCandidates.push(candidate);
    } else {
      sessions[id].joinCandidates.push(candidate);
    }

    return res.status(200).json({ ok: true });
  }

  if (method === "GET") {
    const { id } = req.query;
    if (!sessions[id]) return res.status(404).json({ error: "No session" });

    return res.status(200).json(sessions[id]);
  }

  return res.status(405).end();
}