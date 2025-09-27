let windLayer;

export function addWindLayer(map) {
  if (windLayer) return;
  windLayer = {
    id: "owm-wind",
    type: "raster",
    source: "owm-wind",
    paint: { "raster-opacity": 0.75 },
  };

  if (!map.getSource("owm-wind")) {
    map.addSource("owm-wind", {
      type: "raster",
      tiles: [
        `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=60b8ffcce91b8ebdc127d1219e56e0f5`
      ],
      tileSize: 256,
    });
  }

  map.addLayer(windLayer, getBeforeLayerId(map));
}

export function removeWindLayer(map) {
  if (map.getLayer("owm-wind")) {
    map.removeLayer("owm-wind");
  }
  if (map.getSource("owm-wind")) {
    map.removeSource("owm-wind");
  }
  windLayer = null;
}

// helper
function getBeforeLayerId(map) {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  const firstSymbol = style.layers.find((l) => l.type === "symbol");
  return firstSymbol ? firstSymbol.id : undefined;
}
