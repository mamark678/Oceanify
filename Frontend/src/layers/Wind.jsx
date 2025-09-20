// src/layers/Wind.jsx
// NOTE: replace fetchWindFromAPI with your Mateo wind API call.

async function fetchWindFromAPI(bbox) {
  // replace with actual API fetch; return GeoJSON FeatureCollection with properties { speed, direction }
  return {
    type: "FeatureCollection",
    features: [
      { type: "Feature", geometry: { type: "Point", coordinates: [124.3, 9.2] }, properties: { speed: 12, direction: 45 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [125.2, 9.0] }, properties: { speed: 8, direction: 90 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [126.5, 9.5] }, properties: { speed: 22, direction: 180 } },
    ]
  };
}

function isPointOverWater(map, lngLat) {
  try {
    const style = map.getStyle();
    if (!style || !style.layers) return true;
    const waterLayer = style.layers.find(l => /water/i.test(l.id || "") || /water/i.test(l.source || ""));
    if (!waterLayer) return true;
    const pixel = map.project(lngLat);
    const bbox = [[pixel.x - 1, pixel.y - 1], [pixel.x + 1, pixel.y + 1]];
    const features = map.queryRenderedFeatures(bbox, { layers: [waterLayer.id] });
    return (features && features.length > 0);
  } catch (err) {
    console.warn("isPointOverWater error:", err);
    return true;
  }
}

export async function addWindLayer(map, options = {}) {
  console.log("Adding wind layer...");
  if (!map) return;

  if (!map.isStyleLoaded()) {
    map.once("styledata", () => addWindLayer(map, options));
    return;
  }

  // get bbox from map to limit API query
  const bounds = map.getBounds();
  const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  const data = await fetchWindFromAPI(bbox);

  const filtered = {
    type: "FeatureCollection",
    features: data.features.filter(f => {
      const [lng, lat] = f.geometry.coordinates;
      return isPointOverWater(map, [lng, lat]);
    })
  };

  if (!map.getSource("wind")) {
    map.addSource("wind", { type: "geojson", data: filtered });
  } else {
    map.getSource("wind").setData(filtered);
  }

  // Wind speed circles
  if (!map.getLayer("wind-layer")) {
    map.addLayer({
      id: "wind-layer",
      type: "circle",
      source: "wind",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["get", "speed"], 5, 4, 10, 6, 15, 8, 25, 12],
        "circle-color": ["interpolate", ["linear"], ["get", "speed"], 0, "#cfe9ff", 10, "#4fa3ff", 20, "#0033cc"],
        "circle-opacity": 0.6,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff"
      }
    }, getBeforeLayerId(map));
  }

  // Wind direction arrows using a simple glyph (➤) rotated by 'direction' property
  if (!map.getLayer("wind-arrows")) {
    map.addLayer({
      id: "wind-arrows",
      type: "symbol",
      source: "wind",
      layout: {
        "symbol-placement": "point",
        "text-field": "➤",               // arrow glyph
        "text-size": 14,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
        // rotate the glyph using property (mapbox rotations are clockwise)
        "text-rotate": ["get", "direction"]
      },
      paint: {
        "text-color": ["interpolate", ["linear"], ["get", "speed"], 0, "#9ecfff", 10, "#2b88ff", 20, "#001f8a"],
        "text-halo-color": "#fff",
        "text-halo-width": 1
      }
    }, getBeforeLayerId(map));
  }

  console.log("Wind layer added (arrows + speed circles).");
}

// helper to pick before layer id (same as temperature)
function getBeforeLayerId(map) {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  const firstSymbol = style.layers.find(l => l.type === "symbol");
  return firstSymbol ? firstSymbol.id : undefined;
}

export function removeWindLayer(map) {
  if (!map || !map.getStyle) return;
  try {
    if (map.getLayer("wind-arrows")) map.removeLayer("wind-arrows");
    if (map.getLayer("wind-layer")) map.removeLayer("wind-layer");
    if (map.getSource("wind")) map.removeSource("wind");
    console.log("Wind layer removed");
  } catch (err) {
    console.warn("Error removing wind layer:", err);
  }
}
