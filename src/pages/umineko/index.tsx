import type { NextPage } from "next";
import { useSearchParams } from "next/navigation";
import type { MouseEventHandler } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { characterIdTable } from "./const";
import styles from "./index.module.scss";
import type { UminekoWord } from "@/utilities/db";
import C from "@/utilities/c";

const Umineko:NextPage = () => {
  const search = useSearchParams();
  const $audio = useRef<HTMLAudioElement>();

  const [ words, setWords ] = useState<UminekoWord[]>();
  const [ expandedWord, setExpandedWord ] = useState<number>();

  const handleQuoteClick = useCallback<MouseEventHandler<HTMLQuoteElement>>(e => {
    const { voice } = e.currentTarget.dataset;
    if(!voice) return;
    $audio.current?.pause();
    $audio.current = new Audio(voice);
    $audio.current.play();
  }, []);

  const keyword = search.get("q") || undefined;

  useEffect(() => {
    if(!keyword) return;
    fetch(`/api/umineko-search?q=${keyword}`).then(res => res.json()).then(setWords);
  }, [ keyword ]);

  return <>
    <header className={styles['header']}>
      <form action="/umineko">
        <input type="text" name="q" placeholder="검색어" defaultValue={keyword} />
      </form>
    </header>
    <main>
      <ol>
        {words?.map(v => {
          const expanded = v.id === expandedWord;
          const actualQuotes = expanded ? v.quotes : v.quotes?.slice(0, 3);

          return (
            <li key={v.id} className={styles['word']}>
              <div className={styles['title']}>
                {v.name}
                {v.name !== v.pronunciation && <i>[{v.pronunciation}]</i>}
                {Boolean(v.jlptRank) && <span>JLPT {v.jlptRank}</span>}
              </div>
              <pre>{v.meaning}</pre>
              {actualQuotes?.map((w, j) => {
                const voiceFolderId = w.voiceURL?.match(/voice\/(\d+)\//)?.[1];
                const characterId = voiceFolderId ? characterIdTable[voiceFolderId] : undefined;

                return (
                  <blockquote key={j} className={C(w.voiceURL && styles['clickable'])} data-voice={w.voiceURL} onClick={handleQuoteClick}>
                    {characterId ? <img src={characterId?.imageURL} /> : <div />}
                    <div className={styles['text-j']}>
                      {w.textJ}
                      {Boolean(w.voiceURL) && "🔊"}
                    </div>
                    <div className={styles['text-k']}>{w.textK}</div>
                  </blockquote>
                );
              })}
              {v.quotes && v.quotes.length > 3 && !expanded && (
                <button onClick={() => setExpandedWord(v.id)}>예문 더 보기</button>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  </>;
};
export default Umineko;