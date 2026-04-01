import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Welcome to RBC Lab</h2>
        <p className="mt-1 text-sm text-gray-600">
          Automated Red Blood Cell counting for medical laboratory use.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/new-test" className="rounded-lg border bg-white p-5 shadow-sm hover:border-blue-400 transition-colors">
          <div className="text-2xl">🧪</div>
          <h3 className="mt-2 font-medium">New Test</h3>
          <p className="mt-1 text-sm text-gray-500">
            Register a patient and upload blood smear images.
          </p>
        </Link>
        <div className="rounded-lg border bg-white p-5 shadow-sm opacity-50 cursor-not-allowed">
          <div className="text-2xl">🔬</div>
          <h3 className="mt-2 font-medium">Analyze</h3>
          <p className="mt-1 text-sm text-gray-500">
            Run RBC detection and get cell counts. <span className="text-xs">(Phase 3)</span>
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm opacity-50 cursor-not-allowed">
          <div className="text-2xl">📄</div>
          <h3 className="mt-2 font-medium">Reports</h3>
          <p className="mt-1 text-sm text-gray-500">
            View and download AI-generated clinical reports. <span className="text-xs">(Phase 4)</span>
          </p>
        </div>
      </div>
    </div>
  );
}
