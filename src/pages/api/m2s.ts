import { parseMidi } from "midi-file";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { createRouter } from "next-connect";
import type { MapNote, MapTrack } from "@/utilities/midi-track-map";
import MIDITrackMap from "@/utilities/midi-track-map";

const router = createRouter<NextApiRequest, NextApiResponse>();
const octaveLookahead = 32;

router.post((req, res, next) => {
  let data = Buffer.from([]);

  return new Promise<void>(innerRes => {
    req.on('data', chunk => {
      data = Buffer.concat([ data, chunk ]);
    });
    req.on('end', () => {
      req.body = data;
      next();
      innerRes();
    });
  });
}, async (req, res) => {
  const midi = parseMidi(req.body);
  const q = Number(req.query['q'] || 16);
  const skip = Number(req.query['skip'] || 0);
  const take = Number(req.query['take'] || Infinity);
  if(isNaN(q) || isNaN(skip) || isNaN(take)){
    res.status(400).end();
    return;
  }
  const trackMap = new MIDITrackMap(
    midi,
    4 * (midi.header.ticksPerBeat || 128) / q,
    [ skip, skip + take ]
  );
  const R:string[] = [];
  let bpmAdded = false;

  for(const v of trackMap.table){
    if(isNaN(v.channel)) continue;
    const length = Math.max(v.events.length, v.notes.length);
    let r = v.channel === -1 ? "" : `#${v.channel + 1}(q=${q})`;
    let [ octave, optimizedOctaveBy ] = getOptimizedOctave(v.notes, 0, octaveLookahead);
    let velocity = 100;

    r += `(o=${octave})`;
    if(skip){
      if(v.sorrygleSkipSnapshot?.bpm && !bpmAdded){
        bpmAdded = true;
        R.unshift(`((bpm=${v.sorrygleSkipSnapshot.bpm}))`);
      }
      if(v.channel !== -1){
        r += `(p=${v.sorrygle.program})`;
      }
    }
    r += " ";
    for(let j = 0; j < length; j++){
      if(j > optimizedOctaveBy){
        let nextOctave:number;

        [ nextOctave, optimizedOctaveBy ] = getOptimizedOctave(v.notes, j, octaveLookahead);
        if(octave !== nextOctave){
          r += `(o=${octave = nextOctave})`;
        }
      }
      if(v.events[j]) for(const x of v.events[j]){
        r += x.value;
      }
      const notes = v.notes[j];
      if(!notes){
        let hit = false;
        let combo = 1;
        for(let k = j + 1; k < length; k++){
          if(v.notes[k]){
            hit = true;
            j = k - 1;
            break;
          }
          combo++;
        }
        if(hit) r += compressRest(combo);
        continue;
      }
      if(!notes.length){
        continue;
      }
      if(velocity !== notes[0].velocity){
        velocity = notes[0].velocity;
        r += `(v=${velocity})`;
      }
      if(notes.length > 1 && notes.every(x => x.duration === notes[0].duration)){
        let chunk = "[";
        for(const x of notes){
          chunk += getOctavePrefix(octave, x.octave) + x.value;
        }
        chunk += "]";
        r += considerDuration(chunk, notes[0].duration);
      }else{
        const { result, nextIndex } = parallelizeNotes(v, octave, j);
        r += result;
        j = nextIndex;
      }
    }
    R.push(r);
  }
  res.send(R.join('\n'));
});
export default router.handler();
export const config:PageConfig = {
  api: {
    bodyParser: false
  }
};

function getOctavePrefix(source:number, target:number):string{
  if(source > target){
    return "v".repeat(source - target);
  }
  if(source < target){
    return "^".repeat(target - source);
  }
  return "";
}
function considerDuration(source:string, duration:number):string{
  const integer = Math.floor(duration);
  const suffix = integer ? "~".repeat(integer - 1) : "";

  return source + suffix;
}
function parallelizeNotes(track:MapTrack, octave:number, index:number){
  const slots:Array<Array<MapNote|true>> = [];
  let result = "";
  let nextIndex = index;

  for(let i = index; i <= nextIndex; i++){
    const localI = i - index;
    for(const w of track.notes[i]){
      w.duration ||= 1;
      const slot = reserveSlot(w, localI);
      for(let k = 0; k < w.duration; k++){
        slots[slot][localI + k] = k ? true : w;
      }
      nextIndex = Math.max(nextIndex, i + w.duration - 1);
    }
  }
  if(slots.length > 1){
    const maxLength = Math.max(...slots.map(v => v.length));
    for(const v of slots){
      v[maxLength - 1] ??= null!;
    }
    result += "[[";
    result += slots.map(v => v.map(w => w === true
      ? ""
      : w
      ? considerDuration(getOctavePrefix(octave, w.octave) + w.value, w.duration)
      : "_"
    ).join('')).join('|');
    result += "]]";
  }else if(slots.length === 1){
    const note = slots[0][0] as MapNote;
    result += considerDuration(getOctavePrefix(octave, note.octave) + note.value, note.duration);
  }
  return { result, nextIndex };

  function reserveSlot(note:MapNote, to:number):number{
    const chunk = Array.from({ length: note.duration });

    for(let i = 0; ; i++){
      slots[i] ??= [];
      if(chunk.some((_, j) => slots[i][to + j])){
        continue;
      }
      return i;
    }
  }
}
function compressRest(length:number):string{
  if(length > 8){
    return `|:_:|${length - 1}`;
  }
  return "_".repeat(length);
}
function getOptimizedOctave(notes:MapNote[][], offset:number, lookahead:number):[octave:number, by:number]{
  const histogram:Record<number, number> = {};
  let empty = true;
  let by = offset;
  let count = 0;

  out: for(let i = offset; i < notes.length; by = i++){
    if(!notes[i]) continue;
    for(const { octave } of notes[i]){
      histogram[octave] ??= 0;
      histogram[octave]++;
      empty = false;
      if(count++ >= lookahead){
        break out;
      }
    }
  }
  if(empty) return [ 4, by ];
  return [
    parseInt(Object.entries(histogram).sort((a, b) => b[1] - a[1])[0][0]),
    by
  ];
}