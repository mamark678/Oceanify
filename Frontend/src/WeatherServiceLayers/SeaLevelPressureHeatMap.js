export function SeaLevelHeatmapLayerFullMap(gridData) {

  const pressures = gridData
    .map(p => p.pressure_msl)
    .filter(v => typeof v === "number");

  if (!pressures.length) return null;

  const minPressure = Math.min(...pressures);
  const maxPressure = Math.max(...pressures);

  const heatPoints = gridData.map(p => [
    p.lat,
    p.lon,
    (p.pressure_msl - minPressure) / (maxPressure - minPressure || 1)
  ]);

  return L.heatLayer(heatPoints, {
    radius: 60,  
    blur: 50,
    maxZoom: 12,
    minOpacity: 0.4,
    gradient: {
      0.0: "purple",
      0.5: "orange",
      1.0: "yellow",
    },
  });
}

import { getWeather } from "../WeatherServiceLayers/WeatherService";

// Load cache from localStorage
const pressureCache = new Map(
  Object.entries(JSON.parse(localStorage.getItem("pressureCache") || "{}"))
);

export async function fetchSeaLevelGridPressure(gridPoints) {
  const PH_BOUNDS = {
    south: 4.5,
    north: 21.5,
    west: 116.5,
    east: 127.0,
  };

  const insidePH = gridPoints.filter(
    (p) =>
      p.lat >= PH_BOUNDS.south &&
      p.lat <= PH_BOUNDS.north &&
      p.lon >= PH_BOUNDS.west &&
      p.lon <= PH_BOUNDS.east
  );

  const pressurePromises = insidePH.map(async (p) => {
    const key = `${p.lat.toFixed(2)},${p.lon.toFixed(2)}`;

    if (pressureCache.has(key)) {
      return { lat: p.lat, lon: p.lon, pressure_msl: pressureCache.get(key) };
    }

    try {
      const data = await getWeather(p.lat, p.lon);
      const pressure = data.pressure ?? 1013; 
      pressureCache.set(key, pressure);

      localStorage.setItem(
        "pressureCache",
        JSON.stringify(Object.fromEntries(pressureCache))
      );

      return { lat: p.lat, lon: p.lon, pressure_msl: pressure };
    } catch {
      return { lat: p.lat, lon: p.lon, pressure_msl: 1013 };
    }
  });

  return Promise.all(pressurePromises);
}
