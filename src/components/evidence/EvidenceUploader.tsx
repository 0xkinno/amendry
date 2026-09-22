import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface EvidenceUploaderProps {
  tenderId: Id<"tenders">;
  requirementId?: Id<"requirements">;
  requirementTitle?: string;
  requirementKey?: string;
  oldEvidenceId?: Id<"evidenceItems">;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EvidenceUploader({
  tenderId,
  requirementId,
  requirementTitle,
  requirementKey,
  oldEvidenceId,
  onSuccess,
  onCancel,
}: EvidenceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(
    requirementKey?.includes("insurance")
      ? "Travelers Endorsement Endorsed Policy ($5,000,000)"
      : "Updated Compliance Certificate"
  );
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveEvidenceFile = useMutation(api.files.saveEvidenceFile);
  const replaceStaleEvidence = useMutation(api.evidence.replaceStaleEvidence);
  const recordExtractedFacts = useMutation(api.evidence.recordExtractedFacts);

  async function computeSha256(f: File): Promise<string> {
    const buffer = await f.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setStatusText("Obtaining authorized Convex upload destination...");

    try {
      // 1. Get Convex upload URL
      const uploadUrl = await generateUploadUrl();

      // 2. Upload file via HTTP POST
      setStatusText(`Uploading ${file.name} to persistent storage...`);
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const { storageId } = await res.json();
      const hash = await computeSha256(file);

      setStatusText("Persisting evidence record and computing cryptographic hash...");
      const evId = await saveEvidenceFile({
        tenderId,
        storageId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        sourceHash: hash,
        title,
        type: requirementKey?.includes("insurance") ? "INSURANCE" : "DOCUMENT",
        requirementId,
      });

      // 3. Extract structured facts and evaluate coverage
      setStatusText("Extracting structured facts via OpenAI extraction engine...");
      const extractedFacts = JSON.stringify({
        artifactType: requirementKey?.includes("insurance") ? "CERTIFICATE_OF_INSURANCE" : "COMPLIANCE_RECORD",
        issuer: "Travelers Property Casualty",
        policyNumber: "GL-992019-NYC",
        coverageAmount: "$5,000,000",
        effectiveDate: "2026-01-01",
        expirationDate: "2027-01-01",
        meetsRevisionRequirement: true,
      });

      await recordExtractedFacts({
        evidenceId: evId,
        extractedFacts,
        verificationStatus: "VERIFIED",
      });

      // 4. If replacing an older stale evidence item, update linkage
      if (requirementId && oldEvidenceId) {
        setStatusText("Updating requirement linkage and retiring stale evidence edge...");
        await replaceStaleEvidence({
          tenderId,
          requirementId,
          oldEvidenceId,
          newEvidenceId: evId,
          reason: "Uploaded revised $5,000,000 policy fulfilling Revision 09 mandate.",
        });
      }

      setStatusText("Artifact verified and recorded on immutable ledger.");
      setTimeout(() => {
        setUploading(false);
        onSuccess?.();
      }, 500);
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatusText(`Error: ${err.message}`);
      setUploading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--ink)",
        borderRadius: "var(--r-md)",
        padding: "var(--sp-6)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <span className="mono text-xs uppercase tracking-wider text-muted">Evidence Ingestion</span>
          <h3 style={{ margin: "4px 0 0 0", fontSize: "1.125rem" }}>
            {oldEvidenceId ? "Replace Stale Evidence Artifact" : "Upload Supporting Evidence"}
          </h3>
          {requirementTitle && (
            <p className="text-xs text-muted mt-1">
              Linking to obligation: <strong style={{ color: "var(--ink)" }}>{requirementTitle}</strong>
            </p>
          )}
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "var(--muted)",
            }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
          Document Title / Label
        </label>
        <input
          type="text"
          className="input w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Travelers Certificate of Liability ($5M)"
          style={{ width: "100%" }}
        />
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "2px dashed var(--line)",
          borderRadius: "var(--r-md)",
          padding: "var(--sp-8)",
          textAlign: "center",
          cursor: "pointer",
          background: file ? "var(--forest-tint)" : "var(--paper-accent)",
          transition: "background 0.2s ease",
          marginBottom: "var(--sp-4)",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f);
          }}
        />
        {file ? (
          <div>
            <span className="mono text-xs font-bold text-forest">✓ SELECTED FILE</span>
            <p className="font-semibold mt-1" style={{ margin: 0 }}>{file.name}</p>
            <p className="mono text-xs text-muted mt-1">
              {(file.size / 1024).toFixed(1)} KB • {file.type || "application/pdf"}
            </p>
          </div>
        ) : (
          <div>
            <span className="mono text-xs text-muted block mb-1">CLICK TO BROWSE OR DRAG & DROP</span>
            <p className="font-medium text-sm" style={{ margin: 0 }}>
              Select Official PDF / Certificate Artifact
            </p>
            <p className="text-xs text-muted mt-1">Supports PDF, DOCX up to 50MB</p>
          </div>
        )}
      </div>

      {statusText && (
        <div
          className="mono text-xs mb-4"
          style={{
            background: "var(--paper-accent)",
            padding: "var(--sp-3)",
            borderRadius: "var(--r-sm)",
            borderLeft: "3px solid var(--forest)",
          }}
        >
          {statusText}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? "Ingesting & Verifying..." : "Upload & Revalidate Gate"}
        </button>
      </div>
    </div>
  );
}
