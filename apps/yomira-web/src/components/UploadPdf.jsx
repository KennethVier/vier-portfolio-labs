import { useRef, useState } from "react";
import { uploadPdf } from "../api/documentApi";
import PdfPreview from "./PdfPreview";
import AsyncProgress from "./AsyncProgress";
import useBoundedProgress from "./useBoundedProgress";

const preparationStages = [
  { until: 20, label: "Uploading source", detail: "Uploading your PDF securely..." },
  { until: 65, label: "Reading document", detail: "Reading and preparing your PDF for study..." },
  { until: 90, label: "Preparing study content", detail: "Extracting the most useful study content..." },
  { until: 100, label: "Finalizing", detail: "Finalizing your prepared document..." }
];

export default function UploadPdf({ onUploaded, onDemo }) {
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle");
  const [preparedDocument, setPreparedDocument] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [progress, setProgress] = useBoundedProgress(phase === "preparing");

  const validateFile = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      setFile(null);
      return;
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB.");
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const handleFileChange = (event) => validateFile(event.target.files[0]);

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (phase === "preparing") return;
    setProgress(4);
    setPhase("preparing");
    setError(null);

    try {
      const response = await uploadPdf(file);
      setProgress(100);
      setPreparedDocument({ id: response.id, name: file.name });
      setPhase("ready");
    } catch (err) {
      setError("Yomira couldn't prepare this document.");
      setPhase("error");
      console.error("Upload error:", err);
    }
  };

  const handleChooseAnother = () => {
    setFile(null);
    setPreparedDocument(null);
    setError(null);
    setPhase("idle");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (phase !== "preparing") validateFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="upload-workflow">
      {phase === "preparing" && (
        <AsyncProgress title="Preparing your document" progress={progress} stages={preparationStages} context={file.name} />
      )}

      {phase === "ready" && (
        <div className="completion-state" aria-live="polite">
          <AsyncProgress title="Document ready" progress={100} stages={preparationStages} context={preparedDocument.name} />
          <p><strong>{preparedDocument.name}</strong> is ready for quiz generation.</p>
          <button className="primary-button" type="button" onClick={() => onUploaded(preparedDocument.id, preparedDocument.name)}>
            Choose quiz settings
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="failure-state" role="alert">
          <span className="eyebrow">Preparation stopped</span>
          <h3>{error}</h3>
          <p>Your selected PDF is still available. Try again, or choose a different file.</p>
          <div className="failure-actions">
            <button className="primary-button" type="button" onClick={handleUpload}>Try again</button>
            <button className="quiet-button" type="button" onClick={handleChooseAnother}>Choose another PDF</button>
          </div>
        </div>
      )}

      {(phase === "idle") && <>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className={`upload-layout ${file ? "has-preview" : "single-upload"}`}>
        <label className={`upload-area ${file ? "active" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver}>
          <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} />
          <span className="upload-symbol">PDF</span>
          <strong>{file ? file.name : "Drop your PDF here"}</strong>
          <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB ready to prepare` : "Browse or drag one source document into Yomira."}</p>
        </label>

        {file && (
          <div className="preview-panel">
            <div className="preview-header">
              <span className="eyebrow">Source preview</span>
              <strong>{file.name}</strong>
            </div>
            <PdfPreview file={file} />
          </div>
        )}
      </div>

      <div className="upload-actions">
        {onDemo && <button className="quiet-button" type="button" onClick={onDemo}>Use demo sample</button>}
        <button className="primary-button" type="button" onClick={handleUpload} disabled={!file}>
          Prepare document
        </button>
      </div>
      <p className="supporting-copy">Upload and prepare this PDF for quiz generation.</p>
      </>}
    </div>
  );
}
