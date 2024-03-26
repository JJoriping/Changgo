import type { MidiData } from "midi-file";

type MapTrack = {
  'channel': number,
  'notes': MapNote[][],
  'events': MapRawEvent[][]
};
type MapRawEvent = {
  'value': string
};
type MapNote = {
  'octave': number,
  'value': string,
  'duration': number,
  'staccato'?: boolean
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
        channel: -1,
        notes: [],
        events: []
      };
      const activeNotes:Record<number, number> = {};
      let cursor = 0;

      for(const w of v){
        cursor += w.deltaTime;
        const position = quantize(cursor);
        if(position < this.cursorRange[0] || position > this.cursorRange[1]) continue;

        switch(w.type){
          case "noteOn":
            track.channel = w.channel;
            activeNotes[w.noteNumber] = cursor;
            break;
          case "noteOff": {
            const startPosition = quantize(activeNotes[w.noteNumber]);
            const duration = quantize(cursor - activeNotes[w.noteNumber]);

            track.notes[startPosition] ??= [];
            track.notes[startPosition].push({
              octave: Math.floor(w.noteNumber / 12) - 1,
              value: noteTable[w.noteNumber % 12],
              duration
            });
            for(let k = 1; k < duration; k++){
              track.notes[startPosition + k] ??= [];
            }
          } break;
          case "setTempo": {
            track.events[position] ??= [];
            track.events[position].push({
              value: `((bpm=${Math.round(60000000 / w.microsecondsPerBeat)}))`
            });
          } break;
          case "programChange": {
            track.events[position] ??= [];
            track.events[position].push({
              value: `(p=${w.programNumber})`
            });
          } break;
        }
      }
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