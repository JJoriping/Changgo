import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(async (req, res) => {
  const text = await fetch("https://sakura-paris.org/dict/?api=2&type=4", {
    method: "POST",
    body: req.body
  }).then(r => r.text());

  res.send(text);
});
export default router.handler();