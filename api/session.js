let sessions = {};

export default function handler(req, res) {
  const { id } = req.query;

  if(req.method === "POST") {
    sessions[req.body.id] = { offer: req.body.offer };
    return res.json({ status:"stored" });
  }

  if(req.method === "PUT") {
    if(sessions[req.body.id])
      sessions[req.body.id].answer = req.body.answer;
    return res.json({ status:"answered" });
  }

  if(req.method === "GET") {
    return res.json(sessions[id] || {});
  }

  res.status(405).end();
}