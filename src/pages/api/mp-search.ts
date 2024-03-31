import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import type { Entity, VocabularyTree } from "@/utilities/mp-data.json";
import rawData from "@/utilities/mp-data.json";
import rawGosa from "@/utilities/mp-gosa.json";

const router = createRouter<NextApiRequest, NextApiResponse>();
const pageLength = 20;

const data = Object.values(rawData);
const levelTable:Record<string, number> = {};
const gosaTable:Record<string, Record<string, string>> = {};

{
  for(const v of data){
    levelTable[v.letter] = v.level;
  }
  for(const [ k, v ] of Object.entries(rawGosa)){
    for(let j = 0; j < k.length; j++){
      const key = k[j];
      gosaTable[key] ??= {};
      gosaTable[key][k] = v;
    }
  }
}
router.get(async (req, res) => {
  const condition:{
    'q'?: string,
    'level'?: number,
    'p': number
  } = {
    level: -1,
    p: 0
  };
  if(req.query['q']) condition.q = String(req.query['q']);
  if(typeof req.query['level'] === "string") condition.level = parseInt(req.query['level']);
  if(typeof req.query['p'] === "string") condition.p = parseInt(req.query['p']);
  const list:Entity[] = data.filter(v => {
    if(condition.q){
      let ok = false;

      if(v.letter === condition.q) ok = true;
      else if(v.korean.includes(condition.q)) ok = true;
      else if(v.letter in gosaTable && JSON.stringify(gosaTable[v.letter]).includes(condition.q)) ok = true;
      else if(JSON.stringify(v.words).includes(condition.q)) ok = true;

      if(!ok) return false;
    }
    if('level' in condition && condition.level !== -1){
      if(v.level !== condition.level) return false;
    }
    return true;
  });

  if(condition.q?.length === 1){
    list.sort((a, b) => Math.abs(a.letter.localeCompare(condition.q!)) - Math.abs(b.letter.localeCompare(condition.q!)));
  }
  for(const v of list){
    v.gosa = gosaTable[v.letter];
    filterUncommonRelatedLetters(v);
  }
  res.send({
    list: list.slice(pageLength * condition.p, pageLength * (condition.p + 1)),
    count: list.length,
    pageCount: Math.ceil(list.length / pageLength)
  });

  function filterUncommonRelatedLetters(entity:Entity):void{
    entity.synonyms = getFilteredTree(entity.synonyms);
    entity.antonyms = getFilteredTree(entity.antonyms);
    entity.resembles = getFilteredTree(entity.resembles);

    function getFilteredTree(tree:VocabularyTree):VocabularyTree{
      const R:VocabularyTree = [];

      for(const v of tree){
        // 8급: 0, 1급: 12
        if(typeof v === "string"){
          if(levelTable[v[0]] <= 12) R.push(v);
          continue;
        }
        if(Array.isArray(v)){
          R.push(v.filter(w => levelTable[w[0]] <= 12));
          continue;
        }
        const r:Record<string, VocabularyTree> = {};
        for(const l in v){
          r[l] = getFilteredTree(v[l]);
        }
        R.push(r);
      }
      return R;
    }
  }
});
export default router.handler();