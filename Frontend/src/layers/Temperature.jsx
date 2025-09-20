// src/layers/Temperature.jsx
// Enhanced temperature layer with better ocean filtering and visualization

async function fetchTemperatureFromAPI(bbox) {
  // bbox: [minLon, minLat, maxLon, maxLat] - optional
  // Example placeholder returns more comprehensive sample data for ocean areas
  
  // ====== Enhanced placeholder data covering ocean areas ======
  const oceanTemperaturePoints = [];
  
  // Generate temperature data points across ocean areas in the Philippines region
  const regions = [
    // Philippine Sea
    { centerLon: 126, centerLat: 13, radius: 3, baseTemp: 29 },
    { centerLon: 128, centerLat: 15, radius: 2, baseTemp: 28.5 },
    { centerLon: 127, centerLat: 11, radius: 2.5, baseTemp: 29.5 },
    
    // South China Sea
    { centerLon: 118, centerLat: 12, radius: 4, baseTemp: 30 },
    { centerLon: 116, centerLat: 15, radius: 3, baseTemp: 29.8 },
    { centerLon: 119, centerLat: 9, radius: 2, baseTemp: 30.2 },
    
    // Celebes Sea
    { centerLon: 121, centerLat: 6, radius: 3, baseTemp: 29.8 },
    { centerLon: 123, centerLat: 4, radius: 2, baseTemp: 30.1 },
    
    // Sulu Sea
    { centerLon: 119, centerLat: 8, radius: 2, baseTemp: 29.9 },
    { centerLon: 121, centerLat: 8.5, radius: 1.5, baseTemp: 29.7 },
  ];
  
  // Generate points for each region
  regions.forEach(region => {
    const pointsInRegion = 15; // Number of points per region
    for (let i = 0; i < pointsInRegion; i++) {
      // Random distribution around region center
      const angle = (Math.PI * 2 * i) / pointsInRegion + Math.random() * 0.5;
      const distance = Math.random() * region.radius;
      
      const lon = region.centerLon + Math.cos(angle) * distance;
      const lat = region.centerLat + Math.sin(angle) * distance;
      
      // Add some temperature variation
      const tempVariation = (Math.random() - 0.5) * 2; // ±1°C variation
      const temperature = region.baseTemp + tempVariation;
      
      oceanTemperaturePoints.push({
        type: "Feature",
        geometry: { 
          type: "Point", 
          coordinates: [lon, lat] 
        },
        properties: { 
          temp: Math.round(temperature * 10) / 10 // Round to 1 decimal
        }
      });
    }
  });
  
  return {
    type: "FeatureCollection",
    features: oceanTemperaturePoints
  };
}

// Enhanced water detection using multiple methods
function isPointOverWater(map, lngLat) {
  try {
    const style = map.getStyle();
    if (!style || !style.layers) return true;
    
    // Look for water-related layers
    const waterLayers = style.layers.filter(layer => {
      const id = (layer.id || '').toLowerCase();
      const source = (layer.source || '').toLowerCase();
      return id.includes('water') || id.includes('ocean') || id.includes('sea') || 
             source.includes('water') || source.includes('ocean') || source.includes('sea');
    });
    
    if (waterLayers.length === 0) {
      // Fallback: basic ocean area check for Philippines region
      const [lon, lat] = lngLat;
      
      // Define basic ocean boundaries for Philippines
      const oceanBounds = [
        // Philippine Sea
        { minLon: 125, maxLon: 130, minLat: 10, maxLat: 18 },
        // South China Sea
        { minLon: 115, maxLon: 122, minLat: 8, maxLat: 20 },
        // Celebes Sea
        { minLon: 120, maxLon: 125, minLat: 2, maxLat: 8 },
        // Sulu Sea
        { minLon: 118, maxLon: 122, minLat: 6, maxLat: 10 }
      ];
      
      return oceanBounds.some(bounds => 
        lon >= bounds.minLon && lon <= bounds.maxLon && 
        lat >= bounds.minLat && lat <= bounds.maxLat
      );
    }
    
    const pixel = map.project(lngLat);
    const bbox = [
      [pixel.x - 2, pixel.y - 2],
      [pixel.x + 2, pixel.y + 2]
    ];
    
    const features = map.queryRenderedFeatures(bbox, { 
      layers: waterLayers.map(l => l.id) 
    });
    
    return features && features.length > 0;
  } catch (err) {
    console.warn("isPointOverWater error:", err);
    // Fallback to basic coordinate check for ocean areas
    const [lon, lat] = lngLat;
    return (lon >= 115 && lon <= 130 && lat >= 2 && lat <= 20);
  }
}

