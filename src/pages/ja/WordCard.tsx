import type { FC } from "react";
import { memo } from "react";
import styles from "./WordCard.module.scss";
import type { SakuraParis } from "@/types/external";

type Props = {
  'data': SakuraParis.Word
};
const WordCard:FC<Props> = ({ data }) => <div className={styles['word-card']}>
  <pre>{JSON.stringify(data)}</pre>
</div>;
export default memo(WordCard);