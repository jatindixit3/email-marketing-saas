'use client';

import { DeviceBreakdown, EmailClientBreakdown } from '@/lib/services/tracking-analytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface DeviceBreakdownChartProps {
  devices: DeviceBreakdown[];
  emailClients: EmailClientBreakdown[];
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: '#2dd4bf', // teal-400
  mobile: '#a78bfa', // purple-400
  tablet: '#60a5fa', // blue-400
  unknown: '#9ca3af', // gray-400
};

const CLIENT_COLORS = [
  '#2dd4bf', // teal-400
  '#a78bfa', // purple-400
  '#f472b6', // pink-400
  '#60a5fa', // blue-400
  '#fbbf24', // yellow-400
  '#34d399', // green-400
  '#fb7185', // rose-400
  '#818cf8', // indigo-400
];

export function DeviceBreakdownChart({
  devices,
  emailClients,
}: DeviceBreakdownChartProps) {
  const hasDeviceData = devices.length > 0 && devices.some((d) => d.uniqueOpens > 0);
  const hasClientData = emailClients.length > 0 && emailClients.some((c) => c.uniqueOpens > 0);

  if (!hasDeviceData && !hasClientData) {
    return (
      <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-8 text-center backdrop-blur-sm">
        <svg
          className="mx-auto h-12 w-12 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-4 text-gray-400">No device data available yet</p>
      </div>
    );
  }

  const deviceData = devices.map((device) => ({
    name: device.deviceType.charAt(0).toUpperCase() + device.deviceType.slice(1),
    value: device.uniqueOpens,
    percentage: device.percentage.toFixed(1),
  }));

  const clientData = emailClients.slice(0, 8).map((client) => ({
    name: client.emailClient,
    value: client.uniqueOpens,
    percentage: client.percentage.toFixed(1),
  }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Device Breakdown */}
      {hasDeviceData && (
        <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-white">Device Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={DEVICE_COLORS[entry.name.toLowerCase()] || '#9ca3af'}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid rgba(45, 212, 191, 0.2)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend
                wrapperStyle={{ color: '#9ca3af' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Email Client Breakdown */}
      {hasClientData && (
        <div className="rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Email Client Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={clientData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {clientData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CLIENT_COLORS[index % CLIENT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid rgba(45, 212, 191, 0.2)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend
                wrapperStyle={{ color: '#9ca3af' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
