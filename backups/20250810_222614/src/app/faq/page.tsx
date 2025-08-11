export default function FAQPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">FAQ</h1>
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold">How fast can we go live?</h3>
          <p className="text-gray-600">Most businesses go live within 24–48 hours after onboarding.</p>
        </div>
        <div>
          <h3 className="font-semibold">Do you design the cards?</h3>
          <p className="text-gray-600">Yes, expert design is included and tailored to your brand.</p>
        </div>
        <div>
          <h3 className="font-semibold">Do customers need an app?</h3>
          <p className="text-gray-600">No. Customers use Apple Wallet, Google Wallet, or web — no app required.</p>
        </div>
      </div>
    </div>
  )
}

