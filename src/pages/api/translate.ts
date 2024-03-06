import { translate } from "google-translate-api-browser";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(async (req, res) => {
  const result = await translate(req.body, { from: "ja", to: "ko" });

  res.send(result['text']);
});
export default router.handler();