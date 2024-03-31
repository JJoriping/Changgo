import type { FC, ReactNode } from "react";
import { useMemo, memo } from "react";

type Props = {
  children: string
};
const HanjaLinker:FC<Props> = ({ children }) => {
  const $body = useMemo(() => {
    const R:ReactNode[] = [];
    const hanjaPattern = /\p{Script=Han}+/ug;
    let chunk:RegExpExecArray|null;
    let prevIndex = 0;

    while(chunk = hanjaPattern.exec(children)){
      R.push(
        children.slice(prevIndex, chunk.index),
        <a key={R.length} href={`https://hanja.dict.naver.com/#/search?query=${encodeURIComponent(chunk[0])}&range=all`}>{chunk[0]}</a>
      );
      prevIndex = chunk.index + chunk[0].length;
    }
    if(prevIndex < children.length){
      R.push(children.slice(prevIndex));
    }
    return R;
  }, [ children ]);

  return $body;
};
export default memo(HanjaLinker);