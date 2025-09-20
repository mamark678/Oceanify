import L from "leaflet";

export function temperatureLayer(temp) {
  return L.divIcon({
    className: "temp-label",
    html: `<div style="
      color: blue;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      white-space: nowrap;
    ">
      ${temp}°C
    </div>`,
  });
}
