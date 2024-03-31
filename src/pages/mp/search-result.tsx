import type { FC } from "react";
import { useMemo } from "react";
import HanjaLinker from "./hanja-linker";
import styles from "./search-result.module.scss";
import JapaneseMeaningRenderer from "./japanese-meaning-renderer";
import VocabularyTreeRenderer from "./vocabulary-tree-renderer";
import gosa from "@/utilities/mp-gosa.json";
import type { Entity } from "@/utilities/mp-data.json";

type Props = {
  list: Entity[]
};
const SearchResult:FC<Props> = ({ list }) => {
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
              <td className={styles['related-letters']}>
                <VocabularyTreeRenderer data={v.synonyms} hanjaOnly flattened />
              </td>
              <th rowSpan={2} className={styles['letter']}>{v.letter}</th>
              <td className={styles['korean']}>{v.korean}</td>
              <th>일본</th>
              <td className={styles['other-language-letter']}>
                <a href={`https://ja.dict.naver.com/#/search?query=${encodeURIComponent(v.jp_letter)}&range=all`} target="_blank" rel="noreferrer">
                  {v.jp_letter}
                </a>
              </td>
              <td className={styles['other-language-sound']}>
                <JapaneseMeaningRenderer data={v.jp_sound} />
              </td>
              <td className={styles['other-language-meaning']}>
                <JapaneseMeaningRenderer data={v.jp_meaning} makingLink />
              </td>
            </tr>
            <tr>
              <th>반의</th>
              <td className={styles['related-letters']}>
                <VocabularyTreeRenderer data={v.antonyms} hanjaOnly flattened />
              </td>
              <td className={styles['stroke']}>
                <HanjaLinker>
                  {v.radical}
                </HanjaLinker>부&nbsp;{v.sub_stroke_count}획 ({v.total_stroke_count}획)
              </td>
              <th>중국</th>
              <td className={styles['other-language-letter']}>
                <a href={`https://zh.dict.naver.com/#/search?query=${encodeURIComponent(v.zh_letter)}&range=all`} target="_blank" rel="noreferrer">
                  {v.zh_letter}
                </a>
              </td>
              <td className={styles['other-language-sound']}>{v.zh_sound}</td>
              <td className={styles['other-language-meaning']}>{v.en_meaning}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}>
                <HanjaLinker>
                  {v.footnote}
                </HanjaLinker>
              </td>
              <td colSpan={6}>
                <VocabularyTreeRenderer data={v.resembles} flattened />
              </td>
            </tr>
            <tr>
              <td colSpan={8}>
                <VocabularyTreeRenderer data={v.words} />
              </td>
            </tr>
            <tr>
              <td colSpan={8}>
                {v.letter in gosas && <ul>
                  {gosas[v.letter].map((w, j) => (
                    <li key={j}><HanjaLinker>{w}</HanjaLinker></li>
                  ))}
                </ul>}
              </td>
            </tr>
          </tbody>
        </table>
      </li>
    ))}
  </ul>;
};
export default SearchResult;