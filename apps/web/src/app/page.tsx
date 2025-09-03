import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Navigation */}
      <nav className="relative z-10 bg-transparent border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">🎵 MusicDesk</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-white hover:text-purple-200 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-bold tracking-tight text-white sm:text-7xl">
            The Open-Source
            <span className="relative whitespace-nowrap text-purple-400">
              <span className="relative"> Music Platform</span>
            </span>
            for Independent Artists
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-purple-100">
            Distribute your music, track analytics, and claim unclaimed royalties.
            Built by artists, for artists. No middleman fees.
          </p>
          
          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none bg-white text-purple-900 hover:bg-purple-50 active:bg-purple-200 active:text-purple-900/60"
            >
              Start Your Music Career
            </Link>
            <Link
              href="/dashboard"
              className="group inline-flex ring-1 ring-white/20 items-center justify-center rounded-full py-2 px-4 text-sm focus:outline-none text-white hover:ring-white/30"
            >
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="relative bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to manage your music career
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Professional tools that were previously only available to major labels,
                now accessible to independent artists.
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                      <span className="text-white text-xl">🚀</span>
                    </div>
                    Music Distribution
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Release your music to 150+ streaming platforms including Spotify, Apple Music, 
                      Amazon Music, and more. Professional distribution without the recurring fees.
                    </p>
                  </dd>
                </div>
                
                <div className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                      <span className="text-white text-xl">📊</span>
                    </div>
                    Real-Time Analytics
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Track your streams, listeners, and growth across all platforms. 
                      Advanced analytics with geographic insights and demographic breakdowns.
                    </p>
                  </dd>
                </div>
                
                <div className="flex flex-col">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-600">
                      <span className="text-white text-xl">💰</span>
                    </div>
                    Royalty Recovery
                  </dt>
                  <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Find and claim millions in unclaimed mechanical royalties. 
                      AI-powered matching connects you to money you didn't know you were owed.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to take control of your music career?
              </h2>
              <p className="mt-6 text-lg leading-8 text-purple-100">
                Join thousands of independent artists who've discovered unclaimed royalties
                and grown their careers with MusicDesk.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-white px-6 py-3 text-base font-semibold text-purple-900 shadow-sm hover:bg-purple-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Start Free Today
                </Link>
                <Link
                  href="/dashboard"
                  className="text-base font-semibold leading-7 text-white hover:text-purple-200"
                >
                  View Demo <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">🎵 MusicDesk</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                The open-source music business platform that puts artists first.
                Transparent, affordable, and built by the music community.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white">Sign In</Link></li>
                <li><Link href="/auth/signup" className="hover:text-white">Get Started</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://github.com/schrabooth/musicdesk" className="hover:text-white">GitHub</a></li>
                <li><span className="text-gray-500">Documentation</span></li>
                <li><span className="text-gray-500">API Reference</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 MusicDesk. Open source music platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
