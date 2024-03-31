import type { GetServerSideProps, NextPage } from "next";
import { useMemo } from "react";
import styles from "./index.module.scss";
import VocabularyTreeRenderer from "./vocabulary-tree-renderer";
import type { Entity } from "@/utilities/mp-data.json";
import gosa from "@/utilities/mp-gosa.json";

type Props = {
  list: Entity[]
};
const MP:NextPage<Props> = ({ list }) => {
  const gosas = useMemo(() => {
    const R:Record<string, string[]> = {};

    for(const [ k, v ] of Object.entries(gosa)){
      for(let j = 0; j < k.length; j++){
        const key = k[j];
        R[key] ??= [];
        R[key].push(`${k}: ${v}`);
      }
    }
    return R;
  }, []);

  return <ul className={styles['list']}>
    {list.map(v => (
      <li key={v.letter}>
        <table>
          <thead>
            <tr>
              <th>동의</th>
              <td>
                <VocabularyTreeRenderer data={v.synonyms} />
              </td>
              <th rowSpan={2}>{v.letter}</th>
              <td>{v.korean}</td>
              <th>일본</th>
              <td>{v.jp_letter}</td>
              <td>{v.jp_sound}</td>
            </tr>
            <tr>
              <th>반의</th>
              <td>
                <VocabularyTreeRenderer data={v.antonyms} />
              </td>
              <td>{v.radical}부 {v.sub_stroke_count}획 ({v.total_stroke_count}획)</td>
              <th>중국</th>
              <td>{v.zh_letter}</td>
              <td>{v.zh_sound}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>{v.footnote}</td>
              <td colSpan={5}>
                <VocabularyTreeRenderer data={v.resembles} />
              </td>
            </tr>
            <tr>
              <td colSpan={7}>
                <VocabularyTreeRenderer data={v.words} />
              </td>
            </tr>
            <tr>
              <td colSpan={7}>
                <ul>
                  {gosas[v.letter]?.map((w, j) => (
                    <li key={j}>{w}</li>
                  ))}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </li>
    ))}
  </ul>;
};
export default MP;
export const getServerSideProps:GetServerSideProps<Props> = async () => ({
  props: {
    list: await fetch("http://localhost:3000/api/mp-search").then(res => res.json())
  }
});