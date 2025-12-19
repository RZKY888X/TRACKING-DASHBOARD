// frontend/app/(dashboard)/dashboard/components/MetricCard.tsx
"use client";

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  badge?: "success" | "warning" | "alert";
  iconBg?: string;
  iconColor?: string;
}

export default function MetricCard({
  icon,
  title,
  value,
  subtitle,
  change,
  changeLabel,
  badge,
  iconBg = "bg-cyan-500/20",
  iconColor = "text-cyan-400",
}: MetricCardProps) {
  const getBadgeColor = () => {
    switch (badge) {
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "alert":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "";
    }
  };

  return (
    <div className="bg-[#1a1f2e] border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/40 transition-all">
      {/* Icon & Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <div className={iconColor}>{icon}</div>
        </div>
        
        {badge && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getBadgeColor()}`}>
            {badge === "success" && "✓ Target Met"}
            {badge === "warning" && "⚠ Warning"}
            {badge === "alert" && "⚠ High"}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        
        {/* Change Indicator */}
        {change !== undefined && (
          <span className={`flex items-center text-sm font-medium ${
            change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change >= 0 ? (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>

      {/* Subtitle or Change Label */}
      {(subtitle || changeLabel) && (
        <p className="text-gray-500 text-xs mt-2">
          {subtitle || changeLabel}
        </p>
      )}
    </div>
  );
}