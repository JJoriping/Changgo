import type { Connection, QueryResult } from "mysql2/promise";
import { createConnection } from "mysql2/promise";

// eslint-disable-next-line @jjoriping/variable-name
export async function DB(sql:string, args:any[] = []):Promise<QueryResult>{
  global.db ??= await createConnection({
    host: process.env['DB_HOST'],
    port: parseInt(process.env['DB_PORT']!),
    user: process.env['DB_USER'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_DATABASE']
  });
  return global.db.query(sql, args).then(([ res ]) => res);
}
export type UminekoWord = {
  'id': number,
  'name': string,
  'part': string,
  'jlptRank': number|null,
  'meaning': string,
  'pronunciation': string,
  'quotes'?: UminekoQuote[]
};
export type UminekoQuote = {
  'textK': string,
  'textJ': string,
  'voiceURL': string|null,
  'wordId': number
};

declare global{
  // eslint-disable-next-line no-var
  var db:Connection;
}