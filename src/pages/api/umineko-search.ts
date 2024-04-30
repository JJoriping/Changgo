import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import type { UminekoQuote, UminekoWord } from "@/utilities/db";
import { DB } from "@/utilities/db";
import { tokenizeJapanese } from "@/utilities/kuromoji";

const router = createRouter<NextApiRequest, NextApiResponse>();
const pageLength = 20;
const maxQuotes = 10;

router.get(async (req, res) => {
  let keyword = req.query['q']?.toString().trim();
  const page = parseInt(req.query['p']?.toString() || "0") || 0;
  const sql = [
    `
      SELECT
        w_id AS id,
        w_name AS name,
        w_part AS part,
        w_jlpt_rank AS jlptRank,
        w_meaning AS meaning,
        w_pronunciation AS pronunciation
      FROM umi_words
    `
  ];
  if(keyword){
    const tokens = await tokenizeJapanese(keyword);
    if(tokens.every(v => v.pronunciation)){
      keyword = tokens.map(v => v.pronunciation).join('');
    }
    sql.push("WHERE \
      MATCH(w_name) AGAINST(? IN BOOLEAN MODE) \
      OR MATCH(w_pronunciation) AGAINST(? IN BOOLEAN MODE) \
      OR MATCH(w_meaning) AGAINST(? IN BOOLEAN MODE)"
    );
  }
  sql.push(`LIMIT ${page * pageLength}, ${pageLength}`);

  const words = await DB(sql.join('\n'), [ keyword, keyword, keyword ]) as UminekoWord[];
  const wordsTable = words.reduce((pv, v) => {
    pv[v.id] = v;
    return pv;
  }, {} as Record<number, UminekoWord>);
  const quotes = words.length
    ? await DB(
      `
        SELECT
          q_text_ko AS textK,
          q_text_ja AS textJ,
          q_voice_url AS voiceURL,
          w_id AS wordId
        FROM umi_quotes Q
        JOIN umi_word_references R ON Q.q_id = R.q_id
        WHERE R.w_id IN (?)
        LIMIT 1000
      `
      , [
        words.map(v => v.id)
      ]
    ) as UminekoQuote[]
    : []
  ;
  for(const v of quotes){
    const word = wordsTable[v.wordId];

    word.quotes ??= [];
    if(word.quotes.some(w => w.textJ === v.textJ)) continue;
    word.quotes.push(v);
  }
  for(const v of words){
    v.quotes = v.quotes?.sort((a, b) => (a.voiceURL ? 0 : 1) - (b.voiceURL ? 0 : 1)).slice(0, maxQuotes);
  }
  res.send(words);
});
export default router.handler();