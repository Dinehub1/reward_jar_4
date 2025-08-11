import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, QrCode, Smartphone, TrendingUp, Users, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
      {/* Navigation */}
      <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-slate-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">RewardJar</h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">Business Login</Button>
              </Link>
              <Link href="/onboarding/business">
                <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-6">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Launch your loyalty program
            <span className="block text-blue-600 mt-2">in 24–48 hours</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Professional Apple Wallet, Google Wallet, and web cards designed for your brand — no setup required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/onboarding/business">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 h-14 min-w-[200px] shadow-lg hover:shadow-xl transition-all duration-200">
                Get Started →
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 h-14 min-w-[160px] border-gray-300 text-gray-700 hover:bg-gray-50">
                See Templates
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Professional design included • Live in 24–48 hours
          </p>
        </div>
      </section>

      {/* Social Proof Strip */}
  <div className="bg-card/80 border-y border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-300">Trusted by businesses across coffee, salon, retail, and fitness</div>
          <div className="hidden md:flex items-center gap-6 opacity-80">
            <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-slate-700 rounded" />
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional loyalty programs, designed for you
            </h2>
            <p className="text-lg text-gray-600">
              We handle the technical complexity while you focus on growing your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Simple Onboarding</CardTitle>
                <CardDescription>
                  Just submit your business details and logo. We handle all the technical setup for you.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Expert Design</CardTitle>
                <CardDescription>
                  Our team creates professional stamp cards and membership cards tailored to your brand and business type.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Multi-Platform Cards</CardTitle>
                <CardDescription>
                  Your cards work on Apple Wallet, Google Wallet, and web browsers automatically.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <QrCode className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>QR Code Integration</CardTitle>
                <CardDescription>
                  Customers collect stamps by scanning QR codes. No app downloads required.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Business Dashboard</CardTitle>
                <CardDescription>
                  Track customer engagement, stamp collection, and reward redemption from your dashboard.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CreditCard className="h-10 w-10 text-blue-600 mb-4" />
                <CardTitle>Flexible Card Types</CardTitle>
                <CardDescription>
                  Stamp cards, membership cards, or custom programs - we create what fits your business.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              From onboarding to launch in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Started</h3>
              <p className="text-gray-600">
                Complete our simple onboarding form with your business details and upload your logo.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">We Design Your Cards</h3>
              <p className="text-gray-600">
                Our team creates professional stamp cards and membership cards tailored to your business and brand.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Go Live & Grow</h3>
              <p className="text-gray-600">
                Launch your loyalty program and watch customer engagement drive repeat business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Centralized Control Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Professional quality, every time
          </h2>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            Our expert team reviews every business onboarding and creates custom stamp cards and membership cards 
            that match your brand perfectly. This ensures consistent quality, optimal customer 
            experience, and maximum engagement across all platforms.
          </p>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">✨ Expert Design</h3>
              <p className="text-gray-600 text-sm">
                Professional designers create cards optimized for your industry and customer base.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">🔒 Quality Control</h3>
              <p className="text-gray-600 text-sm">
                Every card is tested across all platforms before going live to ensure perfect functionality.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">⚡ Fast Turnaround</h3>
              <p className="text-gray-600 text-sm">
                Most businesses go live within 24-48 hours of completing onboarding.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">📱 Multi-Platform</h3>
              <p className="text-gray-600 text-sm">
                Your cards work seamlessly on Apple Wallet, Google Wallet, and web browsers.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/onboarding/business">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4">
                Request Your Cards →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to launch your loyalty program?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join businesses using RewardJar to increase customer retention and drive growth
          </p>
          <Link href="/onboarding/business">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold mb-4">RewardJar</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                Professional digital loyalty programs designed and managed by experts. 
                Focus on your customers, we handle the technology.
              </p>
              <div className="flex space-x-4 text-sm text-gray-500">
                <span>Powered by Next.js</span>
                <span>•</span>
                <span>Supabase</span>
                <span>•</span>
                <span>Vercel</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Business</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><Link href="/onboarding/business" className="hover:text-white">Get Started</Link></div>
                <div><Link href="/auth/login" className="hover:text-white">Business Login</Link></div>
                <div><span className="text-gray-500">Demo (Coming Soon)</span></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div><span>Contact: hello@rewardjar.xyz</span></div>
                <div><span>Support: support@rewardjar.xyz</span></div>
                <div><span className="text-gray-500">Help Center (Coming Soon)</span></div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex space-x-6 text-sm text-gray-400">
                <span>© 2025 RewardJar</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer">Privacy Policy</span>
                <span>•</span>
                <span className="hover:text-white cursor-pointer">Terms of Service</span>
              </div>
              <div className="text-sm text-gray-500">
                Made with ❤️ for businesses everywhere
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
