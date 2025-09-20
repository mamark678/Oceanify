// src/layers/Temperature.jsx
// Global ocean temperature layer with realistic temperature variations

async function fetchTemperatureFromAPI(bbox) {
  // Generate realistic global ocean temperature data
  // Based on actual oceanographic patterns and seasonal variations
  
  const oceanTemperaturePoints = [];
  
  // Define major ocean regions with realistic temperature ranges
  const oceanRegions = [
    // PACIFIC OCEAN
    // North Pacific (cooler)
    { name: "North Pacific", centerLon: -150, centerLat: 45, radius: 15, baseTemp: 12, variation: 8 },
    { name: "North Pacific East", centerLon: -130, centerLat: 40, radius: 12, baseTemp: 14, variation: 6 },
    
    // Central Pacific (moderate)
    { name: "Central Pacific", centerLon: -160, centerLat: 20, radius: 20, baseTemp: 24, variation: 4 },
    { name: "Central Pacific East", centerLon: -120, centerLat: 15, radius: 15, baseTemp: 22, variation: 5 },
    
    // Tropical Pacific (warm)
    { name: "Tropical Pacific West", centerLon: 160, centerLat: 10, radius: 18, baseTemp: 28, variation: 3 },
    { name: "Tropical Pacific Central", centerLon: -150, centerLat: 5, radius: 25, baseTemp: 27, variation: 3 },
    { name: "Tropical Pacific East", centerLon: -100, centerLat: 0, radius: 12, baseTemp: 26, variation: 4 },
    
    // South Pacific
    { name: "South Pacific Warm", centerLon: 170, centerLat: -15, radius: 20, baseTemp: 25, variation: 4 },
    { name: "South Pacific Cool", centerLon: -120, centerLat: -30, radius: 18, baseTemp: 18, variation: 6 },
    { name: "South Pacific Cold", centerLon: -100, centerLat: -45, radius: 15, baseTemp: 12, variation: 5 },
    
    // ATLANTIC OCEAN
    // North Atlantic
    { name: "North Atlantic Warm", centerLon: -40, centerLat: 40, radius: 12, baseTemp: 16, variation: 8 },
    { name: "North Atlantic Cool", centerLon: -20, centerLat: 55, radius: 10, baseTemp: 10, variation: 6 },
    
    // Tropical Atlantic
    { name: "Caribbean", centerLon: -70, centerLat: 18, radius: 8, baseTemp: 28, variation: 2 },
    { name: "Gulf Stream", centerLon: -60, centerLat: 35, radius: 6, baseTemp: 24, variation: 4 },
    { name: "Tropical Atlantic", centerLon: -30, centerLat: 10, radius: 15, baseTemp: 27, variation: 3 },
    
    // South Atlantic
    { name: "South Atlantic Warm", centerLon: -20, centerLat: -10, radius: 18, baseTemp: 26, variation: 3 },
    { name: "South Atlantic Cool", centerLon: -30, centerLat: -35, radius: 15, baseTemp: 18, variation: 5 },
    { name: "South Atlantic Cold", centerLon: -40, centerLat: -50, radius: 12, baseTemp: 8, variation: 4 },
    
    // INDIAN OCEAN
    // Tropical Indian Ocean (very warm)
    { name: "Arabian Sea", centerLon: 65, centerLat: 15, radius: 8, baseTemp: 29, variation: 2 },
    { name: "Bay of Bengal", centerLon: 88, centerLat: 15, radius: 6, baseTemp: 28, variation: 2 },
    { name: "Central Indian Ocean", centerLon: 80, centerLat: -5, radius: 20, baseTemp: 28, variation: 2 },
    { name: "Western Indian Ocean", centerLon: 55, centerLat: -15, radius: 15, baseTemp: 27, variation: 3 },
    
    // Southern Indian Ocean
    { name: "South Indian Warm", centerLon: 90, centerLat: -25, radius: 18, baseTemp: 22, variation: 4 },
    { name: "South Indian Cool", centerLon: 70, centerLat: -40, radius: 15, baseTemp: 16, variation: 5 },
    { name: "South Indian Cold", centerLon: 50, centerLat: -50, radius: 12, baseTemp: 10, variation: 4 },
    
    // SOUTHERN OCEAN (Antarctic waters - very cold)
    { name: "Southern Ocean Pacific", centerLon: 150, centerLat: -60, radius: 25, baseTemp: 2, variation: 3 },
    { name: "Southern Ocean Atlantic", centerLon: 0, centerLat: -60, radius: 20, baseTemp: 1, variation: 3 },
    { name: "Southern Ocean Indian", centerLon: 90, centerLat: -60, radius: 20, baseTemp: 2, variation: 3 },
    
    // ARCTIC OCEAN (very cold)
    { name: "Arctic Ocean", centerLon: 0, centerLat: 75, radius: 15, baseTemp: -1, variation: 2 },
    { name: "Arctic Pacific", centerLon: -150, centerLat: 70, radius: 10, baseTemp: 0, variation: 3 },
    { name: "Arctic Atlantic", centerLon: 10, centerLat: 80, radius: 8, baseTemp: -1, variation: 2 },
    
    // MEDITERRANEAN & REGIONAL SEAS
    { name: "Mediterranean", centerLon: 15, centerLat: 38, radius: 8, baseTemp: 20, variation: 6 },
    { name: "Black Sea", centerLon: 33, centerLat: 43, radius: 3, baseTemp: 15, variation: 8 },
    { name: "Red Sea", centerLon: 38, centerLat: 20, radius: 4, baseTemp: 26, variation: 3 },
    
    // SOUTHEAST ASIAN SEAS (focus area - very warm)
    { name: "South China Sea", centerLon: 115, centerLat: 12, radius: 8, baseTemp: 28, variation: 2 },
    { name: "Philippine Sea", centerLon: 130, centerLat: 15, radius: 10, baseTemp: 28, variation: 2 },
    { name: "Celebes Sea", centerLon: 121, centerLat: 3, radius: 4, baseTemp: 29, variation: 1 },
    { name: "Java Sea", centerLon: 110, centerLat: -5, radius: 5, baseTemp: 29, variation: 2 },
    { name: "Coral Sea", centerLon: 155, centerLat: -15, radius: 8, baseTemp: 26, variation: 3 },
  ];
  
  // Generate temperature points for each ocean region
  oceanRegions.forEach(region => {
    // More points for larger regions
    const pointDensity = Math.max(20, Math.floor(region.radius * 2));
    
    for (let i = 0; i < pointDensity; i++) {
      // Create realistic distribution patterns
      const angle = (Math.PI * 2 * i) / pointDensity + Math.random() * 1.0;
      const distance = Math.random() * region.radius;
      
      // Add some clustering for realistic oceanographic patterns
      const clusterFactor = Math.random() < 0.3 ? 0.5 : 1.0; // 30% chance of clustering
      
      const lon = region.centerLon + Math.cos(angle) * distance * clusterFactor;
      const lat = region.centerLat + Math.sin(angle) * distance * clusterFactor;
      
      // Ensure longitude wraps correctly
      const normalizedLon = ((lon + 180) % 360) - 180;
      
      // Latitude-based temperature adjustment (cooler toward poles)
      const latitudeEffect = Math.cos(lat * Math.PI / 180) * 2; // Up to 2°C variation
      
      // Seasonal variation (simplified)
      const seasonalVariation = (Math.random() - 0.5) * region.variation;
      
      // Calculate final temperature
      let temperature = region.baseTemp + latitudeEffect + seasonalVariation;
      
      // Apply realistic ocean temperature constraints
      temperature = Math.max(-2, Math.min(35, temperature)); // Ocean freezes at -2°C, max ~35°C
      temperature = Math.round(temperature * 10) / 10; // Round to 1 decimal
      
      oceanTemperaturePoints.push({
        type: "Feature",
        geometry: { 
          type: "Point", 
          coordinates: [normalizedLon, lat] 
        },
        properties: { 
          temp: temperature,
          region: region.name,
          depth: "surface" // All surface temperatures
        }
      });
    }
  });
  
  // Add some additional random points in major ocean basins for better coverage
  const additionalPoints = 200;
  for (let i = 0; i < additionalPoints; i++) {
    const lon = (Math.random() * 360) - 180;
    const lat = (Math.random() * 140) - 70; // Avoid extreme polar regions
    
    // Determine temperature based on latitude and ocean basin
    let baseTemp;
    const absLat = Math.abs(lat);
    
    if (absLat < 20) {
      baseTemp = 27; // Tropical waters
    } else if (absLat < 40) {
      baseTemp = 20; // Temperate waters
    } else if (absLat < 60) {
      baseTemp = 10; // Cool waters
    } else {
      baseTemp = 2; // Polar waters
    }
    
    const variation = (Math.random() - 0.5) * 8; // ±4°C variation
    let temperature = baseTemp + variation;
    temperature = Math.max(-2, Math.min(35, temperature));
    temperature = Math.round(temperature * 10) / 10;
    
    oceanTemperaturePoints.push({
      type: "Feature",
      geometry: { 
        type: "Point", 
        coordinates: [lon, lat] 
      },
      properties: { 
        temp: temperature,
        region: "Open Ocean",
        depth: "surface"
      }
    });
  }
  
  console.log(`Generated ${oceanTemperaturePoints.length} global ocean temperature points`);
  
  return {
    type: "FeatureCollection",
    features: oceanTemperaturePoints
  };
}

