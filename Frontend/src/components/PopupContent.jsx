// src/components/PopupContent.jsx

// Compact popup content generator - Returns HTML STRING, not JSX
export const createEnhancedPopup = (weatherData, waveData, lat, lng, getWeatherDescription, degToCompass, formatValue) => {
  const { current } = weatherData;
  
  // Return template literal STRING (backticks), NOT JSX
  return `
    <div style="
      min-width: 260px;
      max-width: 280px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #ffffff;
      border-radius: 12px;
      padding: 0;
      color: #1a1a1a;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      overflow: hidden;
      border: 1px solid #e2e8f0;
      font-size: 13px;
    ">
      <!-- Header Section -->
      <div style="
        background: #f8fafc;
        padding: 16px;
        border-bottom: 1px solid #e2e8f0;
        text-align: center;
      ">
        <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          ${getWeatherDescription(current.weather_code)}
        </div>
        
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
          <div style="font-size: 32px; line-height: 1;">
            ${current.is_day ? '☀️' : '🌙'}
          </div>
          <div style="font-size: 32px; font-weight: 300; line-height: 1; color: #1e293b;">
            ${formatValue(current.temperature_2m, '°', 0)}
          </div>
        </div>
        
        <div style="font-size: 12px; color: #64748b; font-weight: 500;">
          Feels like ${formatValue(current.apparent_temperature, '°', 0)}
        </div>
      </div>

      <!-- Weather Details Grid - Compact -->
      <div style="padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <!-- Wind -->
        <div style="text-align: center;">
          <div style="font-size: 18px; margin-bottom: 4px;">💨</div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; margin-bottom: 2px;">
            Wind
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #1e293b;">
            ${formatValue(current.wind_speed_10m, '', 0)} km/h
          </div>
        </div>

        <!-- Humidity -->
        <div style="text-align: center;">
          <div style="font-size: 18px; margin-bottom: 4px;">💧</div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; margin-bottom: 2px;">
            Humidity
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #1e293b;">
            ${formatValue(current.relative_humidity_2m, '%', 0)}
          </div>
        </div>

        <!-- Cloud Cover -->
        <div style="text-align: center;">
          <div style="font-size: 18px; margin-bottom: 4px;">☁️</div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; margin-bottom: 2px;">
            Clouds
          </div>
          <div style="font-size: 14px; font-weight: 600; color: #1e293b;">
            ${formatValue(current.cloud_cover, '%', 0)}
          </div>
        </div>

        <!-- Pressure -->
        <div style="text-align: center;">
          <div style="font-size: 18px; margin-bottom: 4px;">🌡️</div>
          <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px; font-weight: 600; margin-bottom: 2px;">
            Pressure
          </div>
          <div style="font-size: 12px; font-weight: 600; color: #1e293b;">
            ${formatValue(current.surface_pressure, ' hPa', 0)}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        background: #f1f5f9;
        padding: 12px 16px;
        font-size: 10px;
        color: #64748b;
        text-align: center;
        letter-spacing: 0.2px;
        font-weight: 500;
        border-top: 1px solid #e2e8f0;
      ">
        <div style="margin-bottom: 2px;">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
        <span style="color: #94a3b8;">Open-Meteo · OpenWeatherMap</span>
      </div>
    </div>
  `;
};