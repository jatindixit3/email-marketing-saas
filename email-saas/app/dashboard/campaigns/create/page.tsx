"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Users,
  Layout,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4;

interface CampaignData {
  name: string;
  subject: string;
  selectedLists: number[];
  selectedTemplate: number | null;
  scheduleType: "now" | "later";
  scheduleDate: string;
  scheduleTime: string;
}

// Mock contact lists
const contactLists = [
  { id: 1, name: "All Subscribers", count: 2450 },
  { id: 2, name: "Newsletter Subscribers", count: 1823 },
  { id: 3, name: "VIP Customers", count: 156 },
  { id: 4, name: "Trial Users", count: 892 },
  { id: 5, name: "Inactive Users", count: 423 },
];

// Mock templates
const templates = [
  {
    id: 1,
    name: "Newsletter Template",
    thumbnail: "https://images.unsplash.com/photo-1557838923-2985c318be48?w=300&h=200&fit=crop",
    category: "Newsletter",
  },
  {
    id: 2,
    name: "Promotion Template",
    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=300&h=200&fit=crop",
    category: "Promotion",
  },
  {
    id: 3,
    name: "Product Launch",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=200&fit=crop",
    category: "Announcement",
  },
  {
    id: 4,
    name: "Welcome Email",
    thumbnail: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=300&h=200&fit=crop",
    category: "Welcome",
  },
];

