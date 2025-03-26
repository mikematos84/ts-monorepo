import '@/styles/globals.scss';
import '@mikematos84/sass-react-library/themes/base/index.scss';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
