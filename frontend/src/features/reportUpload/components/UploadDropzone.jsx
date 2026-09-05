import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function UploadDropzone({ onFileSelected, isUploading = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const validateFile = useCallback((file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError(`File type "${extension}" is not supported. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`);
      return false;
    }
    setError('');
    return true;
  }, []);

  const handleFile = useCallback((file) => {
    if (!file || isUploading) return;
    if (validateFile(file)) {
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [isUploading, validateFile, onFileSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!isUploading) setIsDragOver(true);
  }, [isUploading]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleBrowseClick = () => {
    if (!isUploading) inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
    e.target.value = '';
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError('');
    onFileSelected(null);
  };

  return (
    <div
      style={{
        borderRadius: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        backgroundColor: '#FFFFFF',
        padding: '24px',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {!selectedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleBrowseClick}
          style={{
            border: `2px dashed ${isDragOver ? '#4F46E5' : '#CBD5E1'}`,
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            backgroundColor: isDragOver ? 'rgba(79, 70, 229, 0.04)' : 'transparent',
            transition: 'all 0.2s ease',
            opacity: isUploading ? 0.5 : 1,
          }}
        >
          <Upload
            size={40}
            color="#4F46E5"
            style={{ margin: '0 auto 16px', display: 'block' }}
          />
          <p style={{ color: '#1E293B', fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>
            {isUploading ? 'Uploading...' : 'Drag & drop your report here'}
          </p>
          <p style={{ color: '#64748B', fontSize: '14px', margin: '0 0 16px' }}>
            or click to browse files
          </p>
          <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
            Supported: JPG, JPEG, PNG, PDF
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            backgroundColor: 'rgba(79, 70, 229, 0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(79, 70, 229, 0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <FileText size={24} color="#4F46E5" style={{ flexShrink: 0 }} />
            <span
              style={{
                color: '#1E293B',
                fontSize: '14px',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedFile.name}
            </span>
          </div>
          {!isUploading && (
            <button
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
              aria-label="Remove file"
            >
              <X size={18} color="#64748B" />
            </button>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '12px', margin: '12px 0 0' }}>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_TYPES.join(',')}
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
