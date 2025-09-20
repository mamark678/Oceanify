export function SeaLevelHeatmapLayer(cityData) {
  const values = cityData
    .map((c) => c['pressure_msl'])
    .filter((v) => typeof v === "number");
  const min = Math.min(...values);
  const max = Math.max(...values);

  const heatPoints = cityData
    .filter((c) => typeof c['pressure_msl'] === "number")
    .map((c) => [c.lat, c.lon, (c['pressure_msl'] - min) / (max - min || 1)]);

  return L.heatLayer(heatPoints, {
    radius: 50,
    blur: 20,
    maxZoom: 12,
    minOpacity: 0.6,
    gradient: {
      0.0: "purple",
      0.5: "orange",
      1.0: "yellow",
    },
  });
}
