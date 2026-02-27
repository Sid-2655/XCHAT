let sessions = {};

export default function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "No session id" });
  }

  if (!sessions[id]) {
    sessions[id] = {
      offer: null,
      answer: null,
      candidates: []
    };
  }

  if (req.method === "POST") {
    sessions[id].offer = req.body.offer;
    return res.status(200).json({ ok: true });
  }

  if (req.method === "PUT") {
    sessions[id].answer = req.body.answer;
    return res.status(200).json({ ok: true });
  }

  if (req.method === "PATCH") {
    sessions[id].candidates.push(req.body.candidate);
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    return res.status(200).json(sessions[id]);
  }

  if (req.method === "DELETE") {
    delete sessions[id];
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
