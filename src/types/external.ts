export namespace SakuraParis{
  export type SearchResult = {
    'words': Word[],
    'nextPageMarker': string
  };
  export type Word = {
    'heading': string,
    'text': string,
    'page': number,
    'offset': number
  };
}