"use client";

type VehicleStatus = "active" | "trip" | "alert" | "idle" | "off";

interface VehicleCardProps {
  code: string;
  name: string;
  route: string;
  status: VehicleStatus;
  speed: string;

  /** 🔥 tambahan */
  onClick?: () => void;
}

const STATUS_STYLE: Record<
  VehicleStatus,
  {
    label: string;
    bg: string;
    text: string;
    dot: string;
  }
> = {
  active: {
    label: "Active",
    bg: "bg-green-500/15",
    text: "text-green-400",
    dot: "bg-green-400",
  },
  trip: {
    label: "On Trip",
    bg: "bg-yellow-500/15",
    text: "text-yellow-400",
    dot: "bg-yellow-400",
  },
  alert: {
    label: "Alert",
    bg: "bg-red-500/15",
    text: "text-red-400",
    dot: "bg-red-400",
  },
  idle: {
    label: "Idle",
    bg: "bg-blue-500/15",
    text: "text-blue-400",
    dot: "bg-blue-400",
  },
  off: {
    label: "Off / Parked",
    bg: "bg-gray-500/15",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
};

export default function VehicleCard({
  code,
  name,
  route,
  status,
  speed,
  onClick,
}: VehicleCardProps) {
  const style = STATUS_STYLE[status];

  return (
    <div
      onClick={onClick}
      className="
        p-4 rounded-xl
        bg-[#020617]
        border border-white/10
        hover:border-cyan-500/40
        hover:bg-cyan-500/5
        active:scale-[0.98]
        transition
        cursor-pointer
        select-none
      "
    >
      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{code}</p>
          <p className="text-xs text-gray-400">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{route}</p>
        </div>

        {/* STATUS */}
        <span
          className={`
            inline-flex items-center gap-2
            px-2.5 py-1 rounded-full
            text-[11px] font-medium
            ${style.bg} ${style.text}
          `}
        >
          <span className={`w-2 h-2 rounded-full ${style.dot}`} />
          {style.label}
        </span>
      </div>

      {/* FOOTER */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Speed</span>
        <span className="text-gray-200 font-medium">
          {speed}
        </span>
      </div>
    </div>
  );
}
