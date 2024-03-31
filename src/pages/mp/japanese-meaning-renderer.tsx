import type { FC } from "react";
import { memo, useMemo } from "react";
import styles from "./japanese-meaning-renderer.module.scss";

type Props = {
  'data': string,
  'makingLink'?: boolean
};
const JapaneseMeaningRenderer:FC<Props> = ({ data, makingLink }) => {
  const meanings = useMemo(() => {
    const R = {
      common: [] as string[],
      subcommon: [] as string[],
      uncommon: [] as string[]
    };
    const commonChunk = data.match(/^([^〈（]+?)(?:[,、][〈（]|$)/);
    const subcommonChunk = data.match(/（(.+)）/);
    const uncommonChunk = data.match(/〈(.+)〉/);

    if(commonChunk) R.common = commonChunk[1].replaceAll("ー", "").split(/[,、]/);
    if(subcommonChunk) R.subcommon = subcommonChunk[1].replaceAll("ー", "").split(/[,、]/);
    if(uncommonChunk) R.uncommon = uncommonChunk[1].replaceAll("ー", "").split(/[,、]/);

    return R;
  }, [ data ]);

  return <div className={styles['list']}>
    <div className={styles['common']}>
      {meanings.common.map(v => makingLink
        ? <a key={v} href={`https://ja.dict.naver.com/#/search?query=${encodeURIComponent(v)}&range=all`} target="_blank" rel="noreferrer">
          {v}
        </a>
        : <label key={v}>{v}</label>
      )}
    </div>
    {meanings.subcommon.length > 0 && <div className={styles['subcommon']}>
      {meanings.subcommon.map(v => makingLink
        ? <a key={v} href={`https://ja.dict.naver.com/#/search?query=${encodeURIComponent(v)}&range=all`} target="_blank" rel="noreferrer">
          {v}
        </a>
        : <label key={v}>{v}</label>
      )}
    </div>}
    {meanings.uncommon.length > 0 && <div className={styles['uncommon']}>
      {meanings.uncommon.map(v => makingLink
        ? <a key={v} href={`https://ja.dict.naver.com/#/search?query=${encodeURIComponent(v)}&range=all`} target="_blank" rel="noreferrer">
          {v}
        </a>
        : <label key={v}>{v}</label>
      )}
    </div>}
  </div>;
};
export default memo(JapaneseMeaningRenderer);