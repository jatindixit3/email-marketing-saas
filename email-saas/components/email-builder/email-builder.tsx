'use client';

// Email Builder Component using Unlayer
// Provides visual email design with merge tags support

import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Save, Eye, Send, Loader2, Download } from 'lucide-react';
import { getUnlayerMergeTags, replaceMergeTags, getSampleMergeData } from '@/lib/email-builder/merge-tags';
import type { UnlayerDesign, PreviewMode } from '@/types/email-builder';

// Dynamically import EmailEditor to avoid SSR issues
const EmailEditor = dynamic(
  () => import('react-email-editor').then((mod) => mod.EmailEditor),
  { ssr: false }
);

interface EmailBuilderProps {
  initialDesign?: UnlayerDesign | null;
  onSave?: (design: UnlayerDesign, html: string) => void;
  onSend?: (html: string) => void;
  saveButtonText?: string;
  showSendButton?: boolean;
  projectId?: number;
}

export function EmailBuilder({
  initialDesign,
  onSave,
  onSend,
  saveButtonText = 'Save Design',
  showSendButton = false,
  projectId,
}: EmailBuilderProps) {
  const emailEditorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');

  // Load design when component mounts
  useEffect(() => {
    if (emailEditorRef.current && initialDesign) {
      const editor = emailEditorRef.current.editor;
      if (editor) {
        editor.loadDesign(initialDesign);
      }
    }
  }, [initialDesign]);

  const onReady = useCallback(() => {
    const editor = emailEditorRef.current?.editor;

    if (!editor) return;

    console.log('Email editor ready');

    // Load initial design if provided
    if (initialDesign) {
      editor.loadDesign(initialDesign);
    }
  }, [initialDesign]);

  const handleSave = async () => {
    if (!emailEditorRef.current) return;

    setIsSaving(true);

    try {
      const editor = emailEditorRef.current.editor;

      editor.exportHtml(async (data: { design: UnlayerDesign; html: string }) => {
        const { design, html } = data;

        if (onSave) {
          await onSave(design, html);
        }

        setIsSaving(false);
      });
    } catch (error) {
      console.error('Error saving design:', error);
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!emailEditorRef.current) return;

    const editor = emailEditorRef.current.editor;

    editor.exportHtml((data: { html: string }) => {
      // Replace merge tags with sample data
      const sampleData = getSampleMergeData();
      const processedHtml = replaceMergeTags(data.html, sampleData as any);

      setPreviewHtml(processedHtml);
      setShowPreview(true);
    });
  };

  const handleSendTest = async () => {
    if (!emailEditorRef.current || !onSend) return;

    setIsLoading(true);

    try {
      const editor = emailEditorRef.current.editor;

      editor.exportHtml(async (data: { html: string }) => {
        await onSend(data.html);
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error sending test:', error);
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!emailEditorRef.current) return;

    const editor = emailEditorRef.current.editor;

    editor.exportHtml((data: { html: string }) => {
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'email-template.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="px-4 py-2 rounded border border-white/10 text-white text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2 rounded border border-white/10 text-white text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export HTML
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showSendButton && (
            <button
              onClick={handleSendTest}
              disabled={isLoading}
              className="px-4 py-2 rounded border border-white/10 text-white text-sm hover:bg-white/5 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send Test
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded bg-gradient-to-r from-teal-400 to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saveButtonText}
          </button>
        </div>
      </div>

      {/* Email Editor */}
      <div className="flex-1 relative">
        <EmailEditor
          ref={emailEditorRef}
          onReady={onReady}
          projectId={projectId}
          options={{
            locale: 'en',
            appearance: {
              theme: 'dark',
              panels: {
                tools: {
                  dock: 'left',
                },
              },
            },
            mergeTags: getUnlayerMergeTags(),
            displayMode: 'email',
            features: {
              preview: true,
              imageEditor: true,
            },
          }}
          style={{ height: '100%' }}
        />
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Email Preview</h3>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 p-1 bg-white/5 rounded">
                  <button
                    onClick={() => setPreviewMode('desktop')}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      previewMode === 'desktop'
                        ? 'bg-teal-500 text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setPreviewMode('mobile')}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      previewMode === 'mobile'
                        ? 'bg-teal-500 text-white'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Mobile
                  </button>
                </div>

                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 rounded border border-white/10 text-white text-sm hover:bg-white/5 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-900 to-black">
              <div
                className={`mx-auto bg-white transition-all duration-300 ${
                  previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'
                }`}
              >
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-[600px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
