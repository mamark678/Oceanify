export function TemperatureHeatmapLayer(cityData) {
  const temps = cityData
    .map((c) => c.value)
    .filter((v) => typeof v === "number");
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  console.log("Heatmap city data:", cityData);

  const heatPoints = cityData
    .filter((c) => typeof c.value === "number")
    .map((c) => [
      c.lat,
      c.lon,
      (c.value - min) / (max - min || 1), // normalize per dataset
    ]);

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
