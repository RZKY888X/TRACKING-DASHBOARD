// frontend/components/VehicleMap.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

/* TYPES */
interface VehiclePosition {
  id: number;
  name: string;
  driver: string;
  route: string;
  latitude: number | null;
  longitude: number | null;
  speed: number;
  timestamp: string | null;
  status?: string;
}

interface RouteCoordinates {
  lat: number;
  lng: number;
}

/* WAREHOUSES / DISTRIBUTION CENTERS */
const warehouses = [
  {
    id: "jakarta-dc",
    name: "Jakarta Distribution Center",
    latitude: -6.2088,
    longitude: 106.8456,
    type: "origin",
  },
  {
    id: "bandung-dc",
    name: "Bandung Distribution Center",
    latitude: -6.9175,
    longitude: 107.6191,
    type: "destination",
  },
  {
    id: "surabaya-dc",
    name: "Surabaya Distribution Center",
    latitude: -7.2575,
    longitude: 112.7521,
    type: "origin",
  },
  {
    id: "malang-dc",
    name: "Malang Distribution Center",
    latitude: -7.9666,
    longitude: 112.6326,
    type: "destination",
  },
  {
    id: "yogya-dc",
    name: "Yogyakarta Distribution Center",
    latitude: -7.7956,
    longitude: 110.3695,
    type: "origin",
  },
  {
    id: "semarang-dc",
    name: "Semarang Distribution Center",
    latitude: -6.9667,
    longitude: 110.4167,
    type: "destination",
  },
];

