// eslint-disable-next-line @jjoriping/variable-name
export default function C(...names:any[]):string{
  return names.filter(v => v).join(' ');
}