// React core hooks
import { useEffect, useRef, useState } from "react";
// Router
import { useNavigate } from "react-router";
// Components
import Navbar from "../../components/Navbar";
import { createEnhancedPopup } from "../../components/PopupContent";
import MarineVisualizer from "../../marineVisualizer/MarineVisualizer";
// Ports data
import mindanaoPorts from "../../data/ports.json";

export default function UserPage() {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const portMarkersRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTemperature, setShowTemperature] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [showStorm, setShowStorm] = useState(false);
  const [showPorts, setShowPorts] = useState(true);
  const navigate = useNavigate();
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);
  const [loadingType, setLoadingType] = useState(null); // 'weather' or 'waves'
  const [clickedLocation, setClickedLocation] = useState(null); // Store clicked location for data type selection

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

  // Get port icon based on port type
  const getPortIcon = (portType) => {
    const L = window.L;
    if (!L) return null;

    const getIconColor = (type) => {
      switch (type) {
        case "International Container Port":
        case "International Port":
          return "#e74c3c"; // Red for major ports
        case "Base Port":
          return "#3498db"; // Blue for base ports
        case "Container Terminal":
          return "#9b59b6"; // Purple for terminals
        case "Terminal Port":
          return "#f39c12"; // Orange for terminal ports
        case "Municipal Port":
          return "#2ecc71"; // Green for municipal ports
        case "Private Port":
          return "#95a5a6"; // Gray for private ports
        default:
          return "#34495e"; // Dark blue for others
      }
    };

    const getPortEmoji = (type) => {
      switch (type) {
        case "International Container Port":
        case "International Port":
          return "⚓";
        case "Base Port":
          return "🏭";
        case "Container Terminal":
          return "🚢";
        case "Terminal Port":
          return "⛴️";
        case "Municipal Port":
          return "🏘️";
        case "Private Port":
          return "🔒";
        default:
          return "📍";
      }
    };

    return L.divIcon({
      html: `
        <div style="
          background: ${getIconColor(portType)};
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: bold;
          border: 3px solid white;
          box-shadow: 0 3px 10px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${getPortEmoji(portType)}
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
      className: "port-marker",
    });
  };

  // Create wave data popup content
  const createWavePopup = (
    waveData,
    lat,
    lng,
    locationName = "Selected Location"
  ) => {
    const formatValue = (value, unit = "", decimals = 1) => {
      if (value === null || value === undefined) return "N/A";
      if (typeof value === "number") {
        return decimals === 0
          ? `${Math.round(value)}${unit}`
          : `${value.toFixed(decimals)}${unit}`;
      }
      return `${value}${unit}`;
    };

    console.log("Wave Data for popup:", waveData); // Debug log

    return `
      <div style="min-width: 280px; padding: 12px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h3 style="margin: 0 0 4px 0; color: #2c3e50; font-size: 18px; font-weight: bold;">
            🌊 Wave Conditions
          </h3>
          <div style="color: #7f8c8d; font-size: 12px;">
            ${locationName}
          </div>
          <div style="color: #95a5a6; font-size: 11px; margin-top: 4px;">
            ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #74b9ff, #0984e3); padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 24px; font-weight: bold; color: white;">
                ${formatValue(waveData?.current?.wave_height, " m", 1)}
              </div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.9);">Wave Height</div>
            </div>
            <div style="font-size: 32px;">🌊</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
          <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Wave Direction</div>
            <div style="font-size: 14px; font-weight: bold; color: #2c3e50;">
              ${degToCompass(waveData?.current?.wave_direction)}
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 8px; border-radius: 6px; text-align: center;">
            <div style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Swell Height</div>
            <div style="font-size: 14px; font-weight: bold; color: #2c3e50;">
              ${formatValue(waveData?.current?.swell_wave_height, " m", 1)}
            </div>
          </div>
        </div>

        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
          <div style="font-size: 12px; font-weight: bold; color: #2c3e50; margin-bottom: 8px;">Swell Details</div>
          <div style="display: grid; gap: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #7f8c8d;">Primary Direction:</span>
              <span style="font-weight: bold; color: #2c3e50;">${degToCompass(
                waveData?.current?.swell_wave_direction
              )}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #7f8c8d;">Secondary Height:</span>
              <span style="font-weight: bold; color: #2c3e50;">${formatValue(
                waveData?.current?.secondary_swell_wave_height,
                " m",
                1
              )}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px;">
              <span style="color: #7f8c8d;">Secondary Period:</span>
              <span style="font-weight: bold; color: #2c3e50;">${formatValue(
                waveData?.current?.secondary_swell_wave_period,
                "s",
                1
              )}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 8px;">
          <button 
            onclick="window.viewWeatherData(${lat}, ${lng}, '${locationName.replace(
      /'/g,
      "\\'"
    )}')"
            style="
              flex: 1;
              padding: 8px 12px;
              background: linear-gradient(135deg, #ff6b6b, #ee5a52);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 600;
            "
          >
            View Weather
          </button>
          <button 
            onclick="window.closePopup()"
            style="
              padding: 8px 12px;
              background: #95a5a6;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 11px;
              font-weight: 600;
            "
          >
            Close
          </button>
        </div>
      </div>
    `;
  };

  // Create data type selection popup
  const createDataTypeSelectionPopup = (lat, lng) => {
    return `
      <div style="min-width: 260px; padding: 16px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 18px; font-weight: bold;">
            📍 Location Pinned
          </h3>
          <div style="color: #7f8c8d; font-size: 12px;">
            ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E
          </div>
          <div style="color: #95a5a6; font-size: 11px; margin-top: 8px;">
            Choose data to display:
          </div>
        </div>
        
        <div style="display: grid; gap: 10px;">
          <button 
            onclick="window.selectDataType(${lat}, ${lng}, 'weather')"
            style="
              padding: 12px 16px;
              background: linear-gradient(135deg, #ff6b6b, #ee5a52);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            "
            onmouseover="this.style.transform='scale(1.02)'"
            onmouseout="this.style.transform='scale(1)'"
          >
            🌤️ Weather Conditions
          </button>
          
          <button 
            onclick="window.selectDataType(${lat}, ${lng}, 'waves')"
            style="
              padding: 12px 16px;
              background: linear-gradient(135deg, #74b9ff, #0984e3);
              color: white;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
            "
            onmouseover="this.style.transform='scale(1.02)'"
            onmouseout="this.style.transform='scale(1)'"
          >
            🌊 Wave Conditions
          </button>
          
          <button 
            onclick="window.closeSelectionPopup()"
            style="
              padding: 10px 16px;
              background: #95a5a6;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 600;
              transition: all 0.2s ease;
            "
            onmouseover="this.style.background='#7f8c8d'"
            onmouseout="this.style.background='#95a5a6'"
          >
            Cancel
          </button>
        </div>
      </div>
    `;
  };

  // Fetch and display data for location
  const fetchLocationData = async (lat, lng, locationName, dataType) => {
    setSelectedLat(lat);
    setSelectedLng(lng);
    setLoading(true);
    setLoadingType(dataType);

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto&wind_speed_unit=kmh&precipitation_unit=mm`;
      const waveUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&current=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period&timezone=auto`;

      console.log(`Fetching ${dataType} data for:`, lat, lng); // Debug log

      const [weatherResponse, waveResponse] = await Promise.all([
        fetch(weatherUrl),
        fetch(waveUrl),
      ]);

      const weatherData = weatherResponse.ok
        ? await weatherResponse.json()
        : null;
      const waveData = waveResponse.ok ? await waveResponse.json() : null;

      console.log("Weather Data:", weatherData); // Debug log
      console.log("Wave Data:", waveData); // Debug log

      // Remove previous marker
      if (markerRef.current && mapRef.current.hasLayer(markerRef.current)) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      const L = window.L;
      if (!L) return;

      if (dataType === "weather" && weatherData?.current) {
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
            weatherData.current.temperature_2m != null
              ? Math.round(weatherData.current.temperature_2m) + "°"
              : "?"
          }</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        markerRef.current = L.marker([lat, lng], { icon: weatherIcon })
          .addTo(mapRef.current)
          .bindPopup(popupContent, {
            maxWidth: 400,
            className: "weather-popup",
          })
          .openPopup();
      } else if (dataType === "waves") {
        console.log("Creating wave popup with data:", waveData); // Debug log

        if (waveData?.current) {
          const wavePopupContent = createWavePopup(
            waveData,
            lat,
            lng,
            locationName
          );

          const waveIcon = L.divIcon({
            html: `<div style="background: linear-gradient(135deg, #74b9ff, #0984e3); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">${
              waveData.current.wave_height != null
                ? waveData.current.wave_height.toFixed(1) + "m"
                : "🌊"
            }</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });

          markerRef.current = L.marker([lat, lng], { icon: waveIcon })
            .addTo(mapRef.current)
            .bindPopup(wavePopupContent, {
              maxWidth: 320,
              className: "wave-popup",
            })
            .openPopup();

          console.log("Wave popup created and opened"); // Debug log
        } else {
          // Fallback if wave data is not available
          const errorPopupContent = `
            <div style="min-width: 250px; padding: 16px; text-align: center;">
              <h3 style="color: #e74c3c; margin-bottom: 12px;">🌊 Wave Data Unavailable</h3>
              <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 16px;">
                Unable to fetch wave data for this location.
              </p>
              <button 
                onclick="window.viewWeatherData(${lat}, ${lng}, '${locationName.replace(
            /'/g,
            "\\'"
          )}')"
                style="
                  padding: 8px 16px;
                  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                  color: white;
                  border: none;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 12px;
                "
              >
                Try Weather Data Instead
              </button>
            </div>
          `;

          const errorIcon = L.divIcon({
            html: `<div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">❌</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });

          markerRef.current = L.marker([lat, lng], { icon: errorIcon })
            .addTo(mapRef.current)
            .bindPopup(errorPopupContent, {
              maxWidth: 300,
              className: "error-popup",
            })
            .openPopup();
        }
      }

      // Center map on selected location
      mapRef.current.setView([lat, lng], 10);
    } catch (err) {
      console.error(`Data fetch failed for location:`, err);

      // Show error popup
      const L = window.L;
      if (L && mapRef.current) {
        const errorPopupContent = `
          <div style="min-width: 250px; padding: 16px; text-align: center;">
            <h3 style="color: #e74c3c; margin-bottom: 12px;">⚠️ Data Load Failed</h3>
            <p style="color: #7f8c8d; font-size: 14px;">
              Failed to load ${dataType} data. Please try again.
            </p>
          </div>
        `;

        const errorIcon = L.divIcon({
          html: `<div style="background: linear-gradient(135deg, #e74c3c, #c0392b); color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; border:3px solid white; box-shadow:0 3px 10px rgba(0,0,0,0.3);">❌</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        if (markerRef.current && mapRef.current.hasLayer(markerRef.current)) {
          mapRef.current.removeLayer(markerRef.current);
        }

        markerRef.current = L.marker([lat, lng], { icon: errorIcon })
          .addTo(mapRef.current)
          .bindPopup(errorPopupContent, {
            maxWidth: 300,
          })
          .openPopup();
      }
    } finally {
      setLoading(false);
      setLoadingType(null);
      setClickedLocation(null);
    }
  };

  // Add port markers to map
  const addPortMarkers = (map) => {
    const L = window.L;
    if (!L || !mindanaoPorts?.ports_of_mindanao) return;

    // Clear existing port markers
    removePortMarkers();

    mindanaoPorts.ports_of_mindanao.forEach((port) => {
      const icon = getPortIcon(port.type);
      if (!icon) return;

      const marker = L.marker([port.latitude, port.longitude], { icon }).addTo(
        map
      ).bindPopup(`
          <div style="min-width: 260px; padding: 12px;">
            <h3 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 16px; font-weight: bold;">
              ${port.port_name}
            </h3>
            <div style="color: #7f8c8d; font-size: 12px; margin-bottom: 8px;">
              📍 ${port.location}
            </div>
            <div style="color: #34495e; font-size: 12px; margin-bottom: 12px;">
              🏷️ Type: ${port.type}
            </div>
            <div style="color: #7f8c8d; font-size: 11px; margin-bottom: 16px;">
              Coordinates: ${port.latitude.toFixed(
                4
              )}°N, ${port.longitude.toFixed(4)}°E
            </div>
            
            <div style="display: grid; gap: 8px;">
              <button 
                onclick="window.viewWeatherData(${port.latitude}, ${
        port.longitude
      }, '${port.port_name.replace(/'/g, "\\'")}')"
                style="
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🌤️ View Weather Data
              </button>
              
              <button 
                onclick="window.viewWaveData(${port.latitude}, ${
        port.longitude
      }, '${port.port_name.replace(/'/g, "\\'")}')"
                style="
                  padding: 10px 16px;
                  background: linear-gradient(135deg, #74b9ff, #0984e3);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.2s ease;
                "
                onmouseover="this.style.transform='scale(1.02)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                🌊 View Wave Data
              </button>
            </div>
          </div>
        `);

      portMarkersRef.current.push(marker);
    });

    // Add global functions for data selection
    window.viewWeatherData = async (lat, lng, locationName) => {
      await fetchLocationData(lat, lng, locationName, "weather");
    };

    window.viewWaveData = async (lat, lng, locationName) => {
      await fetchLocationData(lat, lng, locationName, "waves");
    };

    window.selectDataType = async (lat, lng, dataType) => {
      await fetchLocationData(lat, lng, "Selected Location", dataType);
    };

    window.closePopup = () => {
      if (markerRef.current) {
        markerRef.current.closePopup();
      }
    };

    window.closeSelectionPopup = () => {
      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  };

  // Remove port markers from map
  const removePortMarkers = () => {
    const L = window.L;
    if (!L || !mapRef.current) return;

    portMarkersRef.current.forEach((marker) => {
      if (mapRef.current.hasLayer(marker)) {
        mapRef.current.removeLayer(marker);
      }
    });
    portMarkersRef.current = [];
  };

  // Toggle port markers visibility
  const togglePortMarkers = () => {
    if (!mapRef.current || !mapLoaded) return;

    if (showPorts) {
      removePortMarkers();
      setShowPorts(false);
    } else {
      addPortMarkers(mapRef.current);
      setShowPorts(true);
    }
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

    const initializeMap = () => {
      const L = window.L;
      if (!L) return console.error("Leaflet failed to load");

      const map = L.map("map").setView([8.0, 125.0], 6);
      mapRef.current = map;

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

      // Add port markers
      addPortMarkers(map);

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

      // Map click handler: Show data type selection
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setClickedLocation({ lat, lng });

        // Remove previous marker
        if (markerRef.current && map.hasLayer(markerRef.current)) {
          map.removeLayer(markerRef.current);
          markerRef.current = null;
        }

        const L = window.L;
        if (!L) return;

        // Create temporary marker for selection
        const tempIcon = L.divIcon({
          html: `<div style="background: linear-gradient(135deg, #27ae60, #229954); color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:bold; border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });

        markerRef.current = L.marker([lat, lng], { icon: tempIcon })
          .addTo(map)
          .bindPopup(createDataTypeSelectionPopup(lat, lng), {
            maxWidth: 300,
            className: "selection-popup",
          })
          .openPopup();
      });
    };

    loadLeaflet();

    return () => {
      if (mapRef.current) mapRef.current.remove();
      // Clean up global functions
      delete window.viewWeatherData;
      delete window.viewWaveData;
      delete window.selectDataType;
      delete window.closePopup;
      delete window.closeSelectionPopup;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0C0623] to-slate-800">
      {/* Navbar */}
      <Navbar />

      {/* Map */}
      <div id="map" className="absolute inset-0 z-0 mt-16" />
      <MarineVisualizer lat={selectedLat} lng={selectedLng} />

      {/* Control Panel */}
      <div className="fixed top-24 right-5 z-1000 w-80">
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
              onClick={togglePortMarkers}
              className={`w-full px-4 py-3 rounded-xl font-semibold text-white transition-all duration-200 border backdrop-blur-sm ${
                showPorts
                  ? "bg-gradient-to-br from-green-500/80 to-green-600/80 border-green-500/30 hover:border-green-500/60"
                  : "bg-gray-600/50 border-gray-500/30 hover:border-gray-500/60"
              }`}
            >
              ⚓ Ports {showPorts ? "ON" : "OFF"}
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
            <div className="text-lg text-white">
              Loading {loadingType === "weather" ? "Weather" : "Wave"} Data...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
