// src/pages/User/UserPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEnhancedPopup } from "../../components/PopupContent";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";

export default function UserPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const warningMarkersRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const navigate = useNavigate();
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);

  // Rescue button states
  const [showRescueConfirm, setShowRescueConfirm] = useState(false);
  const [rescueCountdown, setRescueCountdown] = useState(10);
  const [rescuePendingLocation, setRescuePendingLocation] = useState(null);
  const [rescuePendingReason, setRescuePendingReason] = useState(null);
  const [rescueActive, setRescueActive] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState([]);

  // CONFIG: thresholds & grid step
  const GRID_STEP = 0.5;
  const THRESHOLDS = {
    wind_speed_kmh: 50,
    wind_gust_kmh: 70,
    precipitation_mm_h: 15,
    wave_height_m: 2.5,
  };

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

  /* -----------------------
     Rescue flow functions
     ----------------------- */

  const requestRescueAt = (lat, lng, reason = "Unknown") => {
    setRescuePendingLocation({ lat, lng });
    setRescuePendingReason(reason);
    setRescueCountdown(10);
    setShowRescueConfirm(true);
  };

  const confirmRescue = async (
    overrideLocation = null,
    overrideReason = null
  ) => {
    const loc = overrideLocation || rescuePendingLocation;
    const reason = overrideReason || rescuePendingReason || "Unknown";

    if (!loc) {
      alert("No location selected for rescue.");
      setShowRescueConfirm(false);
      return;
    }

    setShowRescueConfirm(false);
    setRescueActive(true);

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
      const waveUrl = `https://api.open-meteo.com/v1/marine?latitude=${loc.lat}&longitude=${loc.lng}&current=wave_height,wave_direction&timezone=auto`;

      const [weatherRes, waveRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(waveUrl),
      ]);

      const weatherData = weatherRes.ok ? await weatherRes.json() : null;
      const waveData = waveRes.ok ? await waveRes.json() : null;

      const emergencyData = {
        timestamp: new Date().toISOString(),
        latitude: loc.lat,
        longitude: loc.lng,
        reason,
        weather: weatherData?.current || {},
        marine: waveData?.current || {},
        note: "client-side rescue request (logged locally)",
      };

      let backendOk = false;
      try {
        const resp = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emergencyData),
        });
        if (resp.ok) backendOk = true;
      } catch (err) {
        console.warn("Backend unreachable. Falling back to local log.", err);
      }

      // Place SOS marker on map
      if (mapRef.current && window.L) {
        const L = window.L;
        const sosIcon = L.divIcon({
          html: `<div class="sos-icon">🆘</div>`,
          iconSize: [56, 56],
          iconAnchor: [28, 28],
        });

        L.marker([loc.lat, loc.lng], { icon: sosIcon })
          .addTo(mapRef.current)
          .bindPopup(
            `<div class="p-3 bg-gradient-to-br from-red-900/90 to-orange-900/70 rounded-xl border border-red-500/30 backdrop-blur-sm">
              <b class="text-white">🆘 EMERGENCY</b><br/>
              <span class="text-red-200">Reason: ${reason}</span><br/>
              <span class="text-blue-200 text-sm">${new Date().toLocaleString()}</span>
            </div>`
          )
          .openPopup();
      }

      // Save locally
      try {
        const logs = JSON.parse(localStorage.getItem("rescueLogs") || "[]");
        logs.unshift({
          ...emergencyData,
          persistedAt: new Date().toISOString(),
          backendOk,
        });
        localStorage.setItem("rescueLogs", JSON.stringify(logs));
      } catch (err) {
        console.warn("Failed to persist rescue log", err);
      }

      console.log("Rescue event logged:", { ...emergencyData, backendOk });
      alert(
        "🆘 Rescue request recorded. Admin has been notified (or saved locally)."
      );

      setTimeout(() => setRescueActive(false), 10000);
    } catch (err) {
      console.error("confirmRescue error:", err);
      alert("Failed to send rescue request — saved locally.");
      setRescueActive(false);
    }
  };

  const cancelRescue = () => {
    setShowRescueConfirm(false);
    setRescueCountdown(10);
    setRescuePendingLocation(null);
    setRescuePendingReason(null);
  };

  // Countdown effect
  useEffect(() => {
    if (showRescueConfirm && rescueCountdown > 0) {
      const t = setTimeout(() => setRescueCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (showRescueConfirm && rescueCountdown === 0) {
      confirmRescue();
    }
  }, [showRescueConfirm, rescueCountdown]);

  /* -----------------------
     Map init + storm scanning
     ----------------------- */

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
      } catch (err) {
        console.error("Failed to load Leaflet", err);
      }
    };

    const clearWarningMarkers = () => {
      if (!mapRef.current) return;
      const L = window.L;
      (warningMarkersRef.current || []).forEach((m) => {
        try {
          if (mapRef.current.hasLayer(m)) mapRef.current.removeLayer(m);
        } catch (e) {}
      });
      warningMarkersRef.current = [];
    };

    const addWarningMarker = (lat, lng, summary, details = {}) => {
      if (!mapRef.current || !window.L) return;
      const L = window.L;

      const marker = L.circleMarker([lat, lng], {
        radius: 16,
        color: "#ff8c00",
        fillColor: "#ffb86b",
        fillOpacity: 0.8,
        weight: 3,
      }).addTo(mapRef.current);

      const popupHtml = `
        <div class="min-w-[240px] p-3 bg-gradient-to-br from-orange-900/90 to-yellow-900/70 rounded-xl border border-orange-500/30 backdrop-blur-sm">
          <h3 class="text-white font-bold mb-2 flex items-center gap-2">
            <span>⚠️</span>
            Strong Storm Area
          </h3>
          <div class="text-orange-200 text-sm mb-3">
            ${summary}
          </div>
          <div class="text-orange-300 text-xs mb-3 space-y-1">
            <div><b>Wind:</b> ${details.wind_speed ?? "N/A"} km/h</div>
            <div><b>Gust:</b> ${details.wind_gust ?? "N/A"} km/h</div>
            <div><b>Wave:</b> ${details.wave_height ?? "N/A"} m</div>
            <div><b>Precip:</b> ${details.precipitation ?? "N/A"} mm</div>
          </div>
          <div class="flex gap-2">
            <button class="request-rescue-btn flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold border-none cursor-pointer transition-all hover:scale-105" data-lat="${lat}" data-lng="${lng}">
              Request Rescue
            </button>
            <button class="view-more-btn flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 text-white border-none cursor-pointer transition-all hover:scale-105" data-lat="${lat}" data-lng="${lng}">
              Details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      warningMarkersRef.current.push(marker);
    };

    const scanStormsInBounds = async () => {
      if (!mapRef.current || !window.L) return;
      const map = mapRef.current;
      clearWarningMarkers();

      const bounds = map.getBounds();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const east = bounds.getEast();

      const latSteps = [];
      for (
        let lat = Math.max(-89.5, south);
        lat <= Math.min(89.5, north);
        lat = +(lat + GRID_STEP).toFixed(6)
      ) {
        latSteps.push(lat);
      }
      const lngSteps = [];
      let normalizedWest = west;
      let normalizedEast = east;
      if (east < west) normalizedEast = east + 360;
      for (
        let lng = normalizedWest;
        lng <= normalizedEast;
        lng = +(lng + GRID_STEP).toFixed(6)
      ) {
        const normalizedLng = ((lng + 540) % 360) - 180;
        lngSteps.push(normalizedLng);
      }

      const points = [];
      for (const lat of latSteps) {
        for (const lng of lngSteps) {
          points.push({ lat, lng });
        }
      }

      const MAX_POINTS = 80;
      const chunked = points.slice(0, MAX_POINTS);

      const concurrency = 5;
      for (let i = 0; i < chunked.length; i += concurrency) {
        const batch = chunked.slice(i, i + concurrency);
        await Promise.all(
          batch.map(async (pt) => {
            try {
              const marineUrl = `https://api.open-meteo.com/v1/marine?latitude=${pt.lat}&longitude=${pt.lng}&current=wave_height&timezone=auto`;
              const marineRes = await fetch(marineUrl);
              if (!marineRes.ok) return;
              const marineJson = await marineRes.json();
              if (
                !marineJson?.current ||
                marineJson.current.wave_height == null
              ) {
                return;
              }

              const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lng}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
              const weatherRes = await fetch(weatherUrl);
              if (!weatherRes.ok) return;
              const weatherJson = await weatherRes.json();
              const w = weatherJson?.current || {};

              const wave_h = Number(marineJson.current.wave_height ?? 0);
              const wind_s = Number(w.wind_speed_10m ?? 0);
              const wind_g = Number(w.wind_gusts_10m ?? 0);
              const precip = Number(w.precipitation ?? 0);

              const isSevere =
                wave_h >= THRESHOLDS.wave_height_m ||
                wind_s >= THRESHOLDS.wind_speed_kmh ||
                wind_g >= THRESHOLDS.wind_gust_kmh ||
                precip >= THRESHOLDS.precipitation_mm_h;

              if (isSevere) {
                const summaryParts = [];
                if (wind_s >= THRESHOLDS.wind_speed_kmh)
                  summaryParts.push(`Wind ${Math.round(wind_s)} km/h`);
                if (wind_g >= THRESHOLDS.wind_gust_kmh)
                  summaryParts.push(`Gust ${Math.round(wind_g)} km/h`);
                if (wave_h >= THRESHOLDS.wave_height_m)
                  summaryParts.push(`Wave ${wave_h.toFixed(1)} m`);
                if (precip >= THRESHOLDS.precipitation_mm_h)
                  summaryParts.push(`Precip ${precip} mm`);
                const summary =
                  summaryParts.join(" • ") || "Strong marine conditions";

                addWarningMarker(pt.lat, pt.lng, summary, {
                  wind_speed: Math.round(wind_s),
                  wind_gust: Math.round(wind_g),
                  wave_height: wave_h,
                  precipitation: precip,
                });
              }
            } catch (err) {
              // ignore per-point errors
            }
          })
        );
      }
    };

    const initializeMap = () => {
      const L = window.L;
      if (!L) return console.error("Leaflet failed to load");

      const map = L.map("map").setView([8.0, 125.0], 6);
      mapRef.current = map;

      // Base tiles with dark theme
      L.tileLayer(
        "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>',
        }
      ).addTo(map);

      // Weather layers
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

      tempLayer.addTo(map);
      map.tempLayer = tempLayer;
      map.pressureLayer = pressureLayer;
      map.precipitationLayer = precipitationLayer;
      map.cloudsLayer = cloudsLayer;
      map.windLayer = windLayer;

      setMapLoaded(true);

      // Center on user if available
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const userIcon = L.divIcon({
            html: `<div class="user-location-marker"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map)
            .bindPopup(`
              <div class="p-3 bg-gradient-to-br from-blue-900/90 to-purple-900/70 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                <div class="text-white font-bold flex items-center gap-2">
                  <span>📍</span>
                  Your Location
                </div>
                <div class="text-blue-200 text-sm mt-1">
                  ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E
                </div>
              </div>
            `);
          map.setView([latitude, longitude], 7);
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click handler
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);
        setLoading(true);

        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
          const waveUrl = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height&timezone=auto`;

          const [weatherResponse, waveResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(waveUrl),
          ]);
          const weatherData = weatherResponse.ok
            ? await weatherResponse.json()
            : null;
          const waveData = waveResponse.ok ? await waveResponse.json() : null;

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
                61: "Slight rain",
                63: "Moderate rain",
                65: "Heavy rain",
                80: "Slight rain showers",
                81: "Moderate rain showers",
                82: "Violent rain showers",
                95: "Thunderstorm",
                96: "Thunderstorm with slight hail",
                99: "Thunderstorm with heavy hail",
              };
              return codes[code] || `Code: ${code}`;
            };

            let popupContent = createEnhancedPopup(
              weatherData,
              waveData,
              lat,
              lng,
              getWeatherDescription,
              degToCompass,
              formatValue
            );

            // Add rescue buttons to popup
            const customButtons = `
              <div class="mt-3 flex gap-2">
                <button class="custom-rescue-btn flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold border-none cursor-pointer transition-all hover:scale-105" data-lat="${lat}" data-lng="${lng}">
                  Custom Rescue
                </button>
                <button class="quick-rescue-btn flex-1 px-3 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold border-none cursor-pointer transition-all hover:scale-105" data-lat="${lat}" data-lng="${lng}">
                  Quick Rescue
                </button>
              </div>`;

            markerRef.current = window.L.marker([lat, lng], {
              icon: window.L.divIcon({
                html: `<div class="weather-marker">${
                  current.temperature_2m != null
                    ? Math.round(current.temperature_2m) + "°"
                    : "?"
                }</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
              }),
            })
              .addTo(map)
              .bindPopup(popupContent + customButtons, {
                maxWidth: 420,
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

      // Popup event handlers
      map.on("popupopen", function (e) {
        const container = e.popup && e.popup._contentNode;
        if (!container) return;

        const quick = container.querySelector(".quick-rescue-btn");
        if (quick) {
          quick.onclick = (ev) => {
            const lat = parseFloat(quick.dataset.lat);
            const lng = parseFloat(quick.dataset.lng);
            requestRescueAt(lat, lng, "Quick rescue (user clicked popup)");
          };
        }

        const customBtn = container.querySelector(".custom-rescue-btn");
        if (customBtn) {
          customBtn.onclick = () => {
            const lat = parseFloat(customBtn.dataset.lat);
            const lng = parseFloat(customBtn.dataset.lng);
            const reason = prompt(
              "Enter rescue reason (e.g. 'sinking', 'engine malfunction', 'medical emergency'):",
              "sinking"
            );
            if (reason) {
              requestRescueAt(lat, lng, reason);
            }
          };
        }

        const requestBtn = container.querySelector(".request-rescue-btn");
        if (requestBtn) {
          requestBtn.onclick = () => {
            const lat = parseFloat(requestBtn.dataset.lat);
            const lng = parseFloat(requestBtn.dataset.lng);
            requestRescueAt(lat, lng, "Storm area rescue request");
          };
        }

        const viewBtn = container.querySelector(".view-more-btn");
        if (viewBtn) {
          viewBtn.onclick = () => {
            const lat = parseFloat(viewBtn.dataset.lat);
            const lng = parseFloat(viewBtn.dataset.lng);
            map.setView([lat, lng], Math.max(map.getZoom(), 9));
          };
        }
      });

      // Initial scan and movement handlers
      setTimeout(() => {
        scanStormsInBounds();
      }, 1200);

      map.on("moveend", () => {
        clearWarningMarkers();
        scanStormsInBounds();
      });
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {}
      }
    };
  }, []);

  // Layer toggle function
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

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/alerts");
        const data = await res.json();
        setAlerts(data);
      } catch (err) {
        console.error("Error fetching alerts", err);
      }
    };
    fetchAlerts();

    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
      {/* Map */}
      <div id="map" className="absolute inset-0 z-0" />

      <MarineVisualizer lat={selectedLat} lng={selectedLng} />

      {/* Alerts Panel */}
      <div className="fixed bottom-4 right-4 z-[1000] w-80">
        <div className="p-4 border bg-gradient-to-br from-red-900/40 to-orange-900/20 rounded-2xl border-red-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <span>⚠️</span>
              Marine Alerts
            </h3>
            <div className="px-3 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
              {alerts.length} Active
            </div>
          </div>
          <div className="space-y-2 overflow-y-auto max-h-64">
            {alerts.length === 0 ? (
              <div className="py-4 text-center">
                <div className="mb-2 text-sm text-gray-300">
                  No active alerts
                </div>
                <div className="text-xs text-gray-500">
                  Storm warnings and safety notices will appear here
                </div>
              </div>
            ) : (
              alerts.map((a) => (
                <div
                  key={a.id}
                  className="p-3 border rounded-lg bg-white/5 border-red-500/10"
                >
                  <div className="text-sm text-white">{a.message}</div>
                  <div className="mt-1 text-xs text-red-300">{a.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="fixed top-5 right-5 z-1000 w-80">
        <div className="p-4 border bg-gradient-to-br from-blue-900/40 to-purple-900/20 rounded-2xl border-blue-500/20 backdrop-blur-sm">
          <div className="space-y-3">
            <button
              onClick={() =>
                toggleLayer("tempLayer", showTemperature, setShowTemperature)
              }
              className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 border backdrop-blur-sm ${
                showTemperature
                  ? "bg-gradient-to-br from-red-500/80 to-red-600/80 border-red-500/30 hover:border-red-500/60"
                  : "bg-gray-600/50 border-gray-500/30 hover:border-gray-500/60"
              }`}
            >
              🌡️ Temperature {showTemperature ? "ON" : "OFF"}
            </button>

            <button
              onClick={() =>
                toggleLayer("pressureLayer", showPressure, setShowPressure)
              }
              className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 border backdrop-blur-sm ${
                showPressure
                  ? "bg-gradient-to-br from-purple-500/80 to-purple-600/80 border-purple-500/30 hover:border-purple-500/60"
                  : "bg-gray-600/50 border-gray-500/30 hover:border-gray-500/60"
              }`}
            >
              📊 Pressure {showPressure ? "ON" : "OFF"}
            </button>

            <button
              onClick={() =>
                toggleLayer("precipitationLayer", showStorm, setShowStorm)
              }
              className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 border backdrop-blur-sm ${
                showStorm
                  ? "bg-gradient-to-br from-indigo-500/80 to-blue-600/80 border-blue-500/30 hover:border-blue-500/60"
                  : "bg-gray-600/50 border-gray-500/30 hover:border-gray-500/60"
              }`}
            >
              ⛈️ Storm Layers {showStorm ? "ON" : "OFF"}
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full px-4 py-3 font-semibold text-white transition-all duration-200 border rounded-xl bg-gradient-to-br from-blue-500/80 to-blue-600/80 border-blue-500/30 backdrop-blur-sm hover:border-blue-500/60 hover:scale-105"
            >
              ← Account Logout
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex items-center gap-4 p-6 border bg-blue-900/90 border-blue-500/50 rounded-2xl backdrop-blur-sm">
            <div className="w-8 h-8 border-b-2 border-white rounded-full animate-spin"></div>
            <div className="text-lg text-white">Loading Weather Details...</div>
          </div>
        </div>
      )}

      {/* Rescue Confirmation Modal */}
      {showRescueConfirm && rescuePendingLocation && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-lg p-7 border-4 border-red-500 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-[0_24px_80px_rgba(239,68,68,0.25)]">
            <div className="mb-4 text-center">
              <div className="mb-2 text-6xl">🆘</div>
              <h2 className="mb-1 text-lg font-bold text-white">
                CONFIRM EMERGENCY RESCUE
              </h2>
              <p className="text-sm text-gray-400">
                Auto-sending in {rescueCountdown} second
                {rescueCountdown !== 1 ? "s" : ""}...
              </p>
            </div>

            <div className="p-3 mb-4 text-white rounded-lg bg-white/5">
              <p className="mb-1">
                <strong>📍 Location:</strong>{" "}
                {rescuePendingLocation.lat.toFixed(4)},{" "}
                {rescuePendingLocation.lng.toFixed(4)}
              </p>
              <p className="text-xs text-gray-300">
                Reason:{" "}
                <strong className="text-white">{rescuePendingReason}</strong>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => confirmRescue(null, null)}
                className="flex-1 py-3 font-bold text-white transition-all duration-200 rounded-lg bg-gradient-to-br from-red-500 to-red-600 hover:scale-105"
              >
                SEND NOW
              </button>
              <button
                onClick={cancelRescue}
                className="flex-1 py-3 font-bold text-white transition-all duration-200 bg-gray-600 rounded-lg hover:scale-105"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
