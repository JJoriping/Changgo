import type { MidiData } from "midi-file";

export type MapTrack = {
  'channel': number,
  'notes': MapNote[][],
  'events': MapRawEvent[][],
  'sorrygle': SorrygleState,
  'sorrygleSkipSnapshot'?: SorrygleState
};
type SorrygleState = {
  'bpm': number,
  'velocity': number,
  'program': number
};
type MapRawEvent = {
  'value': string
};
export type MapNote = {
  'octave': number,
  'value': string,
  'duration': number,
  'velocity': number
};

const noteTable = [ "c", "C", "d", "D", "e", "f", "F", "g", "G", "a", "A", "b" ];

export default class MIDITrackMap{
  private readonly data:MidiData;
  private readonly cursorRange:[min:number, max:number];
  public readonly table:MapTrack[];

  constructor(data:MidiData, quantization:number, cursorRange?:[min:number, max:number]){
    this.data = data;
    this.cursorRange = cursorRange || [ 0, Infinity ];
    this.table = this.constructTable(data, quantization);
  }
  private constructTable(data:MidiData, quantization:number):MapTrack[]{
    const R:MapTrack[] = [];

    for(const v of data.tracks){
      // NOTE 한 트랙은 한 채널만을 갖는다고 상정한다.
      const track:MapTrack = {
        channel: NaN,
        notes: [],
        events: [],
        sorrygle: {
          bpm: NaN,
          velocity: 100,
          program: 0
        }
      };
      const activeNotes:Record<number, [cursor:number, velocity:number]> = {};
      let cursor = 0;

      for(let j = 0; j < v.length; j++){
        const w = v[j];
        cursor += w.deltaTime;
        const position = quantize(cursor);
        if(position > this.cursorRange[1]) break;
        const outOfRange = position < this.cursorRange[0];

        if(!outOfRange){
          track.sorrygleSkipSnapshot ||= structuredClone(track.sorrygle);
        }
        switch(w.type){
          case "noteOn":
            if(outOfRange) continue;
            track.channel = w.channel;
            activeNotes[w.noteNumber] = [ cursor, Math.round(w.velocity / 127 * 100) ];
            break;
          case "noteOff": {
            if(outOfRange) continue;
            if(!activeNotes[w.noteNumber]) continue;
            const startPosition = quantize(activeNotes[w.noteNumber][0]);
            const duration = quantize(cursor - activeNotes[w.noteNumber][0]);

            track.notes[startPosition] ??= [];
            track.notes[startPosition].push({
              octave: Math.floor(w.noteNumber / 12) - 1,
              value: noteTable[w.noteNumber % 12],
              duration,
              velocity: activeNotes[w.noteNumber][1]
            });
            for(let k = 1; k < duration; k++){
              track.notes[startPosition + k] ??= [];
            }
          } break;
          case "setTempo": {
            const next = Math.round(60000000 / w.microsecondsPerBeat);
            if(track.sorrygle.bpm === next) break;
            if(isNaN(track.channel)) track.channel = -1;
            track.sorrygle.bpm = next;
            track.events[position] ??= [];
            track.events[position].push({ value: `((bpm=${next}))` });
          } break;
          case "programChange": {
            if(track.sorrygle.program === w.programNumber) break;
            track.sorrygle.program = w.programNumber;
            track.events[position] ??= [];
            track.events[position].push({ value: `(p=${w.programNumber})` });
          } break;
        }
      }
      track.sorrygleSkipSnapshot ||= structuredClone(track.sorrygle);
      track.events = track.events.slice(this.cursorRange[0]);
      track.notes = track.notes.slice(this.cursorRange[0]);
      R.push(track);
    }
    return R;

    function quantize(target:number):number{
      return Math.floor(target / quantization);
    }
  }
}