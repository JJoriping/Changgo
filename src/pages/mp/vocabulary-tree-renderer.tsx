import type { FC } from "react";
import { Fragment, memo } from "react";
import type { VocabularyTree } from "@/utilities/mp-data.json";

type Props = {
  data: VocabularyTree
};
const VocabularyTreeRenderer:FC<Props> = ({ data }) => <ul>
  {data.map((v, i) => {
    if(typeof v === "string"){
      return <li key={i}>{v}</li>;
    }
    if(Array.isArray(v)){
      return <li key={i}>{v.join(', ')}</li>;
    }
    return Object.entries(v).map(([ l, w ]) => (
      <Fragment key={l}>
        <li>{l}</li>
        <ul>
          <VocabularyTreeRenderer data={w.flat()} />
        </ul>
      </Fragment>
    ));
  })}
</ul>;
export default memo(VocabularyTreeRenderer);