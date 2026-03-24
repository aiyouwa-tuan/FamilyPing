import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          <span className="text-[#FF6B35]">FamilyPing</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Know your parents are OK. Every day.
        </p>
        <p className="text-gray-500 mb-10 max-w-xl mx-auto">
          A simple daily check-in app that helps families stay connected with
          aging parents through mood tracking, health insights, and gentle reminders.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="bg-[#FF6B35] text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-[#e55a2b] transition-colors shadow-lg shadow-[#FF6B35]/20"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="bg-white text-[#FF6B35] px-8 py-3 rounded-xl font-semibold text-lg border-2 border-[#FF6B35] hover:bg-[#FF6B35]/5 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How FamilyPing Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={'\u{1F44B}'}
            title="Daily Check-in"
            description="Parents tap one button each morning to share how they're feeling. It takes less than 10 seconds."
          />
          <FeatureCard
            icon={'\u{1F4CA}'}
            title="Health Insights"
            description="Track steps, sleep patterns, and health metrics. Get AI-powered insights and anomaly alerts."
          />
          <FeatureCard
            icon={'\u{1F4AC}'}
            title="Stay Connected"
            description="Send messages, photos, and voice notes. Know what's on their mind with daily questions."
          />
        </div>
      </section>

      {/* Secondary Features */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Peace of Mind for the Whole Family</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-[#4ECDC4] font-bold mt-0.5">{'\u2713'}</span>
                  <span className="text-gray-600">Mood tracking with weekly summaries</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4ECDC4] font-bold mt-0.5">{'\u2713'}</span>
                  <span className="text-gray-600">SOS button for emergencies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4ECDC4] font-bold mt-0.5">{'\u2713'}</span>
                  <span className="text-gray-600">AI-powered anomaly detection</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4ECDC4] font-bold mt-0.5">{'\u2713'}</span>
                  <span className="text-gray-600">Family group with invite codes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4ECDC4] font-bold mt-0.5">{'\u2713'}</span>
                  <span className="text-gray-600">Private and secure - your data stays yours</span>
                </li>
              </ul>
            </div>
            <div className="bg-[#FFF8F0] rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">{'\u{1F3E0}'}</div>
              <p className="text-lg font-medium text-gray-900">Designed for families who care</p>
              <p className="text-gray-500 mt-2">Simple enough for any parent. Powerful enough for every family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FFF8F0] py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          <p>FamilyPing &mdash; Keeping families connected, one ping at a time.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  )
}
