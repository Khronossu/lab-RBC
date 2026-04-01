const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

export interface Patient {
  id: number;
  name: string;
  age: number;
  sex: string;
  patient_code: string;
  requesting_physician: string;
  lab_technician: string;
  specimen_type: string;
  created_at: string;
}

export interface TestRecord {
  id: number;
  patient_id: number;
  test_date: string;
  status: string;
  images: Image[];
  rbc_results: RBCResult[];
  report: Report | null;
}

export interface Image {
  id: number;
  filename: string;
  original_path: string;
  annotated_path: string | null;
  uploaded_at: string;
}

export interface RBCResult {
  id: number;
  image_id: number;
  rbc_count: number;
  metadata_: Record<string, unknown>;
}

export interface Report {
  id: number;
  content: string;
  pdf_path: string | null;
  generated_at: string;
}

export const createPatient = (data: Omit<Patient, "id" | "created_at">) =>
  apiFetch<Patient>("/patients", { method: "POST", body: JSON.stringify(data) });

export const createTest = (patient_id: number) =>
  apiFetch<TestRecord>("/tests", { method: "POST", body: JSON.stringify({ patient_id }) });

export async function uploadImages(test_id: number, files: File[]): Promise<TestRecord> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${BASE}/tests/${test_id}/images`, { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json();
}
