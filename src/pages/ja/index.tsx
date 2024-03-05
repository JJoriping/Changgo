import type { GetServerSideProps, NextPage } from "next";
import WordCard from "./WordCard";
import type { SakuraParis } from "@/types/external";

type Props = {
  'query'?: string,
  'result': SakuraParis.SearchResult
};
const Ja:NextPage<Props> = ({ query, result }) => {
  console.log(result);

  return <>
    <header>
      <form action="/ja">
        <label>
          검색어: <input type="text" name="q" defaultValue={query} autoFocus />
        </label>
        <button type="submit">검색</button>
      </form>
    </header>
    <main>
      <ol>
        {result.words.map((v, i) => (
          <li key={i}>
            <WordCard data={v} />
          </li>
        ))}
      </ol>
    </main>
  </>;
};
export default Ja;
export const getServerSideProps:GetServerSideProps<Props> = async context => {
  const { q } = context.query;
  if(typeof q !== "string"){
    return { notFound: true };
  }
  const result = await fetch(`https://sakura-paris.org/dict/?api=1&dict=大辞林&q=${encodeURIComponent(q)}&type=2`).then(res => res.json());

  return { props: { query: q, result } };
};