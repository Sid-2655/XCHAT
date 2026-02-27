// /api/session.js

let sessions = global.sessions || {};
global.sessions = sessions;

export default async function handler(req, res) {
  const { method } = req;

  if (method === "POST") {
    const { id, offer } = req.body;
    if (!id || !offer) {
      return res.status(400).json({ error: "Missing id or offer" });
    }

    sessions[id] = { offer, answer: null };
    return res.status(200).json({ success: true });
  }

  if (method === "PUT") {
    const { id, answer } = req.body;
    if (!sessions[id]) {
      return res.status(404).json({ error: "Session not found" });
    }

    sessions[id].answer = answer;
    return res.status(200).json({ success: true });
  }

  if (method === "GET") {
    const { id } = req.query;
    if (!sessions[id]) {
      return res.status(404).json({ error: "Session not found" });
    }

    return res.status(200).json(sessions[id]);
  }

  return res.status(405).json({ error: "Method not allowed" });
}