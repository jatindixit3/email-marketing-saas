'use client';

// Campaign Email Builder Page
// Create and edit email designs for campaigns

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { EmailBuilder } from '@/components/email-builder/email-builder';
import { TemplateSelector } from '@/components/email-builder/template-selector';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { EmailDesign, UnlayerDesign } from '@/types/email-builder';

export default function CampaignBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const designId = searchParams.get('designId');

  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState<UnlayerDesign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [campaignName, setCampaignName] = useState('');

  // Load existing design if designId is provided
  useEffect(() => {
    if (designId) {
      loadDesign(designId);
    }
  }, [designId]);

  // Load campaign info
  useEffect(() => {
    if (campaignId) {
      loadCampaignInfo(campaignId);
    }
  }, [campaignId]);

  async function loadDesign(id: string) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/email-designs/${id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedDesign(data.design.design);
        setShowTemplateSelector(false);
      }
    } catch (error) {
      console.error('Error loading design:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCampaignInfo(id: string) {
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      const data = await response.json();

      if (data.success) {
        setCampaignName(data.campaign.name);
      }
    } catch (error) {
      console.error('Error loading campaign:', error);
    }
  }

  function handleTemplateSelect(template: EmailDesign) {
    setSelectedDesign(template.design);
    setShowTemplateSelector(false);
  }

  function handleCreateBlank() {
    setSelectedDesign(null);
    setShowTemplateSelector(false);
  }

  async function handleSave(design: UnlayerDesign, html: string) {
    setIsLoading(true);

    try {
      if (campaignId) {
        // Save to campaign
        const response = await fetch(`/api/campaigns/${campaignId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            html_content: html,
            design_json: design,
          }),
        });

        if (response.ok) {
          alert('Campaign design saved successfully!');
          router.push(`/dashboard/campaigns/${campaignId}`);
        }
      } else {
        // Save as new design
        const designName = prompt('Enter a name for this design:');

        if (designName) {
          const response = await fetch('/api/email-designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: designName,
              design,
              html,
              isTemplate: false,
            }),
          });

          if (response.ok) {
            alert('Design saved successfully!');
            router.push('/dashboard/campaigns');
          }
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save design');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendTest(html: string) {
    const testEmail = prompt('Enter test email address:');

    if (!testEmail) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/campaigns/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId || 'test',
          testEmail,
        }),
      });

      if (response.ok) {
        alert(`Test email sent to ${testEmail}`);
      } else {
        alert('Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test:', error);
      alert('Failed to send test email');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        {!showTemplateSelector && (
          <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/40">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="p-2 rounded hover:bg-white/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>

            <div>
              <h1 className="text-lg font-semibold text-white">
                {campaignName || 'Email Builder'}
              </h1>
              <p className="text-sm text-white/60">
                Design your email template
              </p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
          ) : showTemplateSelector ? (
            <TemplateSelector
              onSelect={handleTemplateSelect}
              onCreateBlank={handleCreateBlank}
            />
          ) : (
            <EmailBuilder
              initialDesign={selectedDesign}
              onSave={handleSave}
              onSend={handleSendTest}
              saveButtonText={campaignId ? 'Save to Campaign' : 'Save Design'}
              showSendButton={!!campaignId}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
