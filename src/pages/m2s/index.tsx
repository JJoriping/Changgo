import type { NextPage } from "next";
import type { FormEventHandler } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sorrygle } from "sorrygle";
import type WebMidiPlayer from "web-midi-player";
import styles from "./index.module.scss";

const M2S:NextPage = () => {
  const $player = useRef<WebMidiPlayer>();
  const $buffer = useRef<ArrayBuffer>();
  const $timeline = useRef<Array<[start:number, stop:number, index:number]>>([]);
  const $pre = useRef<HTMLPreElement>(null);

  const [ value, setValue ] = useState<string>();
  const [ loading, setLoading ] = useState(false);
  const [ playing, setPlaying ] = useState(false);

  const handleSubmit = useCallback<FormEventHandler<HTMLFormElement>>(async e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setLoading(true);
    const nextValue = await fetch(`/api/m2s?q=${formData.get("q")}`
      + (formData.get("skip") ? `&skip=${formData.get("skip")}` : "")
      + (formData.get("take") ? `&take=${formData.get("take")}` : "")
    , {
      method: "POST",
      body: formData.get("file")
    }).then(res => res.text());
    setValue(nextValue);
    $buffer.current = Sorrygle.compile(nextValue);
    setLoading(false);
  }, []);
  const handleOutputClick = useCallback(() => {
    if(!value) return;
    navigator.clipboard.writeText(value);
    alert("클립보드에 복사되었습니다.");
  }, [ value ]);
  const handlePlay = useCallback(() => {
    if(!value || !$buffer.current) return;
    if(playing){
      $player.current?.stop();
    }else if($player.current?.play({ arrayBuffer: $buffer.current })){
      $timeline.current = [];

      // eslint-disable-next-line unicorn/no-array-for-each
      Sorrygle.getTimeline(value).forEach((v, i) => {
        for(const [ start, stop ] of v){
          $timeline.current.push([ start, stop, i ]);
        }
      });
      $timeline.current.sort((a, b) => a[0] - b[0]);
      setPlaying(true);
    }
  }, [ playing, value ]);

  useEffect(() => {
    import("web-midi-player").then(res => {
      const player = new res.default();

      player.setLogger({
        eventLogger: payload => {
          switch(payload['event']){
            case "MIDI_STOP":
              setPlaying(false);
              break;
          }
        }
      });
      $player.current = player;
    });
  }, []);
  useEffect(() => {
    if(!playing) return;
    let timer:number;
    const onTick = () => {
      if(!$player.current || !$pre.current || !value) return;
      const ms = 1000 * ($player.current.context.currentTime - $player.current.startTime) - 234;
      while($timeline.current.length){
        const [ start, stop, index ] = $timeline.current[0];
        if(start > ms) break;
        $timeline.current.shift();
        const $target = $pre.current.children.item(index);
        if(!$target) continue;
        const $targets = [ $target ];
        let cursor = index;
        if(value[index] === "["){
          cursor = value.indexOf("]", index);
          for(let j = index + 1; j <= cursor; j++){
            $targets.push($pre.current.children.item(j)!);
          }
        }
        if(value[index] === "^" || value[index] === "v"){
          for(let j = index; ; j++){
            $targets.push($pre.current.children.item(j)!);
            if(value[j] !== "^" && value[j] !== "v"){
              cursor = j;
              break;
            }
          }
        }
        for(let j = cursor + 1; ; j++){
          if(value[j] !== "~") break;
          $targets.push($pre.current.children.item(j)!);
        }
        for(const $w of $targets){
          $w.classList.add(styles['active']);
        }
        window.setTimeout(() => {
          for(const $w of $targets){
            $w.classList.remove(styles['active']);
          }
        }, stop - start);
      }
      timer = window.requestAnimationFrame(onTick);
    };
    onTick();
    return () => window.cancelAnimationFrame(timer);
  }, [ playing, value ]);

  return <>
    <form className={styles['form']} onSubmit={handleSubmit}>
      <input type="file" accept="audio/midi" name="file" />
      <select name="q" defaultValue="16">
        <option value="64">64분음표 (정밀)</option>
        <option value="32">32분음표</option>
        <option value="16">16분음표 (경량)</option>
      </select>
      <input type="number" name="skip" placeholder="생략 범위" />
      <input type="number" name="take" placeholder="선택 범위" />
      <button disabled={loading}>변환</button>
    </form>
    {Boolean(value) && <div className={styles['output']}>
      <div>
        {value!.length.toLocaleString()} 바이트
        <button onClick={handlePlay}>{playing ? "정지" : "재생"}</button>
      </div>
      <pre ref={$pre} onClick={handleOutputClick}>{value?.split('').map((v, i) => (
        <span key={i}>{v}</span>
      ))}</pre>
    </div>}
  </>;
};
export default M2S;