"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createPatient, createTest, uploadImages } from "@/lib/api";

const SPECIMEN_TYPES = ["Whole Blood", "Peripheral Blood Smear", "Capillary Blood"];
const SEX_OPTIONS = ["Male", "Female", "Other"];

export default function NewTestPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    age: "",
    sex: "Male",
    patient_code: "",
    requesting_physician: "",
    lab_technician: "",
    specimen_type: "Whole Blood",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) { setError("Please upload at least one image."); return; }
    setError(null);
    setLoading(true);
    try {
      const patient = await createPatient({ ...form, age: Number(form.age) });
      const test = await createTest(patient.id);
      const updated = await uploadImages(test.id, files);
      router.push(`/tests/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">New Test</h2>
        <p className="text-sm text-gray-500">Enter patient details and upload blood smear images.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Demographics */}
        <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-medium text-gray-700">Patient Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name" name="name" value={form.name} onChange={handleField} required />
            <Field label="Patient Code / ID" name="patient_code" value={form.patient_code} onChange={handleField} required />
            <Field label="Age" name="age" type="number" value={form.age} onChange={handleField} required min="0" max="150" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Sex</label>
              <select name="sex" value={form.sex} onChange={handleField} className={selectClass}>
                {SEX_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Lab Metadata */}
        <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-medium text-gray-700">Lab Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Requesting Physician" name="requesting_physician" value={form.requesting_physician} onChange={handleField} required />
            <Field label="Lab Technician" name="lab_technician" value={form.lab_technician} onChange={handleField} required />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Specimen Type</label>
              <select name="specimen_type" value={form.specimen_type} onChange={handleField} className={selectClass}>
                {SPECIMEN_TYPES.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Image Upload */}
        <section className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-medium text-gray-700">Blood Smear Images</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-center hover:border-blue-400 transition-colors"
          >
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, TIFF — multiple files supported</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={files[i]?.name} className="h-28 w-full rounded-md object-cover border" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs"
                  >
                    ✕
                  </button>
                  <p className="mt-1 truncate text-xs text-gray-400">{files[i]?.name}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/")} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={btnPrimary}>
            {loading ? "Saving…" : "Create Test"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const selectClass = `${inputClass} bg-white`;
const btnPrimary =
  "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors";
const btnSecondary =
  "rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
}
function Field({ label, ...props }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input className={inputClass} {...props} />
    </div>
  );
}
