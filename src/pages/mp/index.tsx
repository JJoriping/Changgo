import type { GetServerSideProps, NextPage } from "next";
import type { MouseEventHandler } from "react";
import { useCallback, useEffect, useRef } from "react";
import styles from "./index.module.scss";
import SearchResult from "./search-result";
import type { Entity } from "@/utilities/mp-data.json";

type Props = {
  'list': Entity[],
  'count': number,
  page: number,
  'pageCount': number,
  'defaultQ': string|null,
  'defaultLevel': number|null
};
const MP:NextPage<Props> = ({ list, page, defaultQ, defaultLevel, count, pageCount }) => {
  const $p = useRef<HTMLInputElement>(null);
  const $pages = useRef<HTMLOListElement>(null);

  const handlePageClick = useCallback<MouseEventHandler>(e => {
    const $target = e.target;
    if(!($target instanceof HTMLButtonElement)) return;
    $p.current!.value = $target.dataset['index']!;
    $target.closest('form')?.submit();
  }, []);

  useEffect(() => {
    $pages.current?.querySelector(":disabled")?.scrollIntoView({ inline: "center" });
  }, []);

  return <main className={styles['main']}>
    <form>
      <input type="text" name="q" placeholder="검색어" defaultValue={defaultQ ?? undefined} />
      <label>
        급수
        <select name="level" defaultValue={defaultLevel ?? -1}>
          <option value="-1">전체</option>
          <option value="0">8급</option>
          <option value="1">준7급</option>
          <option value="2">7급</option>
          <option value="3">준6급</option>
          <option value="4">6급</option>
          <option value="5">준5급</option>
          <option value="6">5급</option>
          <option value="7">준4급</option>
          <option value="8">4급</option>
          <option value="9">준3급</option>
          <option value="10">3급</option>
          <option value="11">2급</option>
          <option value="12">1급</option>
          <option value="13">준특급</option>
          <option value="14">특급</option>
        </select>
      </label>
      <button type="submit">검색</button>
      <div>
        검색 결과 {count.toLocaleString()}개
        <ol ref={$pages} onClick={handlePageClick}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <li key={i}>
              <button type="button" data-index={i} disabled={i === page}>{i + 1}</button>
            </li>
          ))}
        </ol>
        <input ref={$p} type="hidden" name="p" defaultValue={page} />
      </div>
    </form>
    <SearchResult list={list} />
  </main>;
};
export default MP;
export const getServerSideProps:GetServerSideProps<Props> = async context => {
  const { origin, search } = new URL(context.req.url!, `http://${context.req.headers.host}`);

  return {
    props: {
      ...await fetch(`${origin}/api/mp-search${search}`).then(res => res.json()),
      page: context.query['p'] ? Number(context.query['p']) : 0,
      defaultQ: context.query['q'] ? String(context.query['q']) : null,
      defaultLevel: context.query['level'] ? Number(context.query['level']) : null
    }
  };
};