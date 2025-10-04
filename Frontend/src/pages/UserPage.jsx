// src/pages/UserPage.jsx - NOAA removed; Open-Meteo + OpenWeatherMap only
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

export default function UserPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const navigate = useNavigate();

  // Helper functions
  function degToCompass(deg) {
    if (deg === null || deg === undefined) return "N/A";
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const idx = Math.floor(((deg % 360) + 360) / 22.5 + 0.5) % 16;
    return directions[idx];
  }

  useEffect(() => {
    const API_KEY = "60b8ffcce91b8ebdc127d1219e56e0f5";

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement("script");
          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (error) {
        console.error("Failed to load Leaflet:", error);
      }
    };

    const initializeMap = () => {
      const L = window.L;
      if (!L) {
        console.error("Leaflet failed to load");
        return;
      }

      const map = L.map("map").setView([8.0, 125.0], 6); // Default to Mindanao, Philippines
      mapRef.current = map;

      // Base map
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      // OpenWeatherMap raster layers (tiles)
      const tempLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const pressureLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const precipitationLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const cloudsLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );
      const windLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
        { opacity: 0.6 }
      );

      // Add temperature layer by default
      tempLayer.addTo(map);

      // Store layers on map object for toggles
      map.tempLayer = tempLayer;
      map.pressureLayer = pressureLayer;
      map.precipitationLayer = precipitationLayer;
      map.cloudsLayer = cloudsLayer;
      map.windLayer = windLayer;

      setMapLoaded(true);

      // Geolocation
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const userIcon = L.divIcon({
            html: '<div style="background-color: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("📍 Your Location")
            .openPopup();

          map.setView([latitude, longitude], 7);
        },
        (err) => {
          console.warn("Geolocation error:", err);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click handler: Open-Meteo point & marine lookups
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setLoading(true);

        try {
          // Open-Meteo URLs: forecast (current) and marine
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
          const waveUrl = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period&timezone=auto`;
          const [weatherResponse, waveResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(waveUrl),
          ]);

          let weatherData = null;
          let waveData = null;

          if (weatherResponse.ok) {
            weatherData = await weatherResponse.json();
            console.log("Weather data received:", weatherData);
          }

          if (waveResponse.ok) {
            waveData = await waveResponse.json();
            console.log("Wave data received:", waveData);
          }

          // Remove previous marker
          if (markerRef.current) {
            const existing = markerRef.current;
            if (map.hasLayer && map.hasLayer(existing)) {
              map.removeLayer(existing);
            }
            markerRef.current = null;
          }

          if (weatherData && weatherData.current) {
            const current = weatherData.current;

            const formatValue = (value, unit = "", decimals = 1) => {
              if (value === null || value === undefined) return "N/A";
              if (typeof value === "number") {
                return decimals === 0
                  ? `${Math.round(value)}${unit}`
                  : `${value.toFixed(decimals)}${unit}`;
              }

              return `${value}${unit}`;
            };

            const getWeatherDescription = (code) => {
              const weatherCodes = {
                0: "Clear sky",
                1: "Mainly clear",
                2: "Partly cloudy",
                3: "Overcast",
                45: "Fog",
                48: "Depositing rime fog",
                51: "Light drizzle",
                53: "Moderate drizzle",
                55: "Dense drizzle",
                56: "Light freezing drizzle",
                57: "Dense freezing drizzle",
                61: "Slight rain",
                63: "Moderate rain",
                65: "Heavy rain",
                66: "Light freezing rain",
                67: "Heavy freezing rain",
                71: "Slight snow",
                73: "Moderate snow",
                75: "Heavy snow",
                77: "Snow grains",
                80: "Slight rain showers",
                81: "Moderate rain showers",
                82: "Violent rain showers",
                85: "Slight snow showers",
                86: "Heavy snow showers",
                95: "Thunderstorm",
                96: "Thunderstorm with slight hail",
                99: "Thunderstorm with heavy hail",
              };
              return weatherCodes[code] || `Code: ${code}`;
              yyy;
            };

            const popupContent = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 280px; padding: 6px;">
                <h4 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px; font-weight: 600;">🌤️ Weather ${
                  waveData && waveData.current ? "& Marine" : ""
                } Data</h4>

                <div style="margin-bottom: 12px;">
                  <h5 style="margin: 0 0 6px 0; color: #e74c3c; font-size: 14px;">🌡️ Temperature</h5>
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 13px;">
                    <div style="color: #666;">Temperature:</div><div style="font-weight: 600; color: #e74c3c;">${formatValue(
                      current.temperature_2m,
                      "°C"
                    )}</div>
                    <div style="color: #666;">Feels like:</div><div style="font-weight: 600; color: #e74c3c;">${formatValue(
                      current.apparent_temperature,
                      "°C"
                    )}</div>
                    <div style="color: #666;">Humidity:</div><div style="font-weight: 600; color: #3498db;">${formatValue(
                      current.relative_humidity_2m,
                      "%",
                      0
                    )}</div>
                  </div>
                </div>

                <div style="margin-bottom: 12px;">
                  <h5 style="margin: 0 0 6px 0; color: #f39c12; font-size: 14px;">☀️ Conditions</h5>
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 13px;">
                    <div style="color: #666;">Weather:</div><div style="font-weight: 600; color: #f39c12;">${getWeatherDescription(
                      current.weather_code
                    )}</div>
                    <div style="color: #666;">Cloud Cover:</div><div style="font-weight: 600; color: #95a5a6;">${formatValue(
                      current.cloud_cover,
                      "%",
                      0
                    )}</div>
                    <div style="color: #666;">Day/Night:</div><div style="font-weight: 600; color: #f1c40f;">${
                      current.is_day ? "Day" : "Night"
                    }</div>
                  </div>
                </div>

                <div style="margin-bottom: 12px;">
                  <h5 style="margin: 0 0 6px 0; color: #3498db; font-size: 14px;">🌧️ Precipitation</h5>
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 13px;">
                    <div style="color: #666;">Precipitation:</div><div style="font-weight: 600; color: #3498db;">${formatValue(
                      current.precipitation,
                      " mm"
                    )}</div>
                  </div>
                </div>

                <div style="margin-bottom: 12px;">
                  <h5 style="margin: 0 0 6px 0; color: #9b59b6; font-size: 14px;">📊 Pressure</h5>
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 13px;">
                    <div style="color: #666;">Surface Pressure:</div><div style="font-weight: 600; color: #9b59b6;">${formatValue(
                      current.surface_pressure,
                      " hPa"
                    )}</div>
                  </div>
                </div>

                <div style="margin-bottom: 12px;">
                  <h5 style="margin: 0 0 6px 0; color: #27ae60; font-size: 14px;">💨 Wind</h5>
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 13px;">
                    <div style="color: #666;">Wind Speed:</div><div style="font-weight: 600; color: #27ae60;">${formatValue(
                      current.wind_speed_10m,
                      " km/h"
                    )}</div>
                    <div style="color: #666;">Wind Direction:</div><div style="font-weight: 600; color: #27ae60;">${formatValue(
                      current.wind_direction_10m,
                      "°",
                      0
                    )} (${degToCompass(current.wind_direction_10m)})</div>
                    <div style="color: #666;">Wind Gusts:</div><div style="font-weight: 600; color: #e67e22;">${formatValue(
                      current.wind_gusts_10m,
                      " km/h"
                    )}</div>
                  </div>
                </div>

                ${
                  waveData && waveData.current
                    ? `
                <div style="margin-bottom: 12px;">
                  <h5 style="margin: 0 0 6px 0; color: #2980b9; font-size: 14px;">🌊 Marine Data</h5>
                  <div style="display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; font-size: 13px;">
                    <div style="color: #666;">Wave Height:</div><div style="font-weight: 600; color: #2980b9;">${formatValue(
                      waveData.current.wave_height,
                      " m"
                    )}</div>
                    <div style="color: #666;">Wave Direction:</div><div style="font-weight: 600; color: #2980b9;">${formatValue(
                      waveData.current.wave_direction,
                      "°",
                      0
                    )}</div>
                    <div style="color: #666;">Swell Height:</div><div style="font-weight: 600; color: #3498db;">${formatValue(
                      waveData.current.swell_wave_height,
                      " m"
                    )}</div>
                    <div style="color: #666;">Swell Direction:</div><div style="font-weight: 600; color: #3498db;">${formatValue(
                      waveData.current.swell_wave_direction,
                      "°",
                      0
                    )}</div>
                    <div style="color: #666;">Secondary Swell Height:</div><div style="font-weight: 600; color: #5dade2;">${formatValue(
                      waveData.current.secondary_swell_wave_height,
                      " m"
                    )}</div>
                    <div style="color: #666;">Secondary Swell Period:</div><div style="font-weight: 600; color: #5dade2;">${formatValue(
                      waveData.current.secondary_swell_wave_period,
                      " s",
                      0
                    )}</div>
                  </div>
                </div>
                `
                    : ""
                }

                <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                  📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
                </div>
                <div style="margin-top: 4px; font-size: 11px; color: #888;">
                  Data: Open-Meteo + OpenWeatherMap
                </div>
              </div>
            `;

            // Custom marker icon with temperature
            const temp = current.temperature_2m;
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
              ">${temp !== null ? Math.round(temp) + "°" : "?"}</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16],
            });

            markerRef.current = L.marker([lat, lng], { icon: weatherIcon })
              .addTo(map)
              .bindPopup(popupContent, {
                maxWidth: 320,
                className: "weather-popup",
              })
              .openPopup();
          } else {
            // Fallback marker when Open-Meteo didn't return current data
            const fallbackIcon = L.divIcon({
              html: `<div style="
                background: linear-gradient(135deg, #74b9ff, #0984e3);
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
              ">🌤️</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            });

            markerRef.current = L.marker([lat, lng], { icon: fallbackIcon })
              .addTo(map)
              .bindPopup(
                `
                <div style="font-family: Arial, sans-serif; min-width: 280px;">
                  <h4 style="margin: 0 0 12px 0;">🌤️ Weather Data</h4>
                  <div style="font-size: 13px;">
                    <div><strong>Status:</strong> No current point data</div>
                  </div>
                  <div style="margin-top: 8px; font-size: 12px; color: #666;">
                    📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
                  </div>
                  <div style="margin-top: 8px; font-size: 11px; color: #888;">
                    Data source: Open-Meteo / OpenWeatherMap
                  </div>
                </div>
              `
              )
              .openPopup();
          }
        } catch (weatherErr) {
          console.warn("Weather data fetch failed", weatherErr);

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
          });

          if (
            markerRef.current &&
            map.hasLayer &&
            map.hasLayer(markerRef.current)
          ) {
            map.removeLayer(markerRef.current);
          }

          markerRef.current = L.marker([lat, lng], { icon: errorIcon })
            .addTo(map)
            .bindPopup(
              `
              <div style="color: #e74c3c; font-family: Arial, sans-serif; padding: 4px;">
                <h4 style="margin: 0 0 10px 0;">⚠️ Data Error</h4>
                <p style="margin: 0 0 8px 0;">Failed to fetch weather/marine data.</p>
                <p style="margin: 0; font-size: 12px; color: #888;">📍 ${lat.toFixed(
                  4
                )}, ${lng.toFixed(4)}</p>
              </div>
            `
            )
            .openPopup();
        } finally {
          setLoading(false);
        }
      });
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        if (mapRef.current.stormMarkers && mapRef.current.stormMarkers.length) {
          try {
            mapRef.current.stormMarkers.forEach((m) => {
              if (m && mapRef.current.hasLayer && mapRef.current.hasLayer(m)) {
                mapRef.current.removeLayer(m);
              }
            });
          } catch (e) {
            console.warn("Error removing markers", e);
          }
        }
        mapRef.current.remove();
      }
    };
  }, []);

  // Layer toggle functions (OpenWeatherMap tile overlays)
  const toggleTemperatureLayer = () => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (showTemperature) {
      if (map.hasLayer && map.hasLayer(map.tempLayer)) {
        map.removeLayer(map.tempLayer);
      }
      setShowTemperature(false);
    } else {
      if (map.tempLayer && (!map.hasLayer || !map.hasLayer(map.tempLayer))) {
        map.tempLayer.addTo(map);
      }
      setShowTemperature(true);
    }
  };

  const togglePressureLayer = () => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (showPressure) {
      if (map.hasLayer && map.hasLayer(map.pressureLayer)) {
        map.removeLayer(map.pressureLayer);
      }
      setShowPressure(false);
    } else {
      if (
        map.pressureLayer &&
        (!map.hasLayer || !map.hasLayer(map.pressureLayer))
      ) {
        map.pressureLayer.addTo(map);
      }
      setShowPressure(true);
    }
  };

  const toggleStormLayer = () => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (showStorm) {
      if (map.hasLayer && map.hasLayer(map.precipitationLayer)) {
        map.removeLayer(map.precipitationLayer);
      }
      if (map.hasLayer && map.hasLayer(map.cloudsLayer)) {
        map.removeLayer(map.cloudsLayer);
      }
      if (map.hasLayer && map.hasLayer(map.windLayer)) {
        map.removeLayer(map.windLayer);
      }
      setShowStorm(false);
    } else {
      if (map.precipitationLayer) map.precipitationLayer.addTo(map);
      if (map.cloudsLayer) map.cloudsLayer.addTo(map);
      if (map.windLayer) map.windLayer.addTo(map);
      setShowStorm(true);
    }
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
    opacity: mapLoaded ? 1 : 0.7,
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div id="map" style={{ height: "100%", width: "100%" }}></div>

      {/* Loading indicator */}
      {loading && (
        <div
          style={{
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
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "20px",
              height: "20px",
              border: "2px solid #ffffff40",
              borderTop: "2px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          Loading Weather Details...
        </div>
      )}

      {/* Map loading indicator */}
      {!mapLoaded && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "#666",
            zIndex: 1500,
            fontSize: "18px",
          }}
        ></div>
      )}

      {/* Control buttons */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={toggleTemperatureLayer}
          disabled={!mapLoaded}
          style={{
            ...buttonStyle,
            background: showTemperature
              ? "linear-gradient(135deg, #ff6b6b, #ee5a52)"
              : "linear-gradient(135deg, #95a5a6, #7f8c8d)",
          }}
        >
          Temperature {showTemperature ? "ON" : "OFF"}
        </button>

        <button
          onClick={togglePressureLayer}
          disabled={!mapLoaded}
          style={{
            ...buttonStyle,
            background: showPressure
              ? "linear-gradient(135deg, #9b59b6, #8e44ad)"
              : "linear-gradient(135deg, #95a5a6, #7f8c8d)",
          }}
        >
          Pressure {showPressure ? "ON" : "OFF"}
        </button>

        <button
          onClick={toggleStormLayer}
          disabled={!mapLoaded}
          style={{
            ...buttonStyle,
            background: showStorm
              ? "linear-gradient(135deg, #6366f1, #0ea5e9)"
              : "linear-gradient(135deg, #95a5a6, #7f8c8d)",
          }}
        >
          Storm Layers {showStorm ? "ON" : "OFF"}
        </button>

        <button
          onClick={() => navigate("/account-management-page")}
          style={{
            ...buttonStyle,
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
          }}
        >
          ← Account Management
        </button>
      </div>

      {/* Instructions */}
      {/* <div
        style={{
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
          lineHeight: 1.5,
        }}
      >
        <div
          style={{ fontWeight: "600", marginBottom: "8px", fontSize: "16px" }}
        >
          💡 How to use:
        </div>
        <div>
          • Click anywhere to see complete weather & wave data (Open-Meteo)
        </div>
        <div>
          • Toggle temperature/pressure layers ON/OFF (OpenWeatherMap tiles)
        </div>
        <div>
          • Use the Storm button to toggle precipitation, clouds, and wind
          layers together
        </div>
        {!mapLoaded && (
          <div style={{ marginTop: "8px", fontSize: "12px", opacity: 0.8 }}>
            Map is loading...
          </div>
        )}
      </div> */}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
