import "@/global.scss";
import type { AppProps } from "next/app";

// eslint-disable-next-line @jjoriping/variable-name
const App = ({ Component, pageProps }:AppProps) => <Component {...pageProps} />;
export default App;