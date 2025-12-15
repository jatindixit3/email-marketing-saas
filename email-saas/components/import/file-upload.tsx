'use client';

// File Upload Component with Drag & Drop

import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export function FileUpload({
  onFileSelect,
  accept = '.csv',
  maxSize = 10 * 1024 * 1024, // 10MB default
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null);

      // Check file type
      if (!file.name.endsWith('.csv')) {
        setError('Only CSV files are supported');
        return false;
      }

      // Check file size
      if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
        setError(`File size exceeds ${maxMB}MB limit`);
        return false;
      }

      return true;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-12 text-center
            transition-all duration-200 cursor-pointer
            ${
              isDragOver
                ? 'border-teal-400 bg-teal-500/5'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`
              p-4 rounded-full transition-colors
              ${isDragOver ? 'bg-teal-500/20' : 'bg-white/5'}
            `}
            >
              <Upload
                className={`w-8 h-8 ${isDragOver ? 'text-teal-400' : 'text-white/40'}`}
              />
            </div>

            <div>
              <p className="text-lg font-medium text-white mb-1">
                {isDragOver ? 'Drop your CSV file here' : 'Upload CSV file'}
              </p>
              <p className="text-sm text-white/60">
                Drag and drop or click to browse
              </p>
            </div>

            <div className="text-xs text-white/40">
              Maximum file size: {formatFileSize(maxSize)}
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-white/10 rounded-lg p-4 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-teal-500/20">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-white/60">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            <button
              onClick={handleRemove}
              className="p-2 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
