import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.get(async (req, res) => {
  const { name, file } = req.query;
  const buffer = await fetch(`https://sakura-paris.org/dict/${name}/binary/${file}`).then(r => r.arrayBuffer());

  res.write(Buffer.from(buffer));
  res.end();
});
export default router.handler();