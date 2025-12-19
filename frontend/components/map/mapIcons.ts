// frontend/components/map/mapIcons.ts
import L from "leaflet";

export const warehouseIcon = L.divIcon({
  className: "",
  html: `<div style="
    background:#2563eb;
    width:34px;
    height:34px;
    border-radius:8px;
    border:3px solid #fff;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:16px;">🏭</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export const createVehicleIcon = (status: string) => {
  let color = "#22c55e"; // idle
  if (status === "ON_TRIP") color = "#eab308";
  if (status === "COMPLETED") color = "#a855f7";

  return L.divIcon({
    html: `<div style="
      background:${color};
      width:30px;
      height:30px;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      display:flex;
      align-items:center;
      justify-content:center;">
      <span style="transform:rotate(45deg);color:white;">🚚</span>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};
