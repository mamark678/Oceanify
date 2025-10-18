// src/pages/User/UserPage.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { createEnhancedPopup } from "../../components/PopupContent";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";

export default function UserPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const warningMarkersRef = useRef([]); // store storm warning markers
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const navigate = useNavigate();
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);

  // Rescue button states (confirmation modal driven)
  const [showRescueConfirm, setShowRescueConfirm] = useState(false);
  const [rescueCountdown, setRescueCountdown] = useState(10);
  const [rescuePendingLocation, setRescuePendingLocation] = useState(null);
  const [rescuePendingReason, setRescuePendingReason] = useState(null);
  const [rescueActive, setRescueActive] = useState(false);

  // CONFIG: thresholds & grid step (tweak as needed)
  const GRID_STEP = 0.5; // degrees spacing for scanning grid (coarser = fewer API calls)
  const THRESHOLDS = {
    wind_speed_kmh: 50, // strong wind threshold (km/h)
    wind_gust_kmh: 70, // gust threshold
    precipitation_mm_h: 15, // heavy precipitation threshold (mm/hr)
    wave_height_m: 2.5, // high wave (meters)
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

  // Open confirmation modal with countdown for a given location + reason
  const requestRescueAt = (lat, lng, reason = "Unknown") => {
    setRescuePendingLocation({ lat, lng });
    setRescuePendingReason(reason);
    setRescueCountdown(10);
    setShowRescueConfirm(true);
  };

  // Confirm & send rescue (attempt backend, fallback to local storage)
  const confirmRescue = async (overrideLocation = null, overrideReason = null) => {
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
      // Fetch environmental data (Open-Meteo)
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

      // Try sending to backend (non-blocking; fallback to local)
      let backendOk = false;
      try {
        const resp = await fetch("/api/emergency", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emergencyData),
        });
        if (resp.ok) backendOk = true;
      } catch (err) {
        console.warn("Backend unreachable or not configured. Falling back to local log.", err);
      }

      // place SOS marker on map
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
            `<b style="color:#ef4444">EMERGENCY</b><br/>Reason: ${reason}<br/>${new Date().toLocaleString()}`
          )
          .openPopup();
      }

      // Save locally
      try {
        const logs = JSON.parse(localStorage.getItem("rescueLogs") || "[]");
        logs.unshift({ ...emergencyData, persistedAt: new Date().toISOString(), backendOk });
        localStorage.setItem("rescueLogs", JSON.stringify(logs));
      } catch (err) {
        console.warn("Failed to persist rescue log", err);
      }

      console.log("Rescue event logged:", { ...emergencyData, backendOk });
      alert("🆘 Rescue request recorded. Admin has been notified (or saved locally).");

      // reset active after short period
      setTimeout(() => setRescueActive(false), 10000);
    } catch (err) {
      console.error("confirmRescue error:", err);
      alert("Failed to send rescue request — saved locally.");
      setRescueActive(false);
      // fallback log
      try {
        const logs = JSON.parse(localStorage.getItem("rescueLogs") || "[]");
        logs.unshift({
          timestamp: new Date().toISOString(),
          latitude: loc.lat,
          longitude: loc.lng,
          reason,
          backendOk: false,
          error: err.message,
        });
        localStorage.setItem("rescueLogs", JSON.stringify(logs));
      } catch (e) {
        console.warn("Failed to local-log rescue error", e);
      }
    }
  };

  // Cancel rescue flow
  const cancelRescue = () => {
    setShowRescueConfirm(false);
    setRescueCountdown(10);
    setRescuePendingLocation(null);
    setRescuePendingReason(null);
  };

  // countdown effect
  useEffect(() => {
    if (showRescueConfirm && rescueCountdown > 0) {
      const t = setTimeout(() => setRescueCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (showRescueConfirm && rescueCountdown === 0) {
      confirmRescue();
    }
  }, [showRescueConfirm, rescueCountdown]); // eslint-disable-line

  /* -----------------------
     Map init + storm scanning
     ----------------------- */

  useEffect(() => {
    const API_KEY = "60b8ffcce91b8ebdc127d1219e56e0f5"; // if you use OpenWeather tiles; not required for Open-Meteo

    const loadLeaflet = async () => {
      try {
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
          script.onload = initializeMap;
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (err) {
        console.error("Failed to load Leaflet", err);
      }
    };

    // helper: remove existing warning markers
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

    // evaluate conditions and add warning marker
    const addWarningMarker = (lat, lng, summary, details = {}) => {
      if (!mapRef.current || !window.L) return;
      const L = window.L;

      // small circular marker with pulsing style
      const marker = L.circleMarker([lat, lng], {
        radius: 12,
        color: "#ff8c00",
        fillColor: "#ffb86b",
        fillOpacity: 0.7,
        weight: 2,
      }).addTo(mapRef.current);

      // popup HTML includes a button (we will attach listeners on popupopen)
      const popupId = `popup-storm-${lat.toFixed(3)}-${lng.toFixed(3)}-${Date.now()}`;
      const popupHtml = `
        <div style="min-width:220px">
          <h3 style="margin:0 0 6px 0">⚠️ Strong storm area</h3>
          <div style="font-size:13px;color:#374151;margin-bottom:8px">
            ${summary}
          </div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:10px">
            <b>Wind:</b> ${details.wind_speed ?? 'N/A'} km/h
            &nbsp; <b>Gust:</b> ${details.wind_gust ?? 'N/A'} km/h<br/>
            <b>Wave:</b> ${details.wave_height ?? 'N/A'} m
            &nbsp; <b>Precip:</b> ${details.precipitation ?? 'N/A'} mm
          </div>
          <div style="display:flex;gap:6px">
            <button class="request-rescue-btn" data-lat="${lat}" data-lng="${lng}" style="flex:1;padding:8px;border-radius:8px;border:none;background:#ef4444;color:white;font-weight:600;cursor:pointer">Request Rescue</button>
            <button class="view-more-btn" data-lat="${lat}" data-lng="${lng}" style="flex:1;padding:8px;border-radius:8px;border:none;background:#1f2937;color:white;cursor:pointer">Details</button>
          </div>
        </div>
      `;

      warningMarkersRef.current.push(marker);
    };

    // Scan bounds grid -> check marine + weather, then flag storm points
    const scanStormsInBounds = async () => {
      if (!mapRef.current || !window.L) return;
      const map = mapRef.current;
      clearWarningMarkers();

      const bounds = map.getBounds();
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const east = bounds.getEast();

      // grid generation
      const latSteps = [];
      for (let lat = Math.max(-89.5, south); lat <= Math.min(89.5, north); lat = +(lat + GRID_STEP).toFixed(6)) {
        latSteps.push(lat);
      }
      const lngSteps = [];
      // normalize longitudes crossing dateline
      let normalizedWest = west;
      let normalizedEast = east;
      if (east < west) normalizedEast = east + 360; // cross-dateline
      for (let lng = normalizedWest; lng <= normalizedEast; lng = +((lng + GRID_STEP).toFixed(6))) {
        const normalizedLng = (lng + 540) % 360 - 180; // bring back to [-180,180]
        lngSteps.push(normalizedLng);
      }

      // collect point list
      const points = [];
      for (const lat of latSteps) {
        for (const lng of lngSteps) {
          points.push({ lat, lng });
        }
      }

      // limit total points scanned to reasonable count
      const MAX_POINTS = 80;
      const chunked = points.slice(0, MAX_POINTS);

      // concurrently process points in small batches to avoid huge parallel requests
      const concurrency = 5;
      for (let i = 0; i < chunked.length; i += concurrency) {
        const batch = chunked.slice(i, i + concurrency);
        await Promise.all(
          batch.map(async (pt) => {
            try {
              // marine endpoint - if marine.current is null => likely land or unsupported -> skip
              const marineUrl = `https://api.open-meteo.com/v1/marine?latitude=${pt.lat}&longitude=${pt.lng}&current=wave_height&timezone=auto`;
              const marineRes = await fetch(marineUrl);
              if (!marineRes.ok) return;
              const marineJson = await marineRes.json();
              if (!marineJson?.current || marineJson.current.wave_height == null) {
                // no marine data -> probably land -> skip
                return;
              }

              // weather endpoint for wind/precip
              const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${pt.lat}&longitude=${pt.lng}&current=wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
              const weatherRes = await fetch(weatherUrl);
              if (!weatherRes.ok) return;
              const weatherJson = await weatherRes.json();
              const w = weatherJson?.current || {};

              // check thresholds
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
                if (wind_s >= THRESHOLDS.wind_speed_kmh) summaryParts.push(`Wind ${Math.round(wind_s)} km/h`);
                if (wind_g >= THRESHOLDS.wind_gust_kmh) summaryParts.push(`Gust ${Math.round(wind_g)} km/h`);
                if (wave_h >= THRESHOLDS.wave_height_m) summaryParts.push(`Wave ${wave_h.toFixed(1)} m`);
                if (precip >= THRESHOLDS.precipitation_mm_h) summaryParts.push(`Precip ${precip} mm`);
                const summary = summaryParts.join(" • ") || "Strong marine conditions";

                addWarningMarker(pt.lat, pt.lng, summary, {
                  wind_speed: Math.round(wind_s),
                  wind_gust: Math.round(wind_g),
                  wave_height: wave_h,
                  precipitation: precip,
                });
              }
            } catch (err) {
              // ignore per-point errors
              // console.warn("scan point failed", pt, err);
            }
          })
        );
      }
    }; // scanStormsInBounds

    const initializeMap = () => {
      const L = window.L;
      if (!L) return console.error("Leaflet failed to load");

      const map = L.map("map").setView([8.0, 125.0], 6);
      mapRef.current = map;

      // Base tiles (dark baseline like you had)
      L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>',
      }).addTo(map);

      // OpenWeatherMap layers (if you keep them)
      const tempLayer = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 0.6 });
      const pressureLayer = L.tileLayer(`https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 0.6 });
      const precipitationLayer = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 0.6 });
      const cloudsLayer = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 0.6 });
      const windLayer = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${API_KEY}`, { opacity: 0.6 });

      tempLayer.addTo(map);
      map.tempLayer = tempLayer;
      map.pressureLayer = pressureLayer;
      map.precipitationLayer = precipitationLayer;
      map.cloudsLayer = cloudsLayer;
      map.windLayer = windLayer;

      setMapLoaded(true);

      // center on user if available
      navigator.geolocation.getCurrentPosition(
        ({ coords: { latitude, longitude } }) => {
          const userIcon = L.divIcon({
            html: `<div style="background-color: #007bff; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          L.marker([latitude, longitude], { icon: userIcon }).addTo(map).bindPopup("📍 Your Location");
          map.setView([latitude, longitude], 7);
        },
        (err) => console.warn("Geolocation error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      // Map click -> existing behaviour (show weather popup), but also allow custom rescue (button in popup)
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLat(lat);
        setSelectedLng(lng);
        setLoading(true);

        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
          const waveUrl = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height&timezone=auto`;

          const [weatherResponse, waveResponse] = await Promise.all([fetch(weatherUrl), fetch(waveUrl)]);
          const weatherData = weatherResponse.ok ? await weatherResponse.json() : null;
          const waveData = waveResponse.ok ? await waveResponse.json() : null;

          // remove previous marker
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

            // enhanced popup from your helper plus custom-rescue button
            // Make sure popupContent is a string
            let popupContent = createEnhancedPopup(
              weatherData,
              waveData,
              lat,
              lng,
              getWeatherDescription,
              degToCompass,
              formatValue
            );


            // add custom-rescue UI to bottom of popup
            const customButtons = `
              <div style="margin-top:8px;display:flex;gap:8px">
                <button class="custom-rescue-btn" data-lat="${lat}" data-lng="${lng}" style="flex:1;padding:8px;border-radius:8px;border:none;background:#ef4444;color:white;font-weight:600;cursor:pointer">Custom Rescue</button>
                <button class="quick-rescue-btn" data-lat="${lat}" data-lng="${lng}" style="flex:1;padding:8px;border-radius:8px;border:none;background:#0ea5e9;color:white;font-weight:600;cursor:pointer">Rescue (quick)</button>
              </div>`;

            markerRef.current = window.L
              .marker([lat, lng], {
                icon: window.L.divIcon({
                  html: `<div style="background: linear-gradient(135deg,#ff6b6b,#ee5a52); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white;">${current.temperature_2m != null ? Math.round(current.temperature_2m) + "°" : "?"}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                }),
              })
              .addTo(map)
              .bindPopup(popupContent + customButtons, { maxWidth: 420, className: "weather-popup" })
              .openPopup();
          }
        } catch (err) {
          console.warn("Weather fetch failed", err);
        } finally {
          setLoading(false);
        }
      }); // map click end

      // When any popup opens, attach listeners to buttons inside popup HTML
      map.on("popupopen", function (e) {
        const container = e.popup && e.popup._contentNode;
        if (!container) return;

        // Quick rescue: immediate requestRescueAt with default reason and direct confirmation flow
        const quick = container.querySelector(".quick-rescue-btn");
        if (quick) {
          quick.onclick = (ev) => {
            const lat = parseFloat(quick.dataset.lat);
            const lng = parseFloat(quick.dataset.lng);
            // open confirm modal (use requestRescueAt)
            requestRescueAt(lat, lng, "Quick rescue (user clicked popup)");
          };
        }

        // Custom rescue: opens a small prompt to pick reason (or you could show a modal)
        const customBtn = container.querySelector(".custom-rescue-btn");
        if (customBtn) {
          customBtn.onclick = () => {
            const lat = parseFloat(customBtn.dataset.lat);
            const lng = parseFloat(customBtn.dataset.lng);
            // show a prompt for reason (simple). You can replace with a nicer modal
            const reason = prompt(
              "Enter rescue reason (e.g. 'sinking', 'engine malfunction', 'medical emergency'):",
              "sinking"
            );
            if (reason) {
              requestRescueAt(lat, lng, reason);
            }
          };
        }

        // Buttons inside storm warning popups
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
            // zoom to area for review
            const lat = parseFloat(viewBtn.dataset.lat);
            const lng = parseFloat(viewBtn.dataset.lng);
            map.setView([lat, lng], Math.max(map.getZoom(), 9));
          };
        }
      });

      // Run initial scan after small delay to let map settle
      setTimeout(() => {
        scanStormsInBounds();
      }, 1200);

      // Re-scan on moveend (when user pans/zooms)
      map.on("moveend", () => {
        // simple debounce pattern: clear old markers then rescan
        clearWarningMarkers();
        scanStormsInBounds();
      });
    }; // initializeMap

    loadLeaflet();

    // cleanup on unmount
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {}
      }
    };
  }, []); // run once

  // Layer toggle helpers (unchanged)
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
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000 }}>
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
          onClick={() => toggleLayer("tempLayer", showTemperature, setShowTemperature)}
          style={{
            ...buttonStyle(),
            background: showTemperature ? "linear-gradient(135deg,#ff6b6b,#ee5a52)" : "linear-gradient(135deg,#95a5a6,#7f8c8d)",
          }}
        >
          Temperature {showTemperature ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => toggleLayer("pressureLayer", showPressure, setShowPressure)}
          style={{
            ...buttonStyle(),
            background: showPressure ? "linear-gradient(135deg,#9b59b6,#8e44ad)" : "linear-gradient(135deg,#95a5a6,#7f8c8d)",
          }}
        >
          Pressure {showPressure ? "ON" : "OFF"}
        </button>
        <button
          onClick={() => toggleLayer("precipitationLayer", showStorm, setShowStorm)}
          style={{
            ...buttonStyle(),
            background: showStorm ? "linear-gradient(135deg,#6366f1,#0ea5e9)" : "linear-gradient(135deg,#95a5a6,#7f8c8d)",
          }}
        >
          Storm Layers {showStorm ? "ON" : "OFF"}
        </button>
        <button onClick={() => navigate("/account-management-page")} style={{ ...buttonStyle(), background: "linear-gradient(135deg,#3b82f6,#2563eb)" }}>
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
          />
          Loading Weather Details...
        </div>
      )}

      {/* Rescue Confirmation Modal */}
      {showRescueConfirm && rescuePendingLocation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.85)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a, #111827)",
              padding: "28px",
              borderRadius: "18px",
              maxWidth: "520px",
              width: "100%",
              border: "3px solid #ef4444",
              boxShadow: "0 24px 80px rgba(239,68,68,0.25)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "56px", marginBottom: "8px" }}>🆘</div>
              <h2 style={{ color: "white", fontSize: "22px", marginBottom: "6px" }}>CONFIRM EMERGENCY RESCUE</h2>
              <p style={{ color: "#94a3b8", fontSize: "14px" }}>
                Auto-sending in {rescueCountdown} second{rescueCountdown !== 1 ? "s" : ""}...
              </p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "12px", marginBottom: "18px", color: "white" }}>
              <p style={{ marginBottom: "6px" }}>
                <strong>📍 Location:</strong> {rescuePendingLocation.lat.toFixed(4)}, {rescuePendingLocation.lng.toFixed(4)}
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1" }}>
                Reason: <strong style={{ color: "#fff" }}>{rescuePendingReason}</strong>
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => confirmRescue(null, null)} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                SEND NOW
              </button>
              <button onClick={cancelRescue} style={{ flex: 1, padding: "14px", background: "linear-gradient(135deg,#64748b,#475569)", color: "white", border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: "700", cursor: "pointer" }}>
                CANCEL
              </button>
            </div>
          </div>
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

        .sos-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ff7b7b, #ef4444 40%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          border: 4px solid white;
          box-shadow: 0 0 18px #ef4444;
          animation: pulse 1.5s infinite ease-in-out;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 12px #ef4444;
          }
          50% {
            transform: scale(1.12);
            box-shadow: 0 0 28px #ef4444;
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 12px #ef4444;
          }
        }

        .storm-popup {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }
      `}</style>
    </div>
  );
}
