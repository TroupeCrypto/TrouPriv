import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

const Home: NextPage = () => {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <>
      <Head>
        <title>TrouPrive - Real-Time Asset Database</title>
        <meta name="description" content="TrouPrive is a real-time, client-side asset management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to TrouPrive
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Your Real-Time Asset Management System
            </p>
            <div className="space-y-4">
              <p className="text-gray-300">
                Next.js conversion in progress...
              </p>
              <p className="text-sm text-gray-500">
                The application is being migrated from Vite to Next.js with Tailwind CSS and Framer Motion
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Home
