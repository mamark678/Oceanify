// src/components/MarineVisualizer/useMarineData.js
import { useEffect, useState } from "react";

export default function useMarineData(lat, lng) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!lat || !lng) {
      setData(null); // Clear data when no coordinates
      return;
    }

    const cacheKey = `marineData-${lat.toFixed(2)}-${lng.toFixed(2)}`;
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();

    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (now - timestamp < 60 * 60 * 1000) {
        setData(data);
        return;
      }
    }

    const fetchData = async () => {
      try {
        const waveUrl = `https://api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}&hourly=wave_height,wave_direction,swell_wave_height,swell_wave_direction,secondary_swell_wave_height,secondary_swell_wave_period,sea_level_height_msl,sea_surface_temperature,ocean_current_velocity,ocean_current_direction&current=sea_level_height_msl,ocean_current_direction&timezone=auto`;

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`;

        const [waveRes, weatherRes] = await Promise.all([fetch(waveUrl), fetch(weatherUrl)]);
        const waveData = await waveRes.json();
        const weatherData = await weatherRes.json();

        const combined = {
          wave: waveData.current,
          ocean: waveData.hourly,
          wind: weatherData.current,
        };

        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: now, data: combined }));
        setData(combined);
      } catch (error) {
        console.error("Failed to fetch marine data:", error);
        setData(null); // Clear data on error
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60 * 60 * 1000); // hourly refresh
    return () => clearInterval(interval);
  }, [lat, lng]);

  return data;
}