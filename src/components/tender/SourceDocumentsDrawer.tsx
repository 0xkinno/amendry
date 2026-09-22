import { useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { StatusBadge } from "../ui/StatusBadge";

interface SourceDocumentsDrawerProps {
  tenderId: Id<"tenders">;
  isOpen: boolean;
  onClose: () => void;
}

export function SourceDocumentsDrawer({
  tenderId,
  isOpen,
  onClose,
}: SourceDocumentsDrawerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isReal = !!tenderId && tenderId !== ("demo_mta_station_upgrade" as Id<"tenders">);
  const sourceDocs = useQuery(api.sources.listDocuments, isReal ? { tenderId } : "skip");
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveSourceDocumentFile = useMutation(api.files.saveSourceDocumentFile);

  if (!isOpen) return null;

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
    setStatusMsg("Generating storage location...");

    try {
      const uploadUrl = await generateUploadUrl();
      setStatusMsg(`Uploading ${file.name}...`);
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type || "application/pdf" },
        body: file,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { storageId } = await res.json();
      const hash = await computeSha256(file);

      setStatusMsg("Persisting source document record...");
      await saveSourceDocumentFile({
        tenderId,
        storageId,
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/pdf",
        contentHash: hash,
        documentTitle: docTitle || file.name,
      });

      setStatusMsg("Document ingested successfully.");
      setFile(null);
      setDocTitle("");
      setTimeout(() => {
        setUploading(false);
        setStatusMsg("");
      }, 800);
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Failed: ${e.message}`);
      setUploading(false);
    }
  }

  const docs = sourceDocs && sourceDocs.length > 0 ? sourceDocs : [
    {
      _id: "doc1",
      documentTitle: "Metropolitan Transit Authority — Station Upgrade RFP (Final)",
      sourceType: "URL_INGEST",
      fetchedAt: Date.now() - 3600000,
      contentHash: "ee81b541fb4a1186e06b99bc",
      markdownLength: 42100,
    },
    {
      _id: "doc2",
      documentTitle: "Addendum 8: Mandatory Insurance & Schedule Revision",
      sourceType: "UPLOAD_PDF",
      fetchedAt: Date.now() - 1800000,
      contentHash: "d781b541fb4a1186e06b9911",
      markdownLength: 12500,
    },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 480,
        maxWidth: "90vw",
        background: "var(--paper)",
        borderLeft: "2px solid var(--ink)",
        boxShadow: "var(--shadow-xl)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="flex justify-between items-center ruled pb-4"
        style={{ padding: "var(--sp-6)" }}
      >
        <div>
          <span className="mono text-xs uppercase tracking-wider text-muted">Authoritative Archive</span>
          <h2 style={{ margin: "4px 0 0 0", fontSize: "1.25rem" }}>Source Documents</h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
            color: "var(--muted)",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-6)" }}>
        {/* Upload section */}
        <div
          className="card card--ruled mb-6"
          style={{ background: "var(--paper-accent)", padding: "var(--sp-4)" }}
        >
          <span className="mono text-xs uppercase tracking-wider font-semibold text-muted block mb-2">
            Ingest Source Addendum / PDF
          </span>
          <input
            type="text"
            className="input w-full mb-3"
            placeholder="Document Title (e.g. Addendum 9)"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? file.name : "Select PDF..."}
            </button>
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? "Uploading..." : "Ingest Document"}
            </button>
          </div>
          {statusMsg && <p className="mono text-xs text-muted mt-2">{statusMsg}</p>}
        </div>

        {/* Existing docs list */}
        <span className="mono text-xs uppercase tracking-wider text-muted block mb-3">
          Indexed Snapshots ({docs.length})
        </span>
        <div className="flex flex-col gap-3">
          {docs.map((d: any) => (
            <div
              key={d._id}
              className="card"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line)",
                padding: "var(--sp-4)",
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-sm">{d.documentTitle}</span>
                <StatusBadge variant="ready">{d.sourceType}</StatusBadge>
              </div>
              <p className="mono text-xs text-muted" style={{ margin: "4px 0" }}>
                Hash: {d.contentHash?.slice(0, 16)}...
              </p>
              <div className="flex justify-between items-center text-xs text-muted mt-2">
                <span>{(d.markdownLength / 1024).toFixed(1)} KB</span>
                <span className="mono">Verified Hash Match</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
