'use client';

// Contact Import Wizard
// Multi-step wizard for importing contacts from CSV

import React, { useState } from 'react';
import { FileUpload } from './file-upload';
import { ColumnMappingComponent } from './column-mapping';
import {
  Check,
  Upload,
  MapPin,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  ImportState,
  ImportStep,
  ImportPreview,
  ColumnMapping,
  ImportConfig,
  ImportSummary,
} from '@/types/import';

const STEPS: { id: ImportStep; label: string }[] = [
  { id: 'upload', label: 'Upload File' },
  { id: 'mapping', label: 'Map Columns' },
  { id: 'preview', label: 'Preview' },
  { id: 'import', label: 'Import' },
  { id: 'complete', label: 'Complete' },
];

export function ContactImportWizard() {
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    preview: null,
    config: {
      skipDuplicates: true,
      updateExisting: false,
      columnMappings: [],
    },
    summary: null,
    isProcessing: false,
    progress: 0,
    error: null,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === state.step);

  // Step 1: Handle file upload and get preview
  const handleFileSelect = async (file: File) => {
    setState((prev) => ({ ...prev, file, isProcessing: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/contacts/import/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      const preview: ImportPreview = data.preview;

      setState((prev) => ({
        ...prev,
        preview,
        config: {
          ...prev.config,
          columnMappings: preview.suggestedMappings,
        },
        step: 'mapping',
        isProcessing: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isProcessing: false,
      }));
    }
  };

  // Step 2: Handle column mappings
  const handleMappingsChange = (mappings: ColumnMapping[]) => {
    setState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        columnMappings: mappings,
      },
    }));
  };

  const handleMappingNext = () => {
    setState((prev) => ({ ...prev, step: 'preview' }));
  };

  // Step 3: Handle import
  const handleImport = async () => {
    if (!state.file) return;

    setState((prev) => ({ ...prev, isProcessing: true, step: 'import', error: null }));

    try {
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('config', JSON.stringify(state.config));

      const response = await fetch('/api/contacts/import/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import contacts');
      }

      const summary: ImportSummary = data.summary;

      setState((prev) => ({
        ...prev,
        summary,
        step: 'complete',
        isProcessing: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        isProcessing: false,
      }));
    }
  };

  const handleBack = () => {
    const steps: ImportStep[] = ['upload', 'mapping', 'preview', 'import'];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex > 0) {
      setState((prev) => ({ ...prev, step: steps[currentIndex - 1] }));
    }
  };

  const handleReset = () => {
    setState({
      step: 'upload',
      file: null,
      preview: null,
      config: {
        skipDuplicates: true,
        updateExisting: false,
        columnMappings: [],
      },
      summary: null,
      isProcessing: false,
      progress: 0,
      error: null,
    });
  };

  const hasEmailMapping =
    state.config.columnMappings.some((m) => m.contactField === 'email');

  return (
    <div className="min-h-screen">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-200
                    ${
                      isCompleted
                        ? 'bg-teal-500 text-white'
                        : isActive
                          ? 'bg-teal-500 text-white'
                          : 'bg-white/10 text-white/40'
                    }
                  `}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <p
                    className={`
                    text-xs font-medium
                    ${isActive || isCompleted ? 'text-white' : 'text-white/40'}
                  `}
                  >
                    {step.label}
                  </p>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`
                    flex-1 h-0.5 mx-4
                    transition-colors duration-200
                    ${isCompleted ? 'bg-teal-500' : 'bg-white/10'}
                  `}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{state.error}</p>
          </div>
        </div>
      )}

      {/* Step Content */}
      {state.step === 'upload' && (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Upload Contact List
            </h2>
            <p className="text-white/60">
              Upload a CSV file containing your contacts
            </p>
          </div>

          <FileUpload onFileSelect={handleFileSelect} />

          {state.isProcessing && (
            <div className="mt-6 text-center">
              <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-white/60">Processing file...</p>
            </div>
          )}
        </div>
      )}

      {state.step === 'mapping' && state.preview && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Map Columns</h2>
            <p className="text-white/60">
              Map CSV columns to contact fields
            </p>
          </div>

          <ColumnMappingComponent
            headers={state.preview.headers}
            initialMappings={state.preview.suggestedMappings}
            sampleData={state.preview.sampleData}
            onMappingsChange={handleMappingsChange}
          />

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded border border-white/10 text-white hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleMappingNext}
              disabled={!hasEmailMapping}
              className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-teal-400 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Preview
            </button>
          </div>
        </div>
      )}

      {state.step === 'preview' && state.preview && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Preview Import</h2>
            <p className="text-white/60">
              Review your import before processing
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Total Rows</p>
              <p className="text-2xl font-bold text-white">
                {state.preview.totalRows}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Valid</p>
              <p className="text-2xl font-bold text-teal-400">
                {state.preview.validRows}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Duplicates</p>
              <p className="text-2xl font-bold text-yellow-400">
                {state.preview.duplicateRows}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Invalid</p>
              <p className="text-2xl font-bold text-red-400">
                {state.preview.invalidRows}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-white mb-4">Import Options</h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={state.config.skipDuplicates}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        skipDuplicates: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-white">Skip duplicate emails</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={state.config.updateExisting}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        updateExisting: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-white">Update existing contacts</span>
              </label>
            </div>
          </div>

          {/* Errors */}
          {state.preview.errors.length > 0 && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h3 className="text-sm font-medium text-red-400 mb-2">
                Validation Errors ({state.preview.errors.length})
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {state.preview.errors.slice(0, 10).map((error, index) => (
                  <p key={index} className="text-xs text-red-400/80">
                    Row {error.row}: {error.error}
                  </p>
                ))}
                {state.preview.errors.length > 10 && (
                  <p className="text-xs text-red-400/60">
                    And {state.preview.errors.length - 10} more...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded border border-white/10 text-white hover:bg-white/5 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-teal-400 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Import Contacts
            </button>
          </div>
        </div>
      )}

      {state.step === 'import' && (
        <div className="text-center py-12">
          <Loader2 className="w-16 h-16 text-teal-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Importing Contacts...</h2>
          <p className="text-white/60">Please wait while we process your import</p>
        </div>
      )}

      {state.step === 'complete' && state.summary && (
        <div className="text-center">
          <div className="inline-flex p-4 rounded-full bg-teal-500/20 mb-6">
            <CheckCircle className="w-16 h-16 text-teal-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Import Complete!</h2>
          <p className="text-white/60 mb-8">
            Your contacts have been imported successfully
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Created</p>
              <p className="text-2xl font-bold text-teal-400">
                {state.summary.created}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Updated</p>
              <p className="text-2xl font-bold text-purple-400">
                {state.summary.updated}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Skipped</p>
              <p className="text-2xl font-bold text-yellow-400">
                {state.summary.skipped}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-400">
                {state.summary.failed}
              </p>
            </div>
          </div>

          <div className="text-xs text-white/40 mb-6">
            Completed in {(state.summary.duration / 1000).toFixed(1)}s
          </div>

          <button
            onClick={handleReset}
            className="px-6 py-2 rounded bg-gradient-to-r from-teal-400 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Import More Contacts
          </button>
        </div>
      )}
    </div>
  );
}
