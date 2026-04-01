"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, type TestRecord } from "@/lib/api";

export default function TestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [test, setTest] = useState<TestRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<TestRecord>(`/tests/${id}`)
      .then(setTest)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!test) return <p className="text-sm text-gray-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Test #{test.id}</h2>
          <p className="text-sm text-gray-500">
            {new Date(test.test_date).toLocaleString()} — Status:{" "}
            <span className="font-medium capitalize">{test.status}</span>
          </p>
        </div>
        <button onClick={() => router.push("/")} className="text-sm text-blue-600 hover:underline">
          ← Back
        </button>
      </div>

      {/* Images */}
      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-3">
        <h3 className="font-medium text-gray-700">Uploaded Images ({test.images.length})</h3>
        {test.images.length === 0 ? (
          <p className="text-sm text-gray-400">No images uploaded.</p>
        ) : (
          <ul className="space-y-1">
            {test.images.map((img) => (
              <li key={img.id} className="text-sm text-gray-600">
                {img.filename}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Placeholder sections for Phase 3 & 4 */}
      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-3">
        <h3 className="font-medium text-gray-700">RBC Analysis</h3>
        <p className="text-sm text-gray-400">Analysis will be available in Phase 3.</p>
      </section>

      <section className="rounded-lg border bg-white p-6 shadow-sm space-y-3">
        <h3 className="font-medium text-gray-700">Report</h3>
        <p className="text-sm text-gray-400">Report generation will be available in Phase 4.</p>
      </section>
    </div>
  );
}
