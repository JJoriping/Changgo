import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import rawData from "@/utilities/mp-data.json";

const router = createRouter<NextApiRequest, NextApiResponse>();
const data = Object.values(rawData);

router.get(async (req, res) => {
  res.send(data.filter(v => v.level_name === "8급"));
});
export default router.handler();