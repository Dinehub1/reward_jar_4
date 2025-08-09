export default function UseCasesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-4xl font-bold mb-8">Use Cases</h1>
      <div className="grid md:grid-cols-2 gap-6 text-gray-700">
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-2">Coffee Shops</h3>
          <p>Stamp cards that drive repeat visits and larger orders.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-2">Salons & Spas</h3>
          <p>Memberships and session packs with simple redemption.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-2">Retail</h3>
          <p>Rewards for spend thresholds without apps or friction.</p>
        </div>
        <div className="rounded-xl border p-6 bg-white">
          <h3 className="text-xl font-semibold mb-2">Fitness</h3>
          <p>Class packs, monthly memberships, and attendance tracking.</p>
        </div>
      </div>
    </div>
  )
}

