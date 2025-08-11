export default function PricingPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Pricing</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border p-6 bg-white">
          <h2 className="text-2xl font-semibold">Starter</h2>
          <p className="text-gray-600 mt-2">For small businesses getting started</p>
          <div className="text-4xl font-bold mt-6">$0</div>
          <ul className="mt-4 text-sm text-gray-600 space-y-2">
            <li>• Expert design included</li>
            <li>• Apple/Google/Web cards</li>
            <li>• QR stamp system</li>
          </ul>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h2 className="text-2xl font-semibold">Managed</h2>
          <p className="text-gray-600 mt-2">Concierge onboarding and support</p>
          <div className="text-4xl font-bold mt-6">Contact</div>
          <ul className="mt-4 text-sm text-gray-600 space-y-2">
            <li>• Done-for-you setup</li>
            <li>• Custom templates</li>
            <li>• Priority support</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