/* WAREHOUSE ICON */
const warehouseIcon = L.divIcon({
  className: "warehouse-marker",
  html: `
    <div style="
      background-color: #3b82f6;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
    ">
      🏭
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/* CUSTOM VEHICLE ICONS */
const createCustomIcon = (status: string) => {
  let color = "#10b981"; // green (idle)
  
  if (status === "On Trip") {
    color = "#eab308"; // yellow
  } else if (status === "Completed") {
    color = "#a855f7"; // purple
  }
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">🚚</div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

/* GET STATUS COLOR */
const getStatusColor = (status: string) => {
  switch (status) {
    case "On Trip":
      return { bg: "#fef3c7", text: "#92400e", dot: "#eab308" };
    case "Completed":
      return { bg: "#f3e8ff", text: "#6b21a8", dot: "#a855f7" };
    default: // Idle
      return { bg: "#d1fae5", text: "#065f46", dot: "#10b981" };
  }
};

export default function VehicleMap() {
  const { data: session } = useSession();
  const [positions, setPositions] = useState<VehiclePosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [routeCache, setRouteCache] = useState<Record<number, RouteCoordinates[]>>({});
  const [isMounted, setIsMounted] = useState(false); // ✅ FIX: Add mounted state

  // ✅ FIX: Check if component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* FETCH VEHICLE POSITIONS FROM API */
  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchPositions = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/vehicles/latest", {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        const data: VehiclePosition[] = await res.json();
        
        // Add status based on speed if not provided
        const dataWithStatus = data.map(v => ({
          ...v,
          status: v.speed === 0 ? "Idle" : v.speed > 60 ? "Completed" : "On Trip"
        }));
        
        setPositions(dataWithStatus);

        // Fetch routes for vehicles
        dataWithStatus.forEach((v) => {
          if (typeof v.latitude === "number" && typeof v.longitude === "number") {
            fetchRouteForVehicle(v);
          }
        });
      } catch (err) {
        console.error("Failed to fetch positions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPositions();
    
    // Refresh data every 10 seconds
    const interval = setInterval(fetchPositions, 10000);

    return () => clearInterval(interval);
  }, [session?.accessToken]);

  /* FETCH ROUTE FROM OSRM VIA BACKEND */
  const fetchRouteForVehicle = async (v: VehiclePosition) => {
    if (typeof v.latitude !== "number" || typeof v.longitude !== "number") return;
    if (routeCache[v.id]) return;
    if (!session?.accessToken) return;

    try {
      let origin = `${v.latitude},${v.longitude}`;
      let destination = "";
      
      // Determine destination based on route name
      if (v.route.includes("Bandung") && !v.route.includes("to Bandung")) {
        destination = "-6.2088,106.8456"; // Jakarta DC
      } else if (v.route.includes("to Bandung")) {
        destination = "-6.9175,107.6191"; // Bandung DC
      } else if (v.route.includes("Malang") && !v.route.includes("to Malang")) {
        destination = "-7.2575,112.7521"; // Surabaya DC
      } else if (v.route.includes("to Malang")) {
        destination = "-7.9666,112.6326"; // Malang DC
      } else if (v.route.includes("Semarang") && !v.route.includes("to Semarang")) {
        destination = "-7.7956,110.3695"; // Yogyakarta DC
      } else if (v.route.includes("to Semarang")) {
        destination = "-6.9667,110.4167"; // Semarang DC
      } else {
        destination = "-6.9175,107.6191"; // Default to Bandung
      }

      const res = await fetch(
        `http://localhost:3001/api/route?origin=${origin}&destination=${destination}`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      const data: { coords: RouteCoordinates[] } = await res.json();

      if (data.coords) {
        setRouteCache((prev) => ({
          ...prev,
          [v.id]: data.coords,
        }));
      }
    } catch (err) {
      console.error("Failed fetching OSRM route:", err);
    }
  };

  const validPositions = positions.filter(
    (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
  );

  // ✅ FIX: Return loading state if not mounted
  if (!isMounted) {
    return (
      <div className="w-full h-[600px] rounded-lg overflow-hidden shadow relative bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Initializing map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow relative">
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 0;
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .custom-marker, .warehouse-marker {
          background: transparent;
          border: none;
        }
      `}</style>
      
      {loading && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-slate-400">Loading map...</p>
          </div>
        </div>
      )}

      <MapContainer
        center={[-6.7, 107.2]}
        zoom={9}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* POLYLINE ROUTES */}
        {Object.entries(routeCache).map(([id, coords]) => {
          const vehicle = positions.find(p => p.id === parseInt(id));
          const isOnTrip = vehicle?.status === "On Trip";
          
          return (
            <Polyline
              key={`route-${id}`}
              positions={coords}
              pathOptions={{ 
                color: isOnTrip ? "#eab308" : "#6366f1",
                weight: isOnTrip ? 5 : 4,
                opacity: isOnTrip ? 0.9 : 0.6,
                dashArray: isOnTrip ? undefined : "10, 8"
              }}
            />
          );
        })}

        {/* WAREHOUSE MARKERS */}
        {warehouses.map((wh) => (
          <Marker
            key={wh.id}
            position={[wh.latitude, wh.longitude]}
            icon={warehouseIcon}
          >
            <Popup className="custom-popup">
              <div style={{
                minWidth: "200px",
                padding: "12px",
                fontFamily: "system-ui, -apple-system, sans-serif"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px"
                }}>
                  <span style={{ fontSize: "20px" }}>🏭</span>
                  <strong style={{ fontSize: "14px", color: "#1f2937" }}>
                    {wh.name}
                  </strong>
                </div>
                <div style={{ fontSize: "12px", color: "#6b7280" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "600",
                    backgroundColor: "#dbeafe",
                    color: "#1e40af"
                  }}>
                    {wh.type === "origin" ? "Origin Point" : "Destination"}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* VEHICLE MARKERS */}
        {validPositions.map((pos) => {
          const statusColors = getStatusColor(pos.status || "Idle");
          
          return (
            <Marker
              key={pos.id}
              position={[pos.latitude!, pos.longitude!]}
              icon={createCustomIcon(pos.status || "Idle")}
            >
              <Popup className="custom-popup">
                <div style={{
                  minWidth: "220px",
                  padding: "12px",
                  fontFamily: "system-ui, -apple-system, sans-serif"
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: statusColors.dot
                    }}></div>
                    <strong style={{ 
                      fontSize: "15px", 
                      color: "#1f2937",
                      flex: 1
                    }}>
                      {pos.name}
                    </strong>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontSize: "10px",
                      fontWeight: "600",
                      backgroundColor: statusColors.bg,
                      color: statusColors.text
                    }}>
                      {pos.status || "Idle"}
                    </span>
                  </div>
                  
                  <div style={{ 
                    fontSize: "13px", 
                    color: "#6b7280", 
                    lineHeight: "1.8" 
                  }}>
                    <div style={{ display: "flex", marginBottom: "6px" }}>
                      <span style={{ color: "#9ca3af", minWidth: "60px" }}>Driver:</span>
                      <span style={{ color: "#1f2937", fontWeight: "500" }}>{pos.driver}</span>
                    </div>
                    
                    <div style={{ display: "flex", marginBottom: "6px" }}>
                      <span style={{ color: "#9ca3af", minWidth: "60px" }}>Route:</span>
                      <span style={{ color: "#1f2937", fontSize: "12px" }}>{pos.route}</span>
                    </div>
                    
                    <div style={{ display: "flex", marginBottom: "6px" }}>
                      <span style={{ color: "#9ca3af", minWidth: "60px" }}>Speed:</span>
                      <span style={{ 
                        fontWeight: "600",
                        color: pos.speed > 60 ? "#dc2626" : pos.speed === 0 ? "#6b7280" : "#059669"
                      }}>
                        {pos.speed} km/h
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: "flex",
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid #f3f4f6"
                    }}>
                      <span style={{ color: "#9ca3af", fontSize: "11px" }}>
                        Last update: {pos.timestamp 
                          ? new Date(pos.timestamp).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* LEGEND CARD - TOP RIGHT (COMPACT VERSION) */}
      <div style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "8px",
        padding: "12px 16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        border: "1px solid rgba(203, 213, 225, 0.3)",
        minWidth: "140px"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Idle */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#10b981"
            }}></div>
            <span style={{ fontSize: "13px", color: "#1f2937", fontWeight: "500" }}>
              Idle
            </span>
          </div>
          
          {/* On Trip */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#eab308"
            }}></div>
            <span style={{ fontSize: "13px", color: "#1f2937", fontWeight: "500" }}>
              On Trip
            </span>
          </div>
          
          {/* Completed */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#a855f7"
            }}></div>
            <span style={{ fontSize: "13px", color: "#1f2937", fontWeight: "500" }}>
              Completed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}