import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface MedicalDocument {
  id: string;
  userId?: string;
  title: string;
  documentType: "prescription" | "report" | "discharge_summary" | "other";
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  doctorName?: string;
  clinic?: string;
}

const LOCAL_DOCUMENTS_KEY = "aerva_medical_documents";

const DEFAULT_DOCUMENTS: MedicalDocument[] = [
  {
    id: "doc-1",
    title: "Pulmonary & Asthma Care Plan",
    documentType: "prescription",
    doctorName: "Dr. A. K. Khurana",
    clinic: "Chest & Allergy Center, Gurgaon",
    filePath: "/sample-prescriptions/asthma-plan.pdf",
    fileType: "application/pdf",
    fileSize: 420000,
    uploadedAt: "12 Aug 2026",
  },
  {
    id: "doc-2",
    title: "Cardiac Health Screening (ECG & Echo)",
    documentType: "report",
    doctorName: "Dr. S. Mukherjee",
    clinic: "Apollo Health City",
    filePath: "/sample-prescriptions/ecg-report.pdf",
    fileType: "application/pdf",
    fileSize: 850000,
    uploadedAt: "05 Jul 2026",
  },
];

export const documentService = {
  // Get list of prescriptions and medical documents
  async getDocuments(userId?: string): Promise<MedicalDocument[]> {
    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { data, error } = await supabase
          .from("medical_documents")
          .select("*")
          .eq("user_id", userId)
          .order("uploaded_at", { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            title: d.title,
            documentType: d.document_type,
            filePath: d.file_path,
            fileType: d.file_type,
            fileSize: d.file_size,
            uploadedAt: new Date(d.uploaded_at).toLocaleDateString("en-IN"),
          }));
        }
      } catch (e) {
        console.warn("Error fetching documents from Supabase:", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_DOCUMENTS_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }

    return DEFAULT_DOCUMENTS;
  },

  // Upload a new document (File)
  async uploadDocument(
    file: File,
    title: string,
    documentType: "prescription" | "report" | "discharge_summary" | "other",
    userId?: string
  ): Promise<MedicalDocument> {
    let filePath = "";

    if (isSupabaseConfigured && supabase) {
      try {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
        const bucket = documentType === "prescription" ? "patient-prescriptions" : "patient-medical-documents";
        const { data: storageData, error: storageErr } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (!storageErr && storageData) {
          const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(fileName);
          filePath = pubData.publicUrl;

          // Insert into database
          if (userId) {
            await supabase.from("medical_documents").insert({
              user_id: userId,
              title,
              document_type: documentType,
              file_path: filePath,
              file_type: file.type,
              file_size: file.size,
            });
          }
        }
      } catch (e) {
        console.warn("Error uploading file to Supabase storage, using blob URL:", e);
      }
    }

    // Fallback URL using object URL
    if (!filePath) {
      filePath = URL.createObjectURL(file);
    }

    const newDoc: MedicalDocument = {
      id: `doc-${Date.now()}`,
      userId,
      title,
      documentType,
      filePath,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };

    if (typeof window !== "undefined") {
      const current = await documentService.getDocuments(userId);
      const updated = [newDoc, ...current];
      localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(updated));
    }

    return newDoc;
  },

  // Delete a document
  async deleteDocument(id: string, userId?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("medical_documents").delete().eq("id", id);
      } catch (e) {
        console.warn("Error deleting from Supabase:", e);
      }
    }

    if (typeof window !== "undefined") {
      const current = await documentService.getDocuments(userId);
      const filtered = current.filter((d) => d.id !== id);
      localStorage.setItem(LOCAL_DOCUMENTS_KEY, JSON.stringify(filtered));
    }
  },
};
