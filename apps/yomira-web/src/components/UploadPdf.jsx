import { useState } from "react";
import { uploadPdf } from "../api/documentApi";
import PdfPreview from "./PdfPreview";

export default function UploadPdf({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

    setLoading(true);
    setError(null);

    try {
      const response = await uploadPdf(file);
      onUploaded(response.id, file.name);
    } catch (err) {
      setError("Failed to upload PDF. Please make sure the document service is running.");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    validateFile(event.dataTransfer.files[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="upload-workflow">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="upload-layout">
        <label className={`upload-area ${file ? "active" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />
          <span className="upload-symbol">PDF</span>
          <strong>{file ? file.name : "Drop your PDF here"}</strong>
          <p>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB ready to read` : "Browse or drag one source document into Yomira."}</p>
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

      <button className="primary-button" onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Reading document..." : "Read this document"}
      </button>
    </div>
  );
}