const steps = [
  { number: 1, title: "Details", icon: Mail },
  { number: 2, title: "Recipients", icon: Users },
  { number: 3, title: "Template", icon: Layout },
  { number: 4, title: "Schedule", icon: Calendar },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: "",
    subject: "",
    selectedLists: [],
    selectedTemplate: null,
    scheduleType: "now",
    scheduleDate: "",
    scheduleTime: "",
  });

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return campaignData.name && campaignData.subject;
      case 2:
        return campaignData.selectedLists.length > 0;
      case 3:
        return campaignData.selectedTemplate !== null;
      case 4:
        return (
          campaignData.scheduleType === "now" ||
          (campaignData.scheduleDate && campaignData.scheduleTime)
        );
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleFinish = () => {
    // Here you would save the campaign
    console.log("Campaign data:", campaignData);
    router.push("/dashboard/campaigns");
  };

  const toggleList = (listId: number) => {
    setCampaignData((prev) => ({
      ...prev,
      selectedLists: prev.selectedLists.includes(listId)
        ? prev.selectedLists.filter((id) => id !== listId)
        : [...prev.selectedLists, listId],
    }));
  };

  const totalRecipients = contactLists
    .filter((list) => campaignData.selectedLists.includes(list.id))
    .reduce((sum, list) => sum + list.count, 0);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </button>
        <h1 className="text-2xl font-bold text-white">Create Campaign</h1>
        <p className="text-gray-400 mt-1">
          Follow the steps to create and launch your email campaign
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center relative">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted
                        ? "bg-teal-500 border-teal-500"
                        : isActive
                        ? "bg-teal-500/20 border-teal-500"
                        : "bg-white/5 border-white/20"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <StepIcon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-teal-400" : "text-gray-400"
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm mt-2 font-medium",
                      isActive || isCompleted ? "text-white" : "text-gray-400"
                    )}
                  >
                    {step.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-white/10 mx-4 mt-[-20px]">
                    <div
                      className={cn(
                        "h-full bg-teal-500 transition-all duration-300",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="max-w-3xl mx-auto bg-white/5 backdrop-blur-xl border-white/10 p-8">
        {/* Step 1: Campaign Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Campaign Details</h2>
              <p className="text-gray-400 text-sm">
                Give your campaign a name and write a compelling subject line
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Sale Newsletter"
                  value={campaignData.name}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, name: e.target.value })
                  }
                />
                <p className="text-xs text-gray-400">
                  This is for your reference only, recipients won't see this
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject Line</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Get 50% off this summer! ☀️"
                  value={campaignData.subject}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, subject: e.target.value })
                  }
                />
                <p className="text-xs text-gray-400">
                  Make it catchy! This is the first thing recipients will see
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Recipients */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Select Recipients</h2>
              <p className="text-gray-400 text-sm">
                Choose which contact lists should receive this campaign
              </p>
            </div>

            <div className="space-y-3">
              {contactLists.map((list) => (
                <div
                  key={list.id}
                  onClick={() => toggleList(list.id)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                    campaignData.selectedLists.includes(list.id)
                      ? "bg-teal-500/10 border-teal-500/50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={campaignData.selectedLists.includes(list.id)}
                      onChange={() => {}}
                    />
                    <div>
                      <p className="font-medium text-white">{list.name}</p>
                      <p className="text-sm text-gray-400">
                        {list.count.toLocaleString()} contacts
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </div>

            {totalRecipients > 0 && (
              <div className="mt-6 p-4 bg-teal-500/10 border border-teal-500/50 rounded-lg">
                <p className="text-sm text-teal-400">
                  <strong>{totalRecipients.toLocaleString()}</strong> total recipients
                  selected
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Choose Template */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Choose Template</h2>
              <p className="text-gray-400 text-sm">
                Select a template to start with or create from scratch
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Create from scratch option */}
              <button
                onClick={() =>
                  setCampaignData({ ...campaignData, selectedTemplate: 0 })
                }
                className={cn(
                  "p-4 rounded-lg border transition-all text-left",
                  campaignData.selectedTemplate === 0
                    ? "bg-teal-500/10 border-teal-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center mb-3">
                  <Layout className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-white text-sm">Blank Template</p>
                <p className="text-xs text-gray-400 mt-1">Start from scratch</p>
              </button>

              {/* Template options */}
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() =>
                    setCampaignData({ ...campaignData, selectedTemplate: template.id })
                  }
                  className={cn(
                    "p-4 rounded-lg border transition-all text-left",
                    campaignData.selectedTemplate === template.id
                      ? "bg-teal-500/10 border-teal-500/50"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  )}
                >
                  <div className="aspect-video bg-white/5 rounded-lg overflow-hidden mb-3">
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="font-medium text-white text-sm">{template.name}</p>
                  <Badge className="mt-2 text-xs bg-white/10 text-gray-300 border-0">
                    {template.category}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Schedule */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                Schedule Your Campaign
              </h2>
              <p className="text-gray-400 text-sm">
                Send your campaign now or schedule it for later
              </p>
            </div>

            <div className="space-y-4">
              {/* Send Now */}
              <button
                onClick={() =>
                  setCampaignData({ ...campaignData, scheduleType: "now" })
                }
                className={cn(
                  "w-full p-4 rounded-lg border transition-all text-left",
                  campaignData.scheduleType === "now"
                    ? "bg-teal-500/10 border-teal-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      campaignData.scheduleType === "now"
                        ? "border-teal-500"
                        : "border-white/20"
                    )}
                  >
                    {campaignData.scheduleType === "now" && (
                      <div className="w-3 h-3 rounded-full bg-teal-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">Send Now</p>
                    <p className="text-sm text-gray-400">
                      Campaign will be sent immediately
                    </p>
                  </div>
                </div>
              </button>

              {/* Schedule for Later */}
              <button
                onClick={() =>
                  setCampaignData({ ...campaignData, scheduleType: "later" })
                }
                className={cn(
                  "w-full p-4 rounded-lg border transition-all text-left",
                  campaignData.scheduleType === "later"
                    ? "bg-teal-500/10 border-teal-500/50"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      campaignData.scheduleType === "later"
                        ? "border-teal-500"
                        : "border-white/20"
                    )}
                  >
                    {campaignData.scheduleType === "later" && (
                      <div className="w-3 h-3 rounded-full bg-teal-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">Schedule for Later</p>
                    <p className="text-sm text-gray-400">
                      Choose a specific date and time
                    </p>
                  </div>
                </div>
              </button>

              {/* Date/Time Inputs */}
              {campaignData.scheduleType === "later" && (
                <div className="pl-8 space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={campaignData.scheduleDate}
                      onChange={(e) =>
                        setCampaignData({
                          ...campaignData,
                          scheduleDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={campaignData.scheduleTime}
                      onChange={(e) =>
                        setCampaignData({
                          ...campaignData,
                          scheduleTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="mt-8 p-6 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold text-white mb-4">Campaign Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Campaign Name:</span>
                  <span className="text-white">{campaignData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subject:</span>
                  <span className="text-white">{campaignData.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipients:</span>
                  <span className="text-white">
                    {totalRecipients.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Schedule:</span>
                  <span className="text-white">
                    {campaignData.scheduleType === "now"
                      ? "Send immediately"
                      : `${campaignData.scheduleDate} at ${campaignData.scheduleTime}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold"
            >
              {campaignData.scheduleType === "now"
                ? "Send Campaign"
                : "Schedule Campaign"}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </DashboardLayout>
  );
}
