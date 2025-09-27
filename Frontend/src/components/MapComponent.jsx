// import { useRef, useEffect, useState } from "react";
// import L from "leaflet";
// import "leaflet.heat";
// import "leaflet/dist/leaflet.css";
// import { temperatureLayer } from "../WeatherServiceLayers/TemperatureLayer";
// import { getWeather } from "../WeatherServiceLayers/WeatherService";
// import { TemperatureHeatmapLayer } from "../WeatherServiceLayers/TemperatureHeatMap";
// import { cities } from "../data/cities";
// import {
//   fetchSeaLevelGridPressure,
//   SeaLevelHeatmapLayerFullMap,
// } from "../WeatherServiceLayers/SeaLevelPressureHeatMap";
// export default function MapComponent() {
//   const temperatureHeatLayerRef = useRef(null);
//   const mapRef = useRef(null);
//   const seaLevelPressureHeatLayerRef = useRef(null);
//   const [isHeatmapVisible, setIsHeatmapVisible] = useState(true);
//   const [activeHeatmap, setActiveHeatmap] = useState("temperature");
//   const [heatmapLoaded, setHeatmapLoaded] = useState(false);  

//   useEffect(() => {
//     const map = L.map("map").setView([7.908941, 125.078746], 5);
//     mapRef.current = map;

//     // Add OpenStreetMap tiles
//     L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//       minZoom: 1,
//       maxZoom: 19,
//       attribution:
//         '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//     }).addTo(map);

//     // Add temperature labels for each city
//     cities.forEach(async (city) => {
//       const temp = (Math.random() * 10 + 25).toFixed(2);
//       const label = temperatureLayer(temp);
//       L.marker([city.lat, city.lon], { icon: label }).addTo(map);
//     });

//     async function loadHeatmap() {
//       try {
//         // Temperature data (city-based)
//         const tempPromises = cities.map((city) =>
//           getWeather(city.lat, city.lon)
//         );
//         const tempResults = await Promise.all(tempPromises);
//         const cityData = tempResults.map((data, index) => ({
//           lat: cities[index].lat,
//           lon: cities[index].lon,
//           value: data.temperature, 
//         }));

//         const temperatureHeatMap = TemperatureHeatmapLayer(cityData);
//         temperatureHeatMap.addTo(mapRef.current);
//         temperatureHeatLayerRef.current = temperatureHeatMap;

//         // SEA LEVEL grid points
//         const bounds = map.getBounds();
//         const step = 3;
//         const gridPoints = [];
//         for (
//           let lat = bounds.getSouth();
//           lat <= bounds.getNorth();
//           lat += step
//         ) {
//           for (
//             let lon = bounds.getWest();
//             lon <= bounds.getEast();
//             lon += step
//           ) {
//             gridPoints.push({ lat, lon });
//           }
//         }
//         // Fetch pressure for grid points using the separated function
//         const pressureGrid = await fetchSeaLevelGridPressure(gridPoints);

//         const seaLevelHeatMap = SeaLevelHeatmapLayerFullMap(pressureGrid);
//         if (seaLevelHeatMap) {
//           seaLevelHeatMap.addTo(mapRef.current);
//           seaLevelPressureHeatLayerRef.current = seaLevelHeatMap;
//         }

//         setHeatmapLoaded(true);
//       } catch (err) {
//         console.error("Failed to load heatmaps:", err);
//       }
//     }

//     loadHeatmap();

//     // Geolocation
//     let userMarker = null;
//     let userCircle = null;

//     function success(position) {
//       const lat = position.coords.latitude;
//       const lng = position.coords.longitude;
//       const accuracy = position.coords.accuracy;

//       if (userMarker) {
//         map.removeLayer(userMarker);
//         // map.removeLayer(userCircle);
//       }

//       userMarker = L.marker([lat, lng]).addTo(map);
//       // userCircle = L.circle([lat, lng], { radius: accuracy }).addTo(map);
//       map.setView([lat, lng], 6);
//     }

//     function error(err) {
//       if (err.code === 1) alert("Please allow geolocation access");
//       else alert("Cannot get current location.");
//     }

//     navigator.geolocation.watchPosition(success, error);

//     return () => {
//       map.remove();
//     };
//   }, []);

//   const showTemperatureHeatmap = () => {
//     if (!mapRef.current) return;

//     if (
//       seaLevelPressureHeatLayerRef.current &&
//       mapRef.current.hasLayer(seaLevelPressureHeatLayerRef.current)
//     ) {
//       mapRef.current.removeLayer(seaLevelPressureHeatLayerRef.current);
//     }

//     if (
//       temperatureHeatLayerRef.current &&
//       !mapRef.current.hasLayer(temperatureHeatLayerRef.current)
//     ) {
//       temperatureHeatLayerRef.current.addTo(mapRef.current);
//     }

//     setActiveHeatmap("temperature");
//   };

//   const showPressureHeatmap = () => {
//     if (!mapRef.current) return;

//     if (
//       temperatureHeatLayerRef.current &&
//       mapRef.current.hasLayer(temperatureHeatLayerRef.current)
//     ) {
//       mapRef.current.removeLayer(temperatureHeatLayerRef.current);
//     }

//     if (
//       seaLevelPressureHeatLayerRef.current &&
//       !mapRef.current.hasLayer(seaLevelPressureHeatLayerRef.current)
//     ) {
//       seaLevelPressureHeatLayerRef.current.addTo(mapRef.current);
//     }

//     setActiveHeatmap("pressure");
//   };

//   return (
//     <div style={{ position: "relative", height: "100vh", width: "100%" }}>
//       {/* Map container */}
//       <div id="map" style={{ height: "100%", width: "100%" }}></div>

//       {/* Heatmap buttons */}
//       <div
//         style={{
//           position: "absolute",
//           top: "10px",
//           right: "10px",
//           zIndex: 1000,
//           display: "flex",
//           flexDirection: "column",
//           pointerEvents: "auto",
//         }}
//       >
//         <button
//           onClick={showTemperatureHeatmap}
//           disabled={!heatmapLoaded}
//           style={{
//             marginBottom: "5px",
//             padding: "8px 12px",
//             border: "none",
//             borderRadius: "6px",
//             background: activeHeatmap === "temperature" ? "#f87171" : "#60a5fa",
//             color: "white",
//             cursor: heatmapLoaded ? "pointer" : "not-allowed",
//             width: "140px",
//           }}
//         >
//           Temperature
//         </button>

//         <button
//           onClick={showPressureHeatmap}
//           disabled={!heatmapLoaded}
//           style={{
//             padding: "8px 12px",
//             border: "none",
//             borderRadius: "6px",
//             background: activeHeatmap === "pressure" ? "#f87171" : "#60a5fa",
//             color: "white",
//             cursor: heatmapLoaded ? "pointer" : "not-allowed",
//             width: "140px",
//           }}
//         >
//           Sea Level Pressure
//         </button>
//       </div>
//     </div>
//   );
// }


import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function MapComponent() {
  const mapRef = useRef(null);
  const [activeHeatmap, setActiveHeatmap] = useState("temperature");

  useEffect(() => {
    const API_KEY = "YOUR_OPENWEATHER_API_KEY";

    const map = L.map("map").setView([7.908941, 125.078746], 5);
    mapRef.current = map;

    // Base map
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Define OWM layers
    const tempLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${API_KEY}`
    );

    const pressureLayer = L.tileLayer(
      `https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=${API_KEY}`
    );

    // Show temperature by default
    tempLayer.addTo(map);

    // Expose layers for button handlers
    mapRef.current.tempLayer = tempLayer;
    mapRef.current.pressureLayer = pressureLayer;

    // Geolocation
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        L.marker([lat, lng]).addTo(map);
        map.setView([lat, lng], 7);
      },
      (err) => console.warn("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    return () => {
      map.remove();
    };
  }, []);

  const showTemperatureHeatmap = () => {
    const { current: map } = mapRef;
    map.removeLayer(map.pressureLayer);
    map.tempLayer.addTo(map);
    setActiveHeatmap("temperature");
  };

  const showPressureHeatmap = () => {
    const { current: map } = mapRef;
    map.removeLayer(map.tempLayer);
    map.pressureLayer.addTo(map);
    setActiveHeatmap("pressure");
  };

  return (
    <div style={{ position: "relative", height: "100vh", width: "100%" }}>
      <div id="map" style={{ height: "100%", width: "100%" }}></div>

      {/* Buttons */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000 }}>
        <button
          onClick={showTemperatureHeatmap}
          style={{
            marginBottom: "5px",
            padding: "8px 12px",
            borderRadius: "6px",
            background: activeHeatmap === "temperature" ? "#f87171" : "#60a5fa",
            color: "white",
          }}
        >
          Temperature
        </button>
        <button
          onClick={showPressureHeatmap}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            background: activeHeatmap === "pressure" ? "#f87171" : "#60a5fa",
            color: "white",
          }}
        >
          Pressure
        </button>
      </div>
    </div>
  );
}
