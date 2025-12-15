'use client';

// Column Mapping Component
// Maps CSV columns to contact fields

import React, { useState } from 'react';
import { ArrowRight, AlertCircle } from 'lucide-react';
import type { ColumnMapping, ContactField } from '@/types/import';

interface ColumnMappingProps {
  headers: string[];
  initialMappings: ColumnMapping[];
  sampleData: Record<string, string>[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
}

const FIELD_OPTIONS: { value: ContactField; label: string; description: string }[] = [
  { value: 'email', label: 'Email', description: 'Contact email address (required)' },
  { value: 'firstName', label: 'First Name', description: 'First name' },
  { value: 'lastName', label: 'Last Name', description: 'Last name' },
  { value: 'phone', label: 'Phone', description: 'Phone number' },
  { value: 'company', label: 'Company', description: 'Company name' },
  { value: 'tags', label: 'Tags', description: 'Comma-separated tags' },
  { value: 'status', label: 'Status', description: 'Subscription status' },
  { value: 'customField', label: 'Custom Field', description: 'Store as custom field' },
  { value: 'ignore', label: 'Ignore', description: "Don't import this column" },
];

export function ColumnMappingComponent({
  headers,
  initialMappings,
  sampleData,
  onMappingsChange,
}: ColumnMappingProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const [customFieldNames, setCustomFieldNames] = useState<Record<string, string>>(
    initialMappings.reduce((acc, m) => {
      if (m.contactField === 'customField' && m.customFieldName) {
        acc[m.csvColumn] = m.customFieldName;
      }
      return acc;
    }, {} as Record<string, string>)
  );

  const handleFieldChange = (csvColumn: string, contactField: ContactField) => {
    const newMappings = mappings.map((m) => {
      if (m.csvColumn === csvColumn) {
        return {
          ...m,
          contactField,
          customFieldName:
            contactField === 'customField'
              ? customFieldNames[csvColumn] || csvColumn
              : undefined,
        };
      }
      return m;
    });

    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const handleCustomFieldNameChange = (csvColumn: string, name: string) => {
    const newCustomFieldNames = {
      ...customFieldNames,
      [csvColumn]: name,
    };

    setCustomFieldNames(newCustomFieldNames);

    const newMappings = mappings.map((m) => {
      if (m.csvColumn === csvColumn && m.contactField === 'customField') {
        return {
          ...m,
          customFieldName: name,
        };
      }
      return m;
    });

    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const hasEmailMapping = mappings.some((m) => m.contactField === 'email');

  return (
    <div className="space-y-4">
      {!hasEmailMapping && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              You must map at least one column to Email
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {headers.map((header, index) => {
          const mapping = mappings.find((m) => m.csvColumn === header);
          const sampleValue = sampleData[0]?.[header] || '';

          return (
            <div
              key={header}
              className="border border-white/10 rounded-lg p-4 bg-white/5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* CSV Column */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/60">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{header}</p>
                      <p className="text-xs text-white/40 truncate">
                        CSV Column
                      </p>
                    </div>
                  </div>

                  {sampleValue && (
                    <div className="mt-2 p-2 rounded bg-black/20 border border-white/5">
                      <p className="text-xs text-white/40 mb-1">Sample value:</p>
                      <p className="text-sm text-white/70 truncate">{sampleValue}</p>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="hidden lg:flex justify-center">
                  <ArrowRight className="w-5 h-5 text-teal-400" />
                </div>

                {/* Contact Field */}
                <div>
                  <label className="block text-xs text-white/40 mb-2">
                    Maps to
                  </label>

                  <select
                    value={mapping?.contactField || 'ignore'}
                    onChange={(e) =>
                      handleFieldChange(header, e.target.value as ContactField)
                    }
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-teal-400"
                  >
                    {FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  {mapping?.contactField === 'customField' && (
                    <input
                      type="text"
                      value={customFieldNames[header] || header}
                      onChange={(e) =>
                        handleCustomFieldNameChange(header, e.target.value)
                      }
                      placeholder="Custom field name"
                      className="mt-2 w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-teal-400"
                    />
                  )}

                  <p className="mt-1 text-xs text-white/40">
                    {FIELD_OPTIONS.find((o) => o.value === mapping?.contactField)
                      ?.description || ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <h4 className="text-sm font-medium text-white mb-2">Mapping Summary</h4>
        <div className="space-y-1">
          <p className="text-xs text-white/60">
            Total columns: <span className="text-white">{headers.length}</span>
          </p>
          <p className="text-xs text-white/60">
            Mapped: <span className="text-white">{mappings.filter((m) => m.contactField !== 'ignore').length}</span>
          </p>
          <p className="text-xs text-white/60">
            Ignored: <span className="text-white">{mappings.filter((m) => m.contactField === 'ignore').length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