export async function addTemperatureLayer(map, options = {}) {
  console.log("Adding enhanced temperature layer...");
  if (!map) return;

  if (!map.isStyleLoaded()) {
    map.once("styledata", () => addTemperatureLayer(map, options));
    return;
  }

  try {
    // Fetch temperature data
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const data = await fetchTemperatureFromAPI(bbox);

    // Filter points to only show over water/ocean areas
    const filtered = {
      type: "FeatureCollection",
      features: data.features.filter(feature => {
        if (!feature?.geometry?.coordinates) return false;
        const [lng, lat] = feature.geometry.coordinates;
        return isPointOverWater(map, [lng, lat]);
      })
    };

    console.log(`Temperature layer: ${filtered.features.length} ocean points loaded`);

    // Add/update source
    if (!map.getSource("temperature")) {
      map.addSource("temperature", { type: "geojson", data: filtered });
    } else {
      map.getSource("temperature").setData(filtered);
    }

    // Enhanced heatmap layer (primary visualization)
    if (!map.getLayer("temperature-heat")) {
      map.addLayer({
        id: "temperature-heat",
        type: "heatmap",
        source: "temperature",
        maxzoom: 12,
        paint: {
          // Weight based on temperature (higher temps = more intense)
          "heatmap-weight": [
            "interpolate", ["linear"], ["get", "temp"], 
            26, 0.1,  // Cool temperatures
            28, 0.5,  // Moderate temperatures  
            30, 0.8,  // Warm temperatures
            32, 1.0   // Hot temperatures
          ],
          
          // Intensity increases with zoom
          "heatmap-intensity": [
            "interpolate", ["linear"], ["zoom"], 
            0, 0.6, 
            6, 1.0, 
            12, 1.5
          ],
          
          // Enhanced color gradient matching ocean temperature visualization
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",           // Transparent
            0.1, "rgba(0,50,150,0.6)",    // Deep blue (cold)
            0.2, "rgba(0,100,200,0.7)",   // Blue
            0.3, "rgba(0,150,255,0.8)",   // Light blue  
            0.4, "rgba(50,200,255,0.8)",  // Cyan
            0.5, "rgba(100,255,200,0.8)", // Light cyan
            0.6, "rgba(150,255,100,0.8)", // Light green
            0.7, "rgba(255,255,50,0.8)",  // Yellow
            0.8, "rgba(255,200,0,0.9)",   // Orange
            0.9, "rgba(255,100,0,0.9)",   // Red-orange
            1.0, "rgba(255,0,0,1.0)"      // Red (hot)
          ],
          
          // Radius based on zoom level
          "heatmap-radius": [
            "interpolate", ["linear"], ["zoom"],
            0, 15,   // Small radius at low zoom
            6, 25,   // Medium radius at mid zoom  
            12, 40   // Large radius at high zoom
          ],
          
          "heatmap-opacity": [
            "interpolate", ["linear"], ["zoom"],
            0, 0.9,   // More opaque at low zoom
            12, 0.7   // Less opaque at high zoom (to see circles)
          ]
        }
      }, getBeforeLayerId(map));
    }

    // Circle points for detailed view (visible at higher zooms)
    if (!map.getLayer("temperature-circles")) {
      map.addLayer({
        id: "temperature-circles", 
        type: "circle",
        source: "temperature",
        minzoom: 10,
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            10, 4,   // Small circles at zoom 10
            15, 8    // Larger circles at zoom 15
          ],
          
          // Color based on temperature value
          "circle-color": [
            "interpolate", ["linear"], ["get", "temp"],
            26, "#001f5c",    // Very cold - dark blue
            27, "#0040a0",    // Cold - blue  
            28, "#0080ff",    // Cool - light blue
            29, "#40c0ff",    // Mild - cyan
            30, "#80ff80",    // Warm - light green
            31, "#ffff00",    // Hot - yellow
            32, "#ff8000",    // Very hot - orange
            33, "#ff0000"     // Extremely hot - red
          ],
          
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255,255,255,0.8)",
          "circle-opacity": 0.8
        }
      }, getBeforeLayerId(map));
    }

    // Temperature labels (visible at very high zoom)
    if (!map.getLayer("temperature-labels")) {
      map.addLayer({
        id: "temperature-labels",
        type: "symbol", 
        source: "temperature",
        minzoom: 13,
        layout: {
          "text-field": ["concat", ["to-string", ["get", "temp"]], "°C"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            13, 10,
            16, 12
          ],
          "text-offset": [0, -1.5],
          "text-allow-overlap": false,
          "text-ignore-placement": false
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.8)", 
          "text-halo-width": 2
        }
      }, getBeforeLayerId(map));
    }

    console.log("Enhanced temperature layer added successfully");
    
  } catch (error) {
    console.error("Failed to add temperature layer:", error);
  }
}

// Helper function to find appropriate layer insertion point
function getBeforeLayerId(map) {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  
  // Insert before first symbol layer (labels, etc.)
  const firstSymbol = style.layers.find(layer => layer.type === "symbol");
  return firstSymbol ? firstSymbol.id : undefined;
}

export function removeTemperatureLayer(map) {
  if (!map || !map.getStyle) return;
  
  try {
    const layersToRemove = ["temperature-labels", "temperature-circles", "temperature-heat"];
    
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    
    if (map.getSource("temperature")) {
      map.removeSource("temperature");
    }
    
    console.log("Temperature layer removed successfully");
  } catch (err) {
    console.warn("Error removing temperature layer:", err);
  }
}