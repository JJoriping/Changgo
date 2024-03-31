declare module "@/utilities/mp-data.json"{
  export type VocabularyTree = Array<string|Record<string, Entity['words']>>;
  export type Entity = {
    'abbreviation': string,
    'abbreviation_footnote': string,
    'antonyms': VocabularyTree,
    'decompose_once': string[],
    'decompose_radical': string[],
    'en_meaning': string,
    'footnote': string,
    'id': number,
    'idioms': VocabularyTree,
    'jp_letter': string,
    'jp_meaning': string,
    'jp_sound': string,
    'korean': string,
    'letter': string,
    'level': number,
    'level_name': string,
    'place_names': VocabularyTree,
    'radical': string,
    'resembles': VocabularyTree,
    'sub_stroke_count': number,
    'synonyms': VocabularyTree,
    'total_stroke_count': number,
    'words': VocabularyTree,
    'zh_letter': string,
    'zh_sound': string
  };
  const data:Record<string, Entity>;
  export default data;
}