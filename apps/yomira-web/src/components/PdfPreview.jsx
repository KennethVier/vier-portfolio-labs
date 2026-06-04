export default function PdfPreview({ file }) {
  return (
    <div className="pdf-preview">
      <embed src={URL.createObjectURL(file)} type="application/pdf" width="100%" height="420px" />
    </div>
  );
}
