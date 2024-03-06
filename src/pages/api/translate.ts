import { translate } from "bing-translate-api";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post(async (req, res) => {
  const result = await translate(req.body, "ja", "ko");

  res.send(result?.translation);
});
export default router.handler();