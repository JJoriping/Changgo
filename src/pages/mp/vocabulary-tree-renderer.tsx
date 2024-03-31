import type { FC } from "react";
import { Fragment, memo } from "react";
import styles from "./vocabulary-tree-renderer.module.scss";
import HanjaLinker from "./hanja-linker";
import type { VocabularyTree } from "@/utilities/mp-data.json";
import C from "@/utilities/c";

type Props = {
  'data': VocabularyTree,
  'flattened'?: boolean,
  'hanjaOnly'?: boolean
};
const VocabularyTreeRenderer:FC<Props> = ({ data, flattened, hanjaOnly }) => {
  if(!data.length){
    return null;
  }
  return <ul className={C(styles['list'], flattened && styles['flattened'])}>
    {data.map((v, i) => {
      if(typeof v === "string"){
        if(hanjaOnly){
          return <li key={i}>
            <HanjaLinker>
              {v.replace(/\(\S+?\s(.+?)\)/g, "($1)")}
            </HanjaLinker>
          </li>;
        }
        return <li key={i}>
          <HanjaLinker>
            {v}
          </HanjaLinker>
        </li>;
      }
      if(Array.isArray(v)){
        return <li key={i}>
          <HanjaLinker>
            {v.join(', ')}
          </HanjaLinker>
        </li>;
      }
      if(flattened){
        return Object.entries(v).map(([ l, w ]) => (
          <li key={l} className={styles['flattened-child']}>
            <HanjaLinker>{l}</HanjaLinker>:
            <VocabularyTreeRenderer data={w.flat()} flattened={flattened} hanjaOnly={hanjaOnly} />
          </li>
        ));
      }
      return Object.entries(v).map(([ l, w ]) => (
        <Fragment key={l}>
          <li><HanjaLinker>{l}</HanjaLinker></li>
          <VocabularyTreeRenderer data={w.flat()} flattened={flattened} hanjaOnly={hanjaOnly} />
        </Fragment>
      ));
    })}
  </ul>;
};
export default memo(VocabularyTreeRenderer);