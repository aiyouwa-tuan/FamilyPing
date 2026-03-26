import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section — warm gradient */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #FF8F65 40%, #FFB088 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 pt-20 pb-20 text-center relative z-10">
          <div className="text-[72px] mb-4 leading-none">
            {'\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66'}{'\u2764\uFE0F'}{'\uD83D\uDC74'}{'\uD83D\uDC75'}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            FamilyPing
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-2xl mx-auto font-medium">
            Know your parents are OK. Every day.
          </p>
          <p className="text-white/75 mb-10 max-w-xl mx-auto text-lg">
            A simple daily check-in app that helps families stay connected with
            aging parents through mood tracking, health insights, and gentle reminders.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/auth/register"
              className="bg-white text-[#FF6B35] px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="bg-white/20 text-white px-8 py-4 rounded-full font-bold text-lg border-2 border-white/40 hover:bg-white/30 transition-all backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,60 1440,40 V80 H0 Z" fill="#FFF5EE"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-2" style={{ color: '#2D2016' }}>
          How FamilyPing Works
        </h2>
        <p className="text-center text-[#8D7B6E] mb-12 text-lg">Simple, warm, and always there for you</p>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={'\uD83D\uDC4B'}
            title="Daily Check-in"
            description="Parents tap one button each morning to share how they're feeling. It takes less than 10 seconds."
            borderColor="#FF6B35"
          />
          <FeatureCard
            icon={'\uD83D\uDCCA'}
            title="Health Insights"
            description="Track steps, sleep patterns, and health metrics. Get AI-powered insights and anomaly alerts."
            borderColor="#4ECDC4"
          />
          <FeatureCard
            icon={'\uD83D\uDCAC'}
            title="Stay Connected"
            description="Send messages, photos, and voice notes. Know what's on their mind with daily questions."
            borderColor="#FFD166"
          />
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16" style={{ background: 'linear-gradient(180deg, transparent, rgba(255, 107, 53, 0.04))' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <TestimonialCard
              quote="Mom checks in every morning. It gives me peace of mind knowing she's OK."
              name="Sarah"
              age={34}
            />
            <TestimonialCard
              quote="I love the daily questions. It helps me share stories with my grandkids."
              name="Margaret"
              age={72}
            />
          </div>
        </div>
      </section>

      {/* Secondary Features */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#2D2016' }}>Peace of Mind for the Whole Family</h3>
              <ul className="space-y-4">
                <CheckItem text="Mood tracking with weekly summaries" />
                <CheckItem text="SOS button for emergencies" />
                <CheckItem text="AI-powered anomaly detection" />
                <CheckItem text="Family group with invite codes" />
                <CheckItem text="Private and secure - your data stays yours" />
              </ul>
            </div>
            <div className="rounded-[24px] p-8 text-center" style={{ background: 'linear-gradient(135deg, #FFF5EE, #FFE8D6)', border: '1px solid rgba(255, 107, 53, 0.1)' }}>
              <div className="text-[80px] mb-4">{'\uD83C\uDFE0'}</div>
              <p className="text-xl font-bold" style={{ color: '#2D2016' }}>Designed for families who care</p>
              <p className="mt-2" style={{ color: '#8D7B6E' }}>Simple enough for any parent. Powerful enough for every family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — warm dark */}
      <footer style={{ background: 'linear-gradient(135deg, #2D2016, #3E2E20)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-[#FFB088] text-lg font-medium mb-2">FamilyPing</p>
          <p className="text-[#8D7B6E]">Keeping families connected, one ping at a time.</p>
          <div className="flex justify-center gap-8 mt-6">
            <Link href="/auth/login" className="text-[#FF8F65] hover:text-[#FFB088] transition-colors text-sm font-medium">Sign In</Link>
            <Link href="/auth/register" className="text-[#FF8F65] hover:text-[#FFB088] transition-colors text-sm font-medium">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, borderColor }: { icon: string; title: string; description: string; borderColor: string }) {
  return (
    <div
      className="bg-white rounded-[20px] p-8 hover:shadow-lg transition-all hover:-translate-y-1 text-center relative overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(255, 107, 53, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)', border: '1px solid rgba(255, 107, 53, 0.06)' }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]" style={{ background: borderColor }} />
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2" style={{ color: '#2D2016' }}>{title}</h3>
      <p style={{ color: '#8D7B6E' }}>{description}</p>
    </div>
  )
}

function TestimonialCard({ quote, name, age }: { quote: string; name: string; age: number }) {
  return (
    <div
      className="bg-white rounded-[20px] p-8 relative"
      style={{ boxShadow: '0 2px 12px rgba(255, 107, 53, 0.08)', border: '1px solid rgba(255, 107, 53, 0.06)' }}
    >
      <div className="text-[#FFD166] text-4xl mb-3">{'\u201C'}</div>
      <p className="text-lg leading-relaxed mb-4" style={{ color: '#5D4037' }}>{quote}</p>
      <p className="font-bold" style={{ color: '#2D2016' }}>{'\u2014'} {name}, {age}</p>
    </div>
  )
}

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-[#4ECDC4] flex items-center justify-center text-white text-sm font-bold mt-0.5 shrink-0">{'\u2713'}</span>
      <span style={{ color: '#5D4037' }}>{text}</span>
    </li>
  )
}
