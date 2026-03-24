'use client';

interface StatsCardProps {
  icon: string;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
}

export default function StatsCard({ icon, value, label, trend, trendUp }: StatsCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <span className="text-2xl">{icon}</span>
        {trend && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded ${
              trendUp ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
