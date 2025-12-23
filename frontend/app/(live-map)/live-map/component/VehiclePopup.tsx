"use client";

import React from "react";

interface VehiclePopupProps {
  code?: string;
  name?: string;
  status?: string;
  speed?: string;
}

const VehiclePopup: React.FC<VehiclePopupProps> = ({
  code = "TRK-8821",
  name = "John Doe",
  status = "Active",
  speed = "65 km/h",
}) => {
  return (
    <div
      style={{
        minWidth: "220px",
        background: "#0F172A",
        color: "white",
        borderRadius: "10px",
        border: "1px solid rgba(255,255,255,0.1)",
        padding: "12px",
        pointerEvents: "auto",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#22d3ee",
          }}
        >
          {code}
        </span>

        <span
          style={{
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "999px",
            background: "rgba(34,197,94,0.15)",
            color: "#22c55e",
          }}
        >
          {status}
        </span>
      </div>

      {/* BODY */}
      <div style={{ marginBottom: "8px" }}>
        <div style={{ fontSize: "14px", fontWeight: 500 }}>
          {name}
        </div>
        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
          Speed: <span style={{ color: "white" }}>{speed}</span>
        </div>
      </div>

      {/* ACTION */}
      <button
        type="button"
        style={{
          width: "100%",
          fontSize: "12px",
          padding: "6px 0",
          borderRadius: "6px",
          background: "rgba(34,211,238,0.15)",
          color: "#22d3ee",
          border: "none",
          cursor: "pointer",
        }}
      >
        View Detail
      </button>
    </div>
  );
};

export default VehiclePopup;
