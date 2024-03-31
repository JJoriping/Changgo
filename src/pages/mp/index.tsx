import type { GetServerSideProps, NextPage } from "next";
import SearchResult from "./search-result";
import styles from "./index.module.scss";
import type { Entity } from "@/utilities/mp-data.json";

type Props = {
  list: Entity[]
};
const MP:NextPage<Props> = ({ list }) => <main className={styles['main']}>
  <form>
    Test
  </form>
  <SearchResult list={list} />
</main>;
export default MP;
export const getServerSideProps:GetServerSideProps<Props> = async () => ({
  props: {
    list: await fetch("http://localhost:3000/api/mp-search").then(res => res.json())
  }
});