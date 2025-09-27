// src/pages/UserPage.jsx
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

import { addTemperatureLayer, removeTemperatureLayer } from "../layers/Temperature";
import { addVesselLayer, removeVesselLayer } from "../layers/Vessels";
import { addWindLayer, removeWindLayer } from "../layers/Wind";

export default function UserPage() {
  const mapRef = useRef(null);
  const [showTemperature, setShowTemperature] = useState(false);
  const [showWind, setShowWind] = useState(false);
  const [showVessels, setShowVessels] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const addDebug = (message) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addDebug("Component mounted, initializing map...");
    if (!maplibregl) {
      addDebug("ERROR: maplibregl not available");
      return;
    }

    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      addDebug("ERROR: Map container element not found");
      return;
    }

    try {
      const map = new maplibregl.Map({
        container: "map",
        style: "https://demotiles.maplibre.org/style.json",
        center: [125.155, 7.900],
        zoom: 5,
        attributionControl: false
      });

      mapRef.current = map;

      map.on('load', async () => {
        addDebug("Map loaded successfully");
        setMapLoaded(true);

        // add satellite basemap (Esri World Imagery) under everything
        try {
          if (!map.getSource('esri-sat')) {
            map.addSource('esri-sat', {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              ],
              tileSize: 256
            });

            // put it at bottom
            const firstLayer = (map.getStyle().layers || [])[0];
            map.addLayer({
              id: 'esri-sat-layer',
              type: 'raster',
              source: 'esri-sat',
              paint: { 'raster-opacity': 1.0 }
            }, firstLayer ? firstLayer.id : undefined);
          }
        } catch (err) {
          console.warn("Failed to add satellite layer:", err);
        }

        // Load oceans polygon to constrain view and add subtle land mask
        try {
          await addOceanMaskAndFit(map);
          addDebug("Ocean polygon loaded & map fitted to ocean extent");
        } catch (err) {
          console.warn("Failed to load oceans.geojson:", err);
          addDebug("Could not load ocean polygon - map not constrained.");
        }
      });

      map.on('error', (e) => {
        addDebug(`Map error: ${e && e.error ? e.error.message : JSON.stringify(e)}`);
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      return () => {
        addDebug("Cleaning up map");
        try { if (map) map.remove(); } catch (err) { console.error(err); }
        mapRef.current = null;
      };
    } catch (error) {
      addDebug(`Failed to initialize map: ${error.message}`);
      console.error(error);
    }
  }, []);

  // Load ocean polygon and apply mask + fit bounds
  async function addOceanMaskAndFit(map) {
    // expects file at public/data/oceans.geojson
    const res = await fetch('/data/oceans.geojson');
    if (!res.ok) throw new Error('oceans.geojson not found');
    const oceans = await res.json();

    // add oceans source + layer (visible if you want)
    if (!map.getSource('oceans')) {
      map.addSource('oceans', { type: 'geojson', data: oceans });
    } else {
      map.getSource('oceans').setData(oceans);
    }

    // Optional: show the ocean polygon (subtle)
    if (!map.getLayer('oceans-fill')) {
      map.addLayer({
        id: 'oceans-fill',
        type: 'fill',
        source: 'oceans',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'value'], // e.g. temperature/wind if attached
            0, '#08306b',
            15, '#4292c6',
            30, '#deebf7'
          ],
          'fill-opacity': 0.6
        }
      }, getBeforeLayerId(map));
    }

    // Add a land mask by adding a large rectangle fill then punching out oceans using the 'difference' style if desired.
    // Simpler: just dim land by adding a land polygon (if you have land.geojson) or you can invert colors using blend mode.
    // For now we'll fit the map to the oceans bbox:
    const turfBbox = computeGeoJSONBBox(oceans);
    if (turfBbox) {
      // turfBbox = [minX, minY, maxX, maxY]
      // add padding and fit
      map.fitBounds([[turfBbox[0], turfBbox[1]], [turfBbox[2], turfBbox[3]]], { padding: 40, maxZoom: 7, duration: 1000 });
    }
  }

  // compute bbox of GeoJSON FeatureCollection (simple)
  function computeGeoJSONBBox(geojson) {
    if (!geojson || !geojson.features || geojson.features.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const walk = (coords) => {
      if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
        const [x,y] = coords;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      } else {
        coords.forEach(c => walk(c));
      }
    };
    geojson.features.forEach(f => walk(f.geometry.coordinates));
    if (!isFinite(minX)) return null;
    return [minX, minY, maxX, maxY];
  }

  // Toggle handlers
  const handleTemperatureToggle = () => {
    const map = mapRef.current;
    if (!map) { addDebug("WARN: Map object not yet created"); return; }

    addDebug(`${showTemperature ? 'Hiding' : 'Showing'} temperature layer`);
    if (showTemperature) {
      removeTemperatureLayer(map);
      setShowTemperature(false);
      return;
    }

    if (!map.isStyleLoaded()) {
      addDebug("Style not loaded yet, scheduling temperature layer once style loads");
      map.once('styledata', () => {
        addTemperatureLayer(map);
        setShowTemperature(true);
      });
    } else {
      addTemperatureLayer(map);
      setShowTemperature(true);
    }
  };

  const handleWindToggle = () => {
    const map = mapRef.current;
    if (!map) { addDebug("WARN: Map object not yet created"); return; }

    addDebug(`${showWind ? 'Hiding' : 'Showing'} wind layer`);
    if (showWind) {
      removeWindLayer(map);
      setShowWind(false);
      return;
    }

    if (!map.isStyleLoaded()) {
      addDebug("Style not loaded yet, scheduling wind layer once style loads");
      map.once('styledata', () => {
        addWindLayer(map);
        setShowWind(true);
      });
    } else {
      addWindLayer(map);
      setShowWind(true);
    }
  };

  const handleVesselToggle = () => {
    const map = mapRef.current;
    if (!map) { addDebug("WARN: Map object not yet created"); return; }

    addDebug(`${showVessels ? 'Hiding' : 'Showing'} vessel layer`);
    if (showVessels) {
      removeVesselLayer(map);
      setShowVessels(false);
      return;
    }

    if (!map.isStyleLoaded()) {
      addDebug("Style not loaded yet, scheduling vessel layer once style loads");
      map.once('styledata', () => {
        addVesselLayer(map);
        setShowVessels(true);
      });
    } else {
      addVesselLayer(map);
      setShowVessels(true);
    }
  };

  const buttonStyle = {
    margin: '6px',
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
  };

  return (
    <>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1001, backgroundColor: "rgba(0,0,0,0.8)", color: "white", padding: "10px", borderRadius: "5px", fontSize: "12px", maxWidth: "320px", fontFamily: "monospace" }}>
        <div><strong>Map Status:</strong> {mapLoaded ? "✅ Loaded" : "⏳ Loading..."}</div>
        <div style={{marginTop: "6px"}}><strong>Debug Log:</strong></div>
        {debugInfo.map((info, i) => (<div key={i} style={{fontSize: "10px", opacity: 0.9}}>{info}</div>))}
      </div>

      <div style={{ position: "absolute", top: 10, left: 10, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <button style={{ ...buttonStyle, backgroundColor: showTemperature ? '#e3f2fd' : '#ffffff', borderColor: showTemperature ? '#2196f3' : '#ccc' }} onClick={handleTemperatureToggle}>
          {showTemperature ? 'Hide Temperature' : 'Show Temperature'}
        </button>
        <button style={{ ...buttonStyle, backgroundColor: showWind ? '#e8f5e8' : '#ffffff', borderColor: showWind ? '#4caf50' : '#ccc' }} onClick={handleWindToggle}>
          {showWind ? 'Hide Wind' : 'Show Wind'}
        </button>
        <button style={{ ...buttonStyle, backgroundColor: showVessels ? '#fff3e0' : '#ffffff', borderColor: showVessels ? '#ff9800' : '#ccc' }} onClick={handleVesselToggle}>
          {showVessels ? 'Hide Vessels' : 'Show Vessels'}
        </button>
      </div>

      <div id="map" style={{ width: '100%', height: '100vh', position: 'relative' }}>
        {!mapLoaded && (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: 40 }}>🗺️</div>
            <div>Loading Map...</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>Check console for debug info</div>
          </div>
        )}
      </div>
    </>
  );
}

// helper used by UserPage: pick a before-layer id so overlays are visible
function getBeforeLayerId(map) {
  const style = map.getStyle();
  if (!style || !style.layers) return undefined;
  const firstSymbol = style.layers.find(l => l.type === 'symbol');
  return firstSymbol ? firstSymbol.id : undefined;
}
