import type { AppProps } from 'next/app'
import { MasterPasswordProvider } from '../contexts/MasterPasswordContext'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MasterPasswordProvider>
      <Component {...pageProps} />
    </MasterPasswordProvider>
  )
}
