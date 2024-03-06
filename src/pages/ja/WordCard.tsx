import type { FC, ReactNode, MouseEventHandler } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./WordCard.module.scss";
import { SakuraParis } from "@/types/external";
import type { ComponentFactoryProps } from "@/utilities/component-factory";
import ComponentFactory from "@/utilities/component-factory";

const tagPattern = /\[[\w/]+?]/g;
const keywordPattern = /\[keyword].+?\[\/keyword]/g;
const yomigataPattern = /<ruby>(.+?)<rp>\(<\/rp><rt>(.+?)<\/rt><rp>\)<\/rp><\/ruby>/gi;
const sentenceComponentPattern = /<span data-word="(.+?)" data-word-type="(.+?)" data-word-reading=".+?">(.+?)<\/span>/gi;

type Props = {
  'data': SakuraParis.Word
};
const WordCard:FC<Props> = ({ data }) => {
  const [ yomigataEnabled, setYomigataEnabled ] = useState(false);
  const [ text, setText ] = useState(() => {
    const kanjiHeading = data.heading.match(/【(.+?)】/);
    const plainHeading = (kanjiHeading ? data.heading.slice(0, kanjiHeading.index) : data.heading).replace(/[^あ-んア-ン・]/g, "");
    const root = plainHeading.includes("・") ? plainHeading.split('・')[0] : kanjiHeading?.[1].split('・')[0] || plainHeading;

    return data.text
      .replace(keywordPattern, "")
      .replace(/―・?(?![\w [])/g, `\u200B${root}`)
    ;
  });
  const [ voice, setVoice ] = useState<SpeechSynthesisVoice>();
  const $heading = useMemo(() => {
    const factory = new ComponentFactory(data.heading, { from: data.from, voice });
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
      let yomigata = await fetch("/api/yomigata", {
        method: "POST",
        body: text
      }).then(res => res.text());

      yomigata = yomigata.replace(/<span .+?>([\d０-９]+?)<\/span>/gi, "$1");
      setText(yomigata);
      setYomigataEnabled(true);
    }
  }, [ data.from, data.heading, text, voice, yomigataEnabled ]);
  const $text = useMemo(() => {
    const factory = new ComponentFactory(text, { from: data.from, voice });

    factory.put(yomigataPattern, Ruby).put(sentenceComponentPattern, SentenceComponent);
    switch(data.from){
      case "대사림":
        factory.put(/【(.+?)】/g, KanjiExpression);
        factory.put(/^([❶-❿])(.+)$/gm, Category0);
        factory.put(/（([０-９]+?)）(?!})/g, Category1);
        factory.put(/（([ア-ン])）/g, Category2);
        factory.put(/「([^\u200B―」]*?[\u200B―][^\u200B―」]*?)」/g, Example);
        factory.put(/\[reference]([→⇒⇔])(.+?)\[\/reference.*?]/g, Reference);
        break;
      case "사이토":
        factory.put(/\[decoration](\d+)\[\/decoration]\./g, Category1);
        factory.put(/\[decoration](.+?)\[\/decoration]/g, Decoration);
        factory.put(/^[◆◇](.+?)　(.+)$/gm, Example);
        break;
      case "NHK발음":
        factory.put(/\[wav page=(\d+?),offset=(\d+?),endpage=(\d+?),endoffset=(\d+?)].+?\[\/wav]/g, Voice);
        factory.put(/\[image format=(\w+?),inline=1,page=(\d+?),offset=(\d+?)]\[\/image]/g, VoiceImage);
        factory.replace(/^[\S\s]+?(?=[\uF000-\uF7FF])/, "");
        break;
    }
    return factory.build();
  }, [ data.from, text, voice ]);

  useEffect(() => {
    const onVoicesChanged = () => {
      setVoice(speechSynthesis.getVoices().findLast(v => v.lang.startsWith("ja")) || undefined);
    };
    speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
    };
  }, []);

  return <div className={styles['word-card']}>
    <span className={styles['from']}>{data.from}</span>
    <h3>{$heading}</h3>
    <div>{$text}</div>
  </div>;
};
export default memo(WordCard);

type WordCardCFProps = ComponentFactoryProps<{ 'from': SakuraParis.DictionaryName, 'voice': SpeechSynthesisVoice|undefined }>;
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
const Example:FC<WordCardCFProps> = ({ groups, voice, recur }) => {
  const $ = useRef<HTMLQuoteElement>(null);
  const [ translation, setTranslation ] = useState<string>();

  const getPlainText = useCallback(() => {
    if(!$.current) return;
    const $clone = $.current.cloneNode(true) as HTMLQuoteElement;
    for(const $v of Array.from($clone.querySelectorAll("rt, button, small"))){
      $v.remove();
    }
    return $clone.textContent || undefined;
  }, []);
  const handleTranslate = useCallback<MouseEventHandler<HTMLButtonElement>>(async e => {
    e.currentTarget.disabled = true;
    const result = await fetch("/api/translate", {
      method: "POST",
      body: getPlainText()
    }).then(res => res.text());

    setTranslation(result || "(번역 실패)");
  }, [ getPlainText ]);
  const handleTTS = useCallback(() => {
    const utterance = new SpeechSynthesisUtterance(getPlainText());

    if(voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }, [ getPlainText, voice ]);

  const [ text, quotation ] = groups[0].split('/');

  return <blockquote ref={$}>
    {recur(text)}
    {typeof groups[1] === "string" && <><br />{recur(groups[1])}</>}
    {Boolean(quotation) && <small>{recur(quotation)}</small>}
    {translation
      ? <p>{translation}</p>
      : <button onClick={handleTranslate}>번역</button>
    }
    <button onClick={handleTTS}>듣기</button>
  </blockquote>;
};
const Ruby:FC<WordCardCFProps> = ({ groups }) => <ruby>{groups[0]}<rt>{groups[1]}</rt></ruby>;
const SentenceComponent:FC<WordCardCFProps> = ({ groups, recur }) => {
  const popupWidth = 360;
  const popupHeight = 600;

  const $ = useRef<HTMLSpanElement>(null);
  const [ popupURL, setPopupURL ] = useState<string>();

  const handleClick = useCallback(() => {
    setPopupURL(`https://small.dic.daum.net/search.do?q=${encodeURIComponent(groups[0])}&dic=jp`);
  }, [ groups ]);

  const rect = $.current?.getBoundingClientRect();

  return <>
    <span ref={$} className={styles['sentence-component']}
      data-type={groups[1]}
      onClick={handleClick}
      onBlur={() => setPopupURL(undefined)}
      tabIndex={-1}
    >
      {recur(groups[2])}
    </span>
    {Boolean(popupURL) && rect && <div className={styles['sentence-component-popup']} style={{
      top: Math.min(rect.top + rect.height, window.innerHeight - popupHeight),
      left: Math.min(rect.left, window.innerWidth - popupWidth)
    }}>
      <iframe src={popupURL} width={popupWidth} height={popupHeight} />
    </div>}
  </>;
};
const Reference:FC<WordCardCFProps> = ({ groups, recur }) => <>{groups[0]}<a href={`/ja?q=${encodeURIComponent(groups[1])}`}>{recur(groups[1])}</a></>;