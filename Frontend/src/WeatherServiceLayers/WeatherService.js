export async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,pressure_msl&utm_source=chatgpt.com`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather data");

  const data = await res.json();

  return {
    temperature: data.current?.temperature_2m ?? null,
    windSpeed: data.current?.wind_speed_10m ?? null,
    windDirection: data.current?.wind_direction_10m ?? null,
    windGusts: data.current?.wind_gusts_10m ?? null,
    weatherCode: data.current?.weather_code ?? null,
    pressure: data.current?.pressure_msl ?? null,
  };
}
