import type { FC } from "react";
import { memo, useMemo } from "react";
import styles from "./WordCard.module.scss";
import { SakuraParis } from "@/types/external";
import type { ComponentFactoryProps } from "@/utilities/component-factory";
import ComponentFactory from "@/utilities/component-factory";

const tagPattern = /\[[\w/]+?]/g;
const keywordPattern = /\[keyword].+?\[\/keyword]/g;

type Props = {
  'data': SakuraParis.Word
};
const WordCard:FC<Props> = ({ data }) => {
  const $heading = useMemo(() => {
    const factory = new ComponentFactory(data.heading, { from: data.from });

    switch(data.from){
      case "대사림":
      case "일국대":
        factory.put(/【(.+?)】/g, KanjiExpression);
        break;
      case "사이토":
        factory.put(/〔(.+?)〕/g, KanjiExpression);
        break;
      case "NHK발음":
        factory.put(/{(.+?)}/g, KanjiExpression);
        break;
    }
    factory.replace(tagPattern, "");

    return factory.build();
  }, [ data.from, data.heading ]);
  const $text = useMemo(() => {
    const factory = new ComponentFactory(data.text, { from: data.from });

    factory.replace(keywordPattern, "");
    switch(data.from){
      case "대사림":
        factory.put(/【(.+?)】/g, KanjiExpression);
        factory.put(/^([❶-❿])(.+)$/gm, Category0);
        factory.put(/（([０-９]+?)）(?!})/g, Category1);
        factory.put(/（([ア-ン])）/g, Category2);
        factory.put(/「([^―」]*?―[^―」]*?)」/g, Example);
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
  }, [ data.from, data.text ]);

  return <div className={styles['word-card']}>
    <span className={styles['from']}>{data.from}</span>
    <h3>{$heading}</h3>
    <div>{$text}</div>
  </div>;
};
export default memo(WordCard);

type WordCardCFProps = ComponentFactoryProps<{ from: SakuraParis.DictionaryName }>;
const Voice:FC<WordCardCFProps> = ({ from, groups }) => {
  const url = useMemo(() => `https://sakura-paris.org/dict/${SakuraParis.getDictionaryName(from)}/binary/${groups[0]}_${groups[1]}_${groups[2]}_${groups[3]}.wav`, [ from, groups ]);

  return <><div /><audio src={url} controls /></>;
};
const VoiceImage:FC<WordCardCFProps> = ({ from, groups }) => {
  const url = useMemo(() => `https://sakura-paris.org/dict/${SakuraParis.getDictionaryName(from)}/binary/${groups[1]}_${groups[2]}.${groups[0]}`, [ from, groups ]);

  return <img src={url} />;
};
const KanjiExpression:FC<WordCardCFProps> = ({ groups }) => <span className={styles['kanji-expression']}>{groups[0]}</span>;
const Decoration:FC<WordCardCFProps> = ({ groups }) => <em>{groups[0]}</em>;
const Category0:FC<WordCardCFProps> = ({ groups }) => <div className={styles['category-0']}>{groups[0]} {groups[1]}</div>;
const Category1:FC<WordCardCFProps> = ({ groups }) => <><div /><label className={styles['category-1']}>{groups[0]}</label></>;
const Category2:FC<WordCardCFProps> = ({ groups }) => <><div /><label className={styles['category-2']}>{groups[0]}</label></>;
const Example:FC<WordCardCFProps> = ({ groups, recur }) => <blockquote>{recur(groups[0])}{Boolean(groups[1]) && <><br />{recur(groups[1])}</>}</blockquote>;