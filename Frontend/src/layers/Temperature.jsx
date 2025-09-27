let tempLayer;

export function addTemperatureLayer(map) {
  if (tempLayer) return;
  tempLayer = {
    id: "owm-temp",
    type: "raster",
    source: "owm-temp",
    paint: { "raster-opacity": 0.75 },
  };

  if (!map.getSource("owm-temp")) {
    map.addSource("owm-temp", {
      type: "raster",
      tiles: [
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=60b8ffcce91b8ebdc127d1219e56e0f5`
      ],
      tileSize: 256,
    });
  }

  map.addLayer(tempLayer, getBeforeLayerId(map));
}

export function removeTemperatureLayer(map) {
  if (map.getLayer("owm-temp")) {
    map.removeLayer("owm-temp");
  }
  if (map.getSource("owm-temp")) {
    map.removeSource("owm-temp");
  }
  tempLayer = null;
}

// helper
function getBeforeLayerId(map) {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  const firstSymbol = style.layers.find((l) => l.type === "symbol");
  return firstSymbol ? firstSymbol.id : undefined;
}
