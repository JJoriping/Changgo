export namespace SakuraParis{
  export type SearchResult = {
    'words': Word[],
    'nextPageMarker': string
  };
  export type Word = {
    'heading': string,
    'text': string,
    'page': number,
    'offset': number,
    'from': DictionaryName
  };
  export type DictionaryName = keyof typeof dictionaries;

  export const dictionaries = {
    '대사림': "大辞林",
    '일국대': {
      extends: "대사림",
      value: "日本国語大辞典"
    },
    '사이토': "斎藤和英大辞典",
    'NHK발음': "NHK日本語発音アクセント辞典"
  } satisfies Record<string, string|{ 'extends': string, 'value': string }>;
  export function getDictionaryName(key:DictionaryName):string{
    const R = dictionaries[key];
    if(typeof R === "string") return R;
    return R.value;
  }
}