// Enhanced global ocean detection
function isPointOverWater(map, lngLat) {
  try {
    const style = map.getStyle();
    if (!style || !style.layers) return true;
    
    // Look for water-related layers in the map style
    const waterLayers = style.layers.filter(layer => {
      const id = (layer.id || '').toLowerCase();
      const source = (layer.source || '').toLowerCase();
      return id.includes('water') || id.includes('ocean') || id.includes('sea') || 
             source.includes('water') || source.includes('ocean') || source.includes('sea') ||
             id.includes('marine') || id.includes('lake');
    });
    
    if (waterLayers.length > 0) {
      const pixel = map.project(lngLat);
      const bbox = [
        [pixel.x - 3, pixel.y - 3],
        [pixel.x + 3, pixel.y + 3]
      ];
      
      const features = map.queryRenderedFeatures(bbox, { 
        layers: waterLayers.map(l => l.id) 
      });
      
      if (features && features.length > 0) return true;
    }
    
    // Fallback: comprehensive global ocean area detection
    const [lon, lat] = lngLat;
    
    // Major land masses to exclude (simplified bounding boxes)
    const landMasses = [
      // North America
      { minLon: -170, maxLon: -50, minLat: 25, maxLat: 75 },
      // South America  
      { minLon: -85, maxLon: -35, minLat: -60, maxLat: 15 },
      // Europe
      { minLon: -10, maxLon: 50, minLat: 35, maxLat: 75 },
      // Africa
      { minLon: -20, maxLon: 55, minLat: -40, maxLat: 40 },
      // Asia
      { minLon: 25, maxLon: 180, minLat: 5, maxLat: 75 },
      // Australia
      { minLon: 110, maxLon: 160, minLat: -45, maxLat: -10 },
      // Greenland
      { minLon: -75, maxLon: -10, minLat: 60, maxLat: 85 },
      // Antarctica (partial)
      { minLon: -180, maxLon: 180, minLat: -90, maxLat: -65 }
    ];
    
    // Check if point is NOT over major land masses
    const overLand = landMasses.some(land => 
      lon >= land.minLon && lon <= land.maxLon && 
      lat >= land.minLat && lat <= land.maxLat
    );
    
    // If not clearly over land, assume it's over water
    return !overLand;
    
  } catch (err) {
    console.warn("isPointOverWater error:", err);
    return true; // Conservative fallback
  }
}

export async function addTemperatureLayer(map, options = {}) {
  console.log("Adding global ocean temperature layer...");
  if (!map) return;

  if (!map.isStyleLoaded()) {
    map.once("styledata", () => addTemperatureLayer(map, options));
    return;
  }

  try {
    // Fetch global ocean temperature data
    const bounds = map.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const data = await fetchTemperatureFromAPI(bbox);

    // Filter to keep only ocean points
    const filtered = {
      type: "FeatureCollection",
      features: data.features.filter(feature => {
        if (!feature?.geometry?.coordinates) return false;
        const [lng, lat] = feature.geometry.coordinates;
        return isPointOverWater(map, [lng, lat]);
      })
    };

    console.log(`Global ocean temperature: ${filtered.features.length} points loaded`);
    console.log(`Temperature range: ${Math.min(...filtered.features.map(f => f.properties.temp))}°C to ${Math.max(...filtered.features.map(f => f.properties.temp))}°C`);

    // Add/update source
    if (!map.getSource("temperature")) {
      map.addSource("temperature", { type: "geojson", data: filtered });
    } else {
      map.getSource("temperature").setData(filtered);
    }

    // Global temperature heatmap with extended range
    if (!map.getLayer("temperature-heat")) {
      map.addLayer({
        id: "temperature-heat",
        type: "heatmap",
        source: "temperature",
        maxzoom: 12,
        paint: {
          // Weight based on temperature deviation from global average (~15°C)
          "heatmap-weight": [
            "interpolate", ["linear"], ["get", "temp"], 
            -2, 0.2,   // Freezing water
            5, 0.3,    // Very cold
            15, 0.6,   // Average
            25, 0.8,   // Warm
            35, 1.0    // Very warm
          ],
          
          // Intensity varies with zoom
          "heatmap-intensity": [
            "interpolate", ["linear"], ["zoom"], 
            0, 0.4, 
            3, 0.8,
            6, 1.2, 
            12, 1.8
          ],
          
          // Comprehensive temperature color gradient
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",           // Transparent
            0.1, "rgba(25,25,112,0.6)",   // Navy (freezing)
            0.2, "rgba(0,50,200,0.7)",    // Deep blue (very cold)
            0.3, "rgba(0,100,255,0.8)",   // Blue (cold)
            0.4, "rgba(50,150,255,0.8)",  // Light blue (cool)
            0.5, "rgba(100,255,255,0.8)", // Cyan (moderate)
            0.6, "rgba(150,255,150,0.8)", // Light green (mild warm)
            0.7, "rgba(255,255,100,0.8)", // Yellow (warm)
            0.8, "rgba(255,180,0,0.9)",   // Orange (hot)
            0.9, "rgba(255,100,50,0.9)",  // Red-orange (very hot)
            1.0, "rgba(220,20,60,1.0)"    // Crimson (extremely hot)
          ],
          
          // Dynamic radius based on zoom
          "heatmap-radius": [
            "interpolate", ["linear"], ["zoom"],
            0, 8,    // Small at world view
            3, 15,   // Medium at regional view
            6, 25,   // Large at country view
            12, 45   // Very large at detailed view
          ],
          
          "heatmap-opacity": [
            "interpolate", ["linear"], ["zoom"],
            0, 0.9,
            8, 0.8,
            12, 0.6
          ]
        }
      }, getBeforeLayerId(map));
    }

    // Temperature circles for detailed inspection
    if (!map.getLayer("temperature-circles")) {
      map.addLayer({
        id: "temperature-circles", 
        type: "circle",
        source: "temperature",
        minzoom: 8,
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["zoom"],
            8, 3,
            12, 6,
            16, 10
          ],
          
          // Extended temperature color scale
          "circle-color": [
            "interpolate", ["linear"], ["get", "temp"],
            -2, "#191970",    // Navy (freezing)
            0, "#0000CD",     // Medium blue (ice cold)
            5, "#0080FF",     // Blue (very cold)
            10, "#00BFFF",    // Deep sky blue (cold)
            15, "#40E0D0",    // Turquoise (cool)
            20, "#98FB98",    // Pale green (mild)
            25, "#FFFF00",    // Yellow (warm)
            27, "#FFA500",    // Orange (hot)
            30, "#FF6347",    // Tomato (very hot)
            35, "#DC143C"     // Crimson (extreme)
          ],
          
          "circle-stroke-width": [
            "interpolate", ["linear"], ["zoom"],
            8, 0.5,
            16, 2
          ],
          "circle-stroke-color": "rgba(255,255,255,0.8)",
          "circle-opacity": 0.8
        }
      }, getBeforeLayerId(map));
    }

    // Temperature labels with improved visibility
    if (!map.getLayer("temperature-labels")) {
      map.addLayer({
        id: "temperature-labels",
        type: "symbol", 
        source: "temperature",
        minzoom: 11,
        layout: {
          "text-field": [
            "case",
            ["<", ["get", "temp"], 0],
            ["concat", ["to-string", ["get", "temp"]], "°C ❄️"],
            ["concat", ["to-string", ["get", "temp"]], "°C"]
          ],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": [
            "interpolate", ["linear"], ["zoom"],
            11, 9,
            14, 11,
            18, 14
          ],
          "text-offset": [0, -1.8],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
          "symbol-spacing": 100
        },
        paint: {
          "text-color": [
            "case",
            ["<", ["get", "temp"], 10], "#FFFFFF",  // White for cold temps
            ["<", ["get", "temp"], 25], "#000000",  // Black for moderate temps  
            "#FFFFFF"                               // White for hot temps
          ],
          "text-halo-color": [
            "case",
            ["<", ["get", "temp"], 10], "rgba(0,0,0,0.9)",     // Dark halo for cold
            ["<", ["get", "temp"], 25], "rgba(255,255,255,0.9)", // Light halo for moderate
            "rgba(0,0,0,0.9)"                                   // Dark halo for hot
          ],
          "text-halo-width": 2
        }
      }, getBeforeLayerId(map));
    }

    console.log("Global ocean temperature layer added successfully");
    
  } catch (error) {
    console.error("Failed to add temperature layer:", error);
  }
}

// Helper function to find appropriate layer insertion point
function getBeforeLayerId(map) {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  
  // Insert before first symbol layer to keep labels on top
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
    
    console.log("Global ocean temperature layer removed successfully");
  } catch (err) {
    console.warn("Error removing temperature layer:", err);
  }
}