// React core hooks
import { useEffect, useRef, useState } from "react";
// Router
import { useNavigate } from "react-router";
// Components
import Navbar from "../../components/Navbar";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";
import { createEnhancedPopup } from "../../components/PopupContent";

export default function UserPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const navigate = useNavigate();
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);

  // Convert degrees to compass direction
  const degToCompass = (deg) => {
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
  };

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

    //Define Bounds
    // const philippinesBounds = [
    //   [4.5, 116.5], // SW corner
    //   [21.5, 126.6], // NE corner
    // ];

    const initializeMap = () => {
      const L = window.L;
      if (!L) return console.error("Leaflet failed to load");

      const map = L.map("map").setView([8.0, 125.0], 6);

      // const map = L.map("map", {
      //   maxBounds: philippinesBounds,
      //   maxBoundsViscosity: 1.0,
      //   minZoom: 6,
      //   maxZoom: 12,
      // }).setView([12.0, 122.0], 6);

      mapRef.current = map;

      // Base map
      // Base map (blue/dark-themed)
      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>',
        }
      ).addTo(map);

      // OpenWeatherMap layers
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

      // Default: temperature
      tempLayer.addTo(map);

      // Store layers
      map.tempLayer = tempLayer;
      map.pressureLayer = pressureLayer;
      map.precipitationLayer = precipitationLayer;
      map.cloudsLayer = cloudsLayer;
      map.windLayer = windLayer;

      setMapLoaded(true);

      // Geolocation
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const userIcon = L.divIcon({
            html: `<div style="background-color: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("📍 Your Location")
            .openPopup();
          map.setView([latitude, longitude], 7);
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click handler: Open-Meteo + marine data
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);
        setLoading(true);

        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
          const waveUrl = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period&timezone=auto`;
          const [weatherResponse, waveResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(waveUrl),
          ]);

          const weatherData = weatherResponse.ok
            ? await weatherResponse.json()
            : null;
          const waveData = waveResponse.ok ? await waveResponse.json() : null;

          // Remove previous marker
          if (markerRef.current && map.hasLayer(markerRef.current)) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
          }

          if (weatherData?.current) {
            const { current } = weatherData;

            const formatValue = (value, unit = "", decimals = 1) =>
              value == null
                ? "N/A"
                : typeof value === "number"
                ? decimals === 0
                  ? `${Math.round(value)}${unit}`
                  : `${value.toFixed(decimals)}${unit}`
                : `${value}${unit}`;

            const getWeatherDescription = (code) => {
              const codes = {
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
              return codes[code] || `Code: ${code}`;
            };

            const popupContent = createEnhancedPopup(
              weatherData,
              waveData,
              lat,
              lng,
              getWeatherDescription,
              degToCompass,
              formatValue
            );

            const weatherIcon = L.divIcon({
              html: `<div style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">${
                current.temperature_2m != null
                  ? Math.round(current.temperature_2m) + "°"
                  : "?"
              }</div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
              popupAnchor: [0, -16],
            });

            markerRef.current = L.marker([lat, lng], { icon: weatherIcon })
              .addTo(map)
              .bindPopup(popupContent, {
                maxWidth: 400, // Increased to accommodate new design
                className: "weather-popup",
              })
              .openPopup();
          }
        } catch (err) {
          console.warn("Weather fetch failed", err);
        } finally {
          setLoading(false);
        }
      });
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // Layer toggle helpers
  const toggleLayer = (layerName, currentState, setState) => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const layer = map[layerName];
    if (currentState) {
      if (map.hasLayer(layer)) map.removeLayer(layer);
      setState(false);
    } else {
      layer?.addTo(map);
      setState(true);
    }
  };

  const buttonStyle = (enabled = true) => ({
    padding: "12px 20px",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: enabled ? "pointer" : "not-allowed",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: "all 0.3s ease",
    minWidth: "160px",
    marginBottom: "12px",
    opacity: enabled ? 1 : 0.7,
  });

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* Navbar fixed on top */}
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000 }}
      >
        <Navbar />
      </div>

      {/* Map below the navbar */}
      <div
        id="map"
        style={{
          position: "absolute",
          top: "60px", // adjust to navbar height
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 0,
        }}
      />
      <MarineVisualizer lat={selectedLat} lng={selectedLng} />

      {/* Control buttons */}
      <div
        style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          zIndex: 2000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() =>
            toggleLayer("tempLayer", showTemperature, setShowTemperature)
          }
          style={{
            ...buttonStyle(),
            background: showTemperature
              ? "linear-gradient(135deg,#ff6b6b,#ee5a52)"
              : "linear-gradient(135deg,#95a5a6,#7f8c8d)",
          }}
        >
          Temperature {showTemperature ? "ON" : "OFF"}
        </button>
        <button
          onClick={() =>
            toggleLayer("pressureLayer", showPressure, setShowPressure)
          }
          style={{
            ...buttonStyle(),
            background: showPressure
              ? "linear-gradient(135deg,#9b59b6,#8e44ad)"
              : "linear-gradient(135deg,#95a5a6,#7f8c8d)",
          }}
        >
          Pressure {showPressure ? "ON" : "OFF"}
        </button>
        <button
          onClick={() =>
            toggleLayer("precipitationLayer", showStorm, setShowStorm)
          }
          style={{
            ...buttonStyle(),
            background: showStorm
              ? "linear-gradient(135deg,#6366f1,#0ea5e9)"
              : "linear-gradient(135deg,#95a5a6,#7f8c8d)",
          }}
        >
          Storm Layers {showStorm ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => navigate("/account-management-page")}
          style={{
            ...buttonStyle(),
            background: "linear-gradient(135deg,#3b82f6,#2563eb)",
          }}
        >
          ← Account Management
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "20px 32px",
            borderRadius: "12px",
            zIndex: 3000,
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
