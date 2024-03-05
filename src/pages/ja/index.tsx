import type { GetServerSideProps, NextPage } from "next";
import WordCard from "./WordCard";
import styles from "./index.module.scss";
import { SakuraParis } from "@/types/external";

type Props = {
  'query'?: string,
  'words': SakuraParis.Word[]|null
};
const Ja:NextPage<Props> = ({ query, words }) => <>
  <header>
    <form action="/ja">
      <label>
          검색어: <input type="text" name="q" defaultValue={query} autoFocus />
      </label>
      <button type="submit">검색</button>
    </form>
  </header>
  <main>
    {words === null
      ? <pre className="notice">검색어를 입력해 보세요.</pre>
      : words.length
      ? <ol className={styles['list']}>
        {words.map((v, i) => (
          <li key={i}>
            <WordCard data={v} />
          </li>
        ))}
      </ol>
      : <pre className="notice">검색 결과 없음</pre>
    }
  </main>
</>;
export default Ja;
export const getServerSideProps:GetServerSideProps<Props> = async context => {
  const { q } = context.query;
  if(typeof q !== "string"){
    return { props: { words: null } };
  }
  const words:SakuraParis.Word[] = [];
  const done:Record<string, true> = {};

  for(const [ k, v ] of Object.entries(SakuraParis.dictionaries)){
    if(typeof v === "object" && done[v.extends]){
      continue;
    }
    const result:SakuraParis.SearchResult = await fetch(`https://sakura-paris.org/dict/?api=1&dict=${
      SakuraParis.getDictionaryName(k as SakuraParis.DictionaryName)
    }&q=${encodeURIComponent(q)}&type=2`).then(res => res.json());
    if(Array.isArray(result)){
      continue;
    }
    done[k] = true;
    result.words = result.words.filter(w => !w.heading.includes("（和英）") && !w.heading.includes("（英和）"));
    for(const w of result.words){
      w.from = k as SakuraParis.DictionaryName;
    }
    words.push(...result.words);
  }
  return { props: { query: q, words } };
};