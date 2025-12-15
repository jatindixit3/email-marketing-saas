'use client';

import { LinkPerformance } from '@/lib/services/tracking-analytics';

interface LinkPerformanceTableProps {
  links: LinkPerformance[];
}

export function LinkPerformanceTable({ links }: LinkPerformanceTableProps) {
  if (links.length === 0) {
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
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <p className="mt-4 text-gray-400">No link clicks recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-purple-500/20 bg-gradient-to-br from-teal-500/5 to-purple-500/5 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-purple-500/20 bg-black/20">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                Link
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                Total Clicks
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                Unique Clicks
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                Click Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-500/10">
            {links.map((link, index) => (
              <tr
                key={index}
                className="transition-colors hover:bg-white/5"
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <a
                      href={link.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="max-w-md truncate text-sm font-medium text-teal-400 hover:underline"
                    >
                      {link.linkText}
                    </a>
                    <span className="max-w-md truncate text-xs text-gray-500">
                      {link.linkUrl}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm text-white">
                    {link.totalClicks.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-medium text-purple-400">
                    {link.uniqueClicks.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-semibold text-teal-400">
                    {link.clickRate.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
