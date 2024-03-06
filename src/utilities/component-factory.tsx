import type { FC, ReactNode } from "react";

const nodePattern = /[\uF000-\uF7FF]/g;

export default class ComponentFactory<T = {}>{
  private readonly staticProps?:T;
  private readonly nodes:ReactNode[] = [];
  private text:string;

  constructor(text:string, staticProps?:T){
    this.staticProps = staticProps;
    this.text = text;
  }
  public put(pattern:RegExp, Component:FC<ComponentFactoryProps<T>>):this{
    this.text = this.text.replace(pattern, (v, ...groups) => {
      const key = this.nodes.length;
      this.nodes.push(<Component key={key} {...this.staticProps!} recur={this.recur.bind(this)} value={v} groups={groups} />);
      return String.fromCharCode(0xF000 + key);
    });
    return this;
  }
  public replace(pattern:RegExp, target:string):void{
    this.text = this.text.replace(pattern, target);
  }
  public recur(value:string):ReactNode[]{
    const $R:ReactNode[] = [];
    let prevIndex = 0;
    let chunk:RegExpExecArray|null;

    while(chunk = nodePattern.exec(value)){
      const before = value.slice(prevIndex, chunk.index);
      if(before.length) $R.push(before);
      const index = chunk[0].charCodeAt(0) - 0xF000;
      $R.push(this.nodes[index]);
      prevIndex = chunk.index + chunk[0].length;
    }
    if(prevIndex < value.length) $R.push(value.slice(prevIndex));

    return $R;
  }
  public build():ReactNode[]{
    return this.recur(this.text.trim());
  }
}
export type ComponentFactoryProps<T = {}> = T&{
  'recur': (value:string) => ReactNode[],
  'value': string,
  'groups': string[]
};