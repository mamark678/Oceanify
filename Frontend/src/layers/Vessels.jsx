// Vessels.jsx
import maplibregl from "maplibre-gl";

export function addVesselLayer(map) {
  console.log("Adding vessel layer...");
  
  if (!map.isStyleLoaded()) {
    map.on('styledata', () => addVesselLayer(map));
    return;
  }

  // Option 1: Static mock data (for development/testing)
  const staticVesselData = {
    type: "FeatureCollection",
    features: [
      // Container ships in main shipping lanes
      { type: "Feature", geometry: { type: "Point", coordinates: [124.1, 9.3] }, 
        properties: { mmsi: "477123456", name: "MV Pacific Carrier", type: "Container Ship", speed: 14.2, heading: 85 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [126.8, 8.7] }, 
        properties: { mmsi: "548987654", name: "MSC Manila", type: "Container Ship", speed: 16.8, heading: 270 } },
      
      // Bulk carriers
      { type: "Feature", geometry: { type: "Point", coordinates: [123.5, 8.1] }, 
        properties: { mmsi: "477234567", name: "Mindanao Bulk", type: "Bulk Carrier", speed: 12.1, heading: 45 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [125.9, 9.1] }, 
        properties: { mmsi: "548876543", name: "Iron Duke", type: "Bulk Carrier", speed: 11.5, heading: 180 } },
      
      // Fishing vessels
      { type: "Feature", geometry: { type: "Point", coordinates: [124.7, 8.4] }, 
        properties: { mmsi: "477345678", name: "F/V Maria Clara", type: "Fishing Vessel", speed: 3.2, heading: 225 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [122.3, 7.9] }, 
        properties: { mmsi: "477456789", name: "F/V Lapu-Lapu", type: "Fishing Vessel", speed: 2.8, heading: 90 } },
      
      // Tankers  
      { type: "Feature", geometry: { type: "Point", coordinates: [127.2, 8.2] }, 
        properties: { mmsi: "548765432", name: "Pacific Star", type: "Oil Tanker", speed: 13.7, heading: 315 } },
      
      // Inter-island ferries
      { type: "Feature", geometry: { type: "Point", coordinates: [124.9, 8.8] }, 
        properties: { mmsi: "477567890", name: "MV SuperFerry", type: "Passenger Ferry", speed: 18.5, heading: 135 } },
      { type: "Feature", geometry: { type: "Point", coordinates: [123.8, 7.6] }, 
        properties: { mmsi: "477678901", name: "MV Lite Ferry", type: "Passenger Ferry", speed: 16.2, heading: 0 } }
    ]
  };

  if (!map.getSource("vessels")) {
    map.addSource("vessels", {
      type: "geojson",
      data: staticVesselData
    });
  }

  if (!map.getLayer("vessels-layer")) {
    map.addLayer({
      id: "vessels-layer",
      type: "circle",
      source: "vessels",
      paint: {
        "circle-radius": ["case",
          ["==", ["get", "type"], "Container Ship"], 8,
          ["==", ["get", "type"], "Bulk Carrier"], 7,
          ["==", ["get", "type"], "Oil Tanker"], 7,
          ["==", ["get", "type"], "Passenger Ferry"], 6,
          5 // Fishing vessels
        ],
        "circle-color": ["case",
          ["==", ["get", "type"], "Container Ship"], "#FF4500",     // Orange Red
          ["==", ["get", "type"], "Bulk Carrier"], "#8B4513",      // Saddle Brown  
          ["==", ["get", "type"], "Oil Tanker"], "#DC143C",        // Crimson
          ["==", ["get", "type"], "Passenger Ferry"], "#4169E1",   // Royal Blue
          "#32CD32" // Lime Green for fishing
        ],
        "circle-opacity": 0.8,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      }
    });

    // Vessel labels with name and speed
    map.addLayer({
      id: "vessel-labels",
      type: "symbol",
      source: "vessels",
      layout: {
        "text-field": ["concat", ["get", "name"], "\n", ["get", "speed"], " kts"],
        "text-font": ["Open Sans Regular"],
        "text-size": 8,
        "text-offset": [0, -2],
        "text-anchor": "top"
      },
      paint: {
        "text-color": "#000000",
        "text-halo-color": "#ffffff",
        "text-halo-width": 1
      }
    });
    
    console.log("Maritime vessel layer added successfully");
  }
}

export function removeVesselLayer(map) {
  console.log("Removing vessel layer...");
  if (map.getLayer("vessel-labels")) {
    map.removeLayer("vessel-labels");
  }
  if (map.getLayer("vessels-layer")) {
    map.removeLayer("vessels-layer");
  }
  if (map.getSource("vessels")) {
    map.removeSource("vessels");
  }
}

// Option 2: Real-time AIS data integration (for production)
export function initializeRealTimeVessels(map) {
  if (!map) return;

  // Connect to AISStream websocket
  const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

  ws.onopen = () => {
    console.log("Connected to AISStream");
    // Subscribe to vessel positions in Philippine waters
    ws.send(JSON.stringify({
      Apikey: "6937c67cfbcc4ac4c22dbdbb87e6f97e8552f620",
      BoundingBoxes: [[[121, 6], [128, 10]]] // Covers Philippine waters
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.MetaData && data.MetaData.MMSI && data.Message && data.Message.PositionReport) {
        const { Longitude, Latitude } = data.Message.PositionReport;
        const mmsi = data.MetaData.MMSI;
        
        // Create or update vessel marker
        const markerId = `vessel-${mmsi}`;
        
        // Remove existing marker if it exists
        const existingMarker = document.getElementById(markerId);
        if (existingMarker) {
          existingMarker.remove();
        }
        
        // Create new marker
        const marker = new maplibregl.Marker({ 
          color: "#FF4500",
          scale: 0.8 
        })
          .setLngLat([Longitude, Latitude])
          .setPopup(new maplibregl.Popup().setHTML(`
            <strong>MMSI:</strong> ${mmsi}<br>
            <strong>Position:</strong> ${Latitude.toFixed(4)}, ${Longitude.toFixed(4)}<br>
            <strong>Speed:</strong> ${data.Message.PositionReport.SpeedOverGround || 'N/A'} kts
          `))
          .addTo(map);
          
        // Store marker reference for cleanup
        marker.getElement().id = markerId;
      }
    } catch (error) {
      console.error("Error processing AIS message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("AIS WebSocket error:", error);
  };

  ws.onclose = () => {
    console.log("AIS WebSocket connection closed");
  };

  return () => {
    ws.close();
  };
}