declare module "web-midi-player"{
  export default class WebMidiPlayer{
    public context:AudioContext;
    public startTime:number;

    public setLogger(options:{ eventLogger: (payload:any) => void }):void;
    public play(options:{ arrayBuffer: ArrayBuffer }):boolean;
    public stop():void;
  }
}