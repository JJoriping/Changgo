import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import type { Entity, VocabularyTree } from "@/utilities/mp-data.json";
import rawData from "@/utilities/mp-data.json";

const router = createRouter<NextApiRequest, NextApiResponse>();
const data = Object.values(rawData);
const levelTable:Record<string, number> = {};

{
  for(const v of data){
    levelTable[v.letter] = v.level;
  }
}
router.get(async (req, res) => {
  const list:Entity[] = data.filter(v => v.level_name === "8급");

  for(const v of list){
    filterUncommonRelatedLetters(v);
  }
  res.send(list);

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