import { parseMidi } from "midi-file";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { createRouter } from "next-connect";
import MIDITrackMap from "@/utilities/midi-track-map";

const router = createRouter<NextApiRequest, NextApiResponse>();

router.post((req, res, next) => {
  let data = Buffer.from([]);

  req.on('data', chunk => {
    data = Buffer.concat([ data, chunk ]);
  });
  req.on('end', () => {
    req.body = data;
    next();
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

  for(const v of trackMap.table){
    const octave = 4;
    const length = Math.max(v.events.length, v.notes.length);
    let r = v.channel === -1 ? "" : `#${v.channel + 1}(q=${q})(o=${octave}) `;

    for(let j = 0; j < length; j++){
      if(v.events[j]) for(const x of v.events[j]){
        r += x.value;
      }
      const notes = v.notes[j];
      if(!notes){
        r += "_";
        continue;
      }
      if(!notes.length){
        continue;
      }
      if(notes.length > 1){
        const firstNoteDuration = notes[0].duration;

        if(notes.every(x => x.duration === firstNoteDuration)){
          let chunk = "[";
          for(const x of notes){
            chunk += getOctavePrefix(octave, x.octave) + x.value;
          }
          chunk += "]";
          r += considerDuration(chunk, firstNoteDuration);
        }else{
          // TODO 바꿔야 함
          const maxDuration = Math.min(...notes.filter(x => x.duration).map(x => x.duration));
          let chunk = "[";
          for(const x of notes){
            chunk += getOctavePrefix(octave, x.octave) + x.value;
          }
          chunk += "]";
          r += considerDuration(chunk, maxDuration);
        }
      }else{
        const [ note ] = notes;
        r += considerDuration(getOctavePrefix(octave, note.octave) + note.value, note.duration);
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