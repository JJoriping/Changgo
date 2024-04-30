import Kuromoji from "kuromoji";

let japaneseTokenizer:Kuromoji.Tokenizer<Kuromoji.IpadicFeatures>;

export async function tokenizeJapanese(value:string):Promise<Kuromoji.IpadicFeatures[]>{
  if(!japaneseTokenizer) await initialize();
  return japaneseTokenizer.tokenize(value);
}
async function initialize():Promise<void>{
  return new Promise((res, rej) => {
    Kuromoji.builder({ dicPath: "./node_modules/kuromoji/dict" }).build((error, tokenizer) => {
      if(error){
        rej(error);
      }else{
        japaneseTokenizer = tokenizer;
        res();
      }
    });
  });
}