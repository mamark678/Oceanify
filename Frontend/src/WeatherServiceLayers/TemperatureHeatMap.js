export function TemperatureHeatmapLayer(cityData) {
  const temps = cityData
    .map((c) => c.value)
    .filter((v) => typeof v === "number" && !isNaN(v));

  if (!temps.length) {
    console.warn("No valid temperature data for heatmap");
    return null;
  }

  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;

  const heatPoints = cityData
    .filter((c) => typeof c.value === "number" && !isNaN(c.value))
    .map((c) => [c.lat, c.lon, (c.value - min) / range]);

  return L.heatLayer(heatPoints, {
    radius: 35,
    blur: 20,
    maxZoom: 8,
    minOpacity: 0.8,
    gradient: {
      0.0: "blue",
      0.5: "lime",
      1.0: "red",
    },
  });
}
