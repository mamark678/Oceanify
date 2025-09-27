// src/pages/UserPage.jsx
import { useEffect, useRef, useState } from "react";

export default function UserPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [activeHeatmap, setActiveHeatmap] = useState("temperature");
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const API_KEY = "60b8ffcce91b8ebdc127d1219e56e0f5";

    // Load Leaflet dynamically
    const loadLeaflet = async () => {
      try {
        // Load CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
          document.head.appendChild(link);
        }

        // Load JS
        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
      }
    };

    const initializeMap = () => {
      const L = window.L;
      if (!L) {
        console.error('Leaflet failed to load');
        return;
      }

      // Initialize map
      const map = L.map("map").setView([7.908941, 125.078746], 5);
      mapRef.current = map;

      // Base map
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // OpenWeatherMap layers
      const tempLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const pressureLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );

      // Add temperature layer by default
      tempLayer.addTo(map);

      // Store layers on map object for easy access
      mapRef.current.tempLayer = tempLayer;
      mapRef.current.pressureLayer = pressureLayer;

      setMapLoaded(true);

      // Geolocation with better error handling
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("User location:", latitude, longitude);
          
          // Add user location marker
          const userIcon = L.divIcon({
            html: '<div style="background-color: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          
          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("📍 Your Location")
            .openPopup();
          
          map.setView([latitude, longitude], 7);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          // Keep default view if geolocation fails
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click handler
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        console.log("Map clicked at:", lat, lng);
        
        setLoading(true);

        // Use the actual clicked coordinates in the API call
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`;

        try {
          const response = await fetch(url);
          
          if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
          }
          
          const data = await response.json();
          console.log("Weather data received:", data);

          // Use current weather data
          const current = data.current;
          const temp = current.temperature_2m;
          const pressure = current.surface_pressure;
          const windSpeed = current.wind_speed_10m;
          const windDir = current.wind_direction_10m;
          const windGust = current.wind_gusts_10m;

          const popupContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 220px; padding: 4px;">
              <h4 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">🌤️ Weather Data</h4>
              <div style="display: grid; grid-template-columns: 1fr auto; gap: 8px 16px; font-size: 14px; line-height: 1.4;">
                <div style="color: #666;"><strong>Temperature:</strong></div><div style="font-weight: 600; color: #e74c3c;">${temp}°C</div>
                <div style="color: #666;"><strong>Pressure:</strong></div><div style="font-weight: 600; color: #3498db;">${pressure} hPa</div>
                <div style="color: #666;"><strong>Wind Speed:</strong></div><div style="font-weight: 600; color: #27ae60;">${windSpeed} m/s</div>
                <div style="color: #666;"><strong>Wind Direction:</strong></div><div style="font-weight: 600; color: #27ae60;">${windDir}°</div>
                <div style="color: #666;"><strong>Wind Gusts:</strong></div><div style="font-weight: 600; color: #f39c12;">${windGust} m/s</div>
              </div>
              <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
              </div>
            </div>
          `;

          // Custom marker icon with temperature
          const weatherIcon = L.divIcon({
            html: `<div style="
              background: linear-gradient(135deg, #ff6b6b, #ee5a52);
              color: white; 
              border-radius: 50%; 
              width: 32px; 
              height: 32px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 12px; 
              font-weight: bold; 
              border: 3px solid white; 
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
              cursor: pointer;
            ">${Math.round(temp)}°</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });

          // Remove previous marker if it exists
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          // Create new marker
          markerRef.current = L.marker([lat, lng], { icon: weatherIcon })
            .addTo(map)
            .bindPopup(popupContent, {
              maxWidth: 280,
              className: 'weather-popup'
            })
            .openPopup();

        } catch (err) {
          console.error("Error fetching weather data:", err);
          
          // Show error popup
          const errorPopup = `
            <div style="color: #e74c3c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px;">
              <h4 style="margin: 0 0 10px 0; font-size: 16px;">⚠️ Error</h4>
              <p style="margin: 0 0 8px 0; font-size: 14px;">Failed to fetch weather data for this location.</p>
              <p style="margin: 0; font-size: 12px; color: #888;">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
            </div>
          `;

          if (markerRef.current) {
            map.removeLayer(markerRef.current);
          }

          const errorIcon = L.divIcon({
            html: `<div style="
              background: linear-gradient(135deg, #e74c3c, #c0392b);
              color: white; 
              border-radius: 50%; 
              width: 32px; 
              height: 32px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: 16px; 
              border: 3px solid white; 
              box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            ">⚠️</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
          });

          markerRef.current = L.marker([lat, lng], { icon: errorIcon })
            .addTo(map)
            .bindPopup(errorPopup)
            .openPopup();
        } finally {
          setLoading(false);
        }
      });
    };

    loadLeaflet();

    // Cleanup
    return () => {
      if (mapRef.current) {
        console.log("Cleaning up map");
        mapRef.current.remove();
      }
    };
  }, []);

  // Heatmap toggle functions
  const showTemperatureHeatmap = () => {
    const map = mapRef.current;
    if (!map) return;

    console.log("Switching to temperature heatmap");
    
    if (map.hasLayer && map.hasLayer(map.pressureLayer)) {
      map.removeLayer(map.pressureLayer);
    }
    
    if (map.hasLayer && !map.hasLayer(map.tempLayer)) {
      map.tempLayer.addTo(map);
    }
    
    setActiveHeatmap("temperature");
  };

  const showPressureHeatmap = () => {
    const map = mapRef.current;
    if (!map) return;

    console.log("Switching to pressure heatmap");
    
    if (map.hasLayer && map.hasLayer(map.tempLayer)) {
      map.removeLayer(map.tempLayer);
    }
    
    if (map.hasLayer && !map.hasLayer(map.pressureLayer)) {
      map.pressureLayer.addTo(map);
    }
    
    setActiveHeatmap("pressure");
  };

  const buttonStyle = {
    padding: "12px 20px",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: mapLoaded ? "pointer" : "not-allowed",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "all 0.3s ease",
    minWidth: "160px",
    marginBottom: "12px",
    opacity: mapLoaded ? 1 : 0.7
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "#f8f9fa" }}>
      <div id="map" style={{ height: "100%", width: "100%" }}></div>

      {/* Loading indicator for weather data */}
      {loading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.9)",
          color: "white",
          padding: "20px 32px",
          borderRadius: "12px",
          zIndex: 2000,
          fontSize: "16px",
          fontWeight: "500",
          display: "flex",
          alignItems: "center",
          gap: "12px"
        }}>
          <div style={{ 
            width: "20px", 
            height: "20px", 
            border: "2px solid #ffffff40", 
            borderTop: "2px solid white", 
            borderRadius: "50%", 
            animation: "spin 1s linear infinite" 
          }}></div>
          Loading weather data...
        </div>
      )}

      {/* Map loading indicator */}
      {!mapLoaded && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "#666",
          zIndex: 1500,
          fontSize: "18px"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🗺️</div>
          <div style={{ fontWeight: "600", marginBottom: "8px" }}>Loading Map...</div>
          <div style={{ fontSize: "14px" }}>Please wait while we initialize the map</div>
        </div>
      )}

      {/* Control buttons */}
      <div style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column"
      }}>
        <button
          onClick={showTemperatureHeatmap}
          disabled={!mapLoaded}
          style={{
            ...buttonStyle,
            background: activeHeatmap === "temperature" 
              ? "linear-gradient(135deg, #ff6b6b, #ee5a52)" 
              : "linear-gradient(135deg, #4facfe, #00f2fe)"
          }}
        >
          🌡️ Temperature
        </button>

        <button
          onClick={showPressureHeatmap}
          disabled={!mapLoaded}
          style={{
            ...buttonStyle,
            background: activeHeatmap === "pressure" 
              ? "linear-gradient(135deg, #ff6b6b, #ee5a52)" 
              : "linear-gradient(135deg, #4facfe, #00f2fe)"
          }}
        >
          📊 Pressure
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        background: "rgba(0,0,0,0.85)",
        color: "white",
        padding: "16px 20px",
        borderRadius: "12px",
        fontSize: "14px",
        maxWidth: "280px",
        zIndex: 1000,
        lineHeight: 1.5
      }}>
        <div style={{ fontWeight: "600", marginBottom: "8px", fontSize: "16px" }}>💡 How to use:</div>
        <div>Click anywhere on the map to see current weather details for that location</div>
        {!mapLoaded && (
          <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
            Map is loading...
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}