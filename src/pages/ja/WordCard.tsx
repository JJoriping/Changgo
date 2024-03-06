import type { FC, ReactNode } from "react";
import { memo, useMemo, useState } from "react";
import styles from "./WordCard.module.scss";
import { SakuraParis } from "@/types/external";
import type { ComponentFactoryProps } from "@/utilities/component-factory";
import ComponentFactory from "@/utilities/component-factory";

const tagPattern = /\[[\w/]+?]/g;
const keywordPattern = /\[keyword].+?\[\/keyword]/g;
const yomigataPattern = /<ruby>(.+?)<rp>\(<\/rp><rt>(.+?)<\/rt><rp>\)<\/rp><\/ruby>/gi;
const sentenceComponentPattern = /<span data-word=".+?" data-word-type="(.+?)" data-word-reading=".+?">(.+?)<\/span>/gi;

type Props = {
  'data': SakuraParis.Word
};
const WordCard:FC<Props> = ({ data }) => {
  const [ yomigataEnabled, setYomigataEnabled ] = useState(false);
  const [ text, setText ] = useState(() => data.text.replace(keywordPattern, ""));
  const $heading = useMemo(() => {
    const factory = new ComponentFactory(data.heading, { from: data.from });
    const accessories:ReactNode[] = [];

    switch(data.from){
      case "대사림":
      case "일국대":
        factory.put(/【(.+?)】/g, KanjiExpression);
        accessories.push(<button key="button" disabled={yomigataEnabled} onClick={handleYomigataClick}>
          👁️
        </button>);
        break;
      case "사이토":
        factory.put(/〔(.+?)〕/g, KanjiExpression);
        break;
      case "NHK발음":
        factory.put(/{(.+?)}/g, KanjiExpression);
        break;
    }
    factory.replace(tagPattern, "");

    return factory.build().concat(accessories);

    async function handleYomigataClick():Promise<void>{
      const plainHeading = data.heading.replace(/[^あ-んア-ン・]/g, "");
      const root = plainHeading.split('・')[0];
      let yomigata = await fetch("/api/yomigata", {
        method: "POST",
        body: text.replace(/―・?/g, String.fromCharCode(0x200B) + root)
      }).then(res => res.text());

      yomigata = yomigata.replace(/<span .+?>([\d０-９]+?)<\/span>/gi, "$1");
      setText(yomigata);
      setYomigataEnabled(true);
    }
  }, [ data.from, data.heading, text, yomigataEnabled ]);
  const $text = useMemo(() => {
    const factory = new ComponentFactory(text, { from: data.from });

    factory.put(yomigataPattern, Ruby).put(sentenceComponentPattern, SentenceComponent);
    switch(data.from){
      case "대사림":
        factory.put(/【(.+?)】/g, KanjiExpression);
        factory.put(/^([❶-❿])(.+)$/gm, Category0);
        factory.put(/（([０-９]+?)）(?!})/g, Category1);
        factory.put(/（([ア-ン])）/g, Category2);
        factory.put(/「([^\u200B―」]*?[\u200B―][^\u200B―」]*?)」/g, Example);
        factory.put(/\[reference]([⇒⇔])(.+?)\[\/reference.*?]/g, Reference);
        break;
      case "사이토":
        factory.put(/\[decoration](\d+)\[\/decoration]\./g, Category1);
        factory.put(/\[decoration](.+?)\[\/decoration]/g, Decoration);
        factory.put(/^◆(.+?)　(.+)$/gm, Example);
        break;
      case "NHK발음":
        factory.put(/\[wav page=(\d+?),offset=(\d+?),endpage=(\d+?),endoffset=(\d+?)].+?\[\/wav]/g, Voice);
        factory.put(/\[image format=(\w+?),inline=1,page=(\d+?),offset=(\d+?)]\[\/image]/g, VoiceImage);
        factory.replace(/^[\S\s]+?(?=[\uF000-\uF0FF])/, "");
        break;
    }
    return factory.build();
  }, [ data.from, text ]);

  return <div className={styles['word-card']}>
    <span className={styles['from']}>{data.from}</span>
    <h3>{$heading}</h3>
    <div>{$text}</div>
  </div>;
};
export default memo(WordCard);

type WordCardCFProps = ComponentFactoryProps<{ from: SakuraParis.DictionaryName }>;
const Voice:FC<WordCardCFProps> = ({ from, groups }) => {
  const url = useMemo(() => `/api/nhk-voice?name=${SakuraParis.getDictionaryName(from)}&file=${groups[0]}_${groups[1]}_${groups[2]}_${groups[3]}.wav`, [ from, groups ]);

  return <><div /><audio src={url} controls /></>;
};
const VoiceImage:FC<WordCardCFProps> = ({ from, groups }) => {
  const url = useMemo(() => `https://sakura-paris.org/dict/${SakuraParis.getDictionaryName(from)}/binary/${groups[1]}_${groups[2]}.${groups[0]}`, [ from, groups ]);

  return <img src={url} />;
};
const KanjiExpression:FC<WordCardCFProps> = ({ groups, recur }) => <span className={styles['kanji-expression']}>{recur(groups[0])}</span>;
const Decoration:FC<WordCardCFProps> = ({ groups, recur }) => <em>{recur(groups[0])}</em>;
const Category0:FC<WordCardCFProps> = ({ groups }) => <div className={styles['category-0']}>{groups[0]} {groups[1]}</div>;
const Category1:FC<WordCardCFProps> = ({ groups }) => <><div /><label className={styles['category-1']}>{groups[0]}</label></>;
const Category2:FC<WordCardCFProps> = ({ groups }) => <><div /><label className={styles['category-2']}>{groups[0]}</label></>;
const Example:FC<WordCardCFProps> = ({ groups, recur }) => <blockquote>{recur(groups[0])}{Boolean(groups[1]) && <><br />{recur(groups[1])}</>}</blockquote>;
const Ruby:FC<WordCardCFProps> = ({ groups }) => <ruby>{groups[0]}<rt>{groups[1]}</rt></ruby>;
const SentenceComponent:FC<WordCardCFProps> = ({ groups, recur }) => <span className={styles['sentence-component']} data-type={groups[0]}>{recur(groups[1])}</span>;
const Reference:FC<WordCardCFProps> = ({ groups, recur }) => <>{groups[0]}<a href={`/ja?q=${encodeURIComponent(groups[1])}`}>{recur(groups[1])}</a></>;