"use client";

import React from "react";

interface VehiclePopupProps {
  code?: string;
  driver?: string;
  status?: "ON TRIP" | "ACTIVE" | "ALERT" | "IDLE" | "OFF";
  speed?: string;
  route?: string;
  updatedAt?: string;
}

const STATUS_STYLE: Record<
  string,
  { bg: string; text: string }
> = {
  "ON TRIP": {
    bg: "rgba(250,204,21,0.15)",
    text: "#facc15",
  },
  ACTIVE: {
    bg: "rgba(34,197,94,0.15)",
    text: "#22c55e",
  },
  ALERT: {
    bg: "rgba(239,68,68,0.15)",
    text: "#ef4444",
  },
  IDLE: {
    bg: "rgba(59,130,246,0.15)",
    text: "#3b82f6",
  },
  OFF: {
    bg: "rgba(156,163,175,0.15)",
    text: "#9ca3af",
  },
};

export default function VehiclePopup({
  code = "TRK-8821",
  driver = "John Doe",
  status = "ON TRIP",
  speed = "65 km/h",
  route = "North Logistics Ctr → Port Auth. Dock 4",
  updatedAt = "Updated: 10s ago",
}: VehiclePopupProps) {
  const style = STATUS_STYLE[status];

  return (
    <div
      style={{
        width: 260,
        background: "#0B1220",
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
        color: "white",
        fontFamily: "Inter, sans-serif",
        pointerEvents: "auto",
      }}
    >
      {/* ================= HEADER ================= */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {code}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#94a3b8",
              marginTop: 2,
            }}
          >
            {updatedAt}
          </div>
        </div>

        <div
          style={{
            fontSize: 10,
            padding: "3px 10px",
            borderRadius: 999,
            background: style.bg,
            color: style.text,
            fontWeight: 600,
          }}
        >
          {status}
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div style={{ padding: "12px 14px", fontSize: 12 }}>
        {/* DRIVER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                marginBottom: 2,
              }}
            >
              DRIVER
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {driver
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <span style={{ fontSize: 13 }}>
                {driver}
              </span>
            </div>
          </div>

          {/* SPEED */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                color: "#64748b",
                marginBottom: 2,
              }}
            >
              SPEED
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {speed}
            </div>
          </div>
        </div>

        {/* ROUTE */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: "#64748b",
              marginBottom: 4,
            }}
          >
            CURRENT ROUTE
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#e5e7eb",
              lineHeight: 1.4,
            }}
          >
            {route}
          </div>
        </div>
      </div>

      {/* ================= ACTION ================= */}
      <div
        style={{
          padding: 12,
          display: "flex",
          gap: 8,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          style={{
            flex: 1,
            padding: "8px 0",
            fontSize: 12,
            borderRadius: 8,
            background: "#111827",
            color: "white",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}
        >
          📹 View Cam
        </button>

        <button
          style={{
            flex: 1,
            padding: "8px 0",
            fontSize: 12,
            borderRadius: 8,
            background: "#0ea5e9",
            color: "#020617",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          📞 Contact
        </button>
      </div>
    </div>
  );
}
