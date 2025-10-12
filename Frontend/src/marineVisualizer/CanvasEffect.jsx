// src/components/MarineVisualizer/canvasEffect.js

let animationId = null;
let windParticles = [];

export function drawMarineCanvasEffect(canvas, data) {
  if (!canvas || !data) {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    windParticles = [];
    return;
  }

  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // Extract only wind data with fallbacks
  let windSpeed = data.wind?.wind_speed_10m || 0;
  let windDir = (data.wind?.wind_direction_10m || 0) * (Math.PI / 180);
  const weatherCode = data.wind?.weather_code || 0;
  const pressure = data.wind?.surface_pressure || 1013;

  // ⚡ Storm adjustment for wind only
  let stormIntensity = 1;
  if (weatherCode >= 95) {
    stormIntensity = 1.6;
    windSpeed *= stormIntensity;
    windDir += (Math.random() - 0.5) * 0.6;
  }
  if (pressure && pressure < 995) {
    const pressureEffect = (995 - pressure) / 20;
    stormIntensity *= (1 + pressureEffect * 0.3);
    const swirl = (Math.PI / 8) * pressureEffect;
    windDir -= swirl;
    windSpeed *= stormIntensity;
  }

  // 🌬️ WIND PARTICLE SYSTEM
  const windParticleCount = Math.min(150, 30 + Math.round(windSpeed * 3));
  
  if (windParticles.length === 0 || windParticles.length !== windParticleCount) {
    windParticles = Array.from({ length: windParticleCount }, () => ({
      x: Math.random() * W,
      y: Math.random() * H, // Use full canvas height for wind
      speed: 0.8 + Math.random() * (windSpeed / 25),
      dir: windDir + (Math.random() * 0.4 - 0.2),
      size: Math.random() * 1.0 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      turbulence: Math.random() * 0.8 + 0.2,
    }));
  }

  // Movement vectors for wind only
  const windDriftX = Math.cos(windDir) * windSpeed * 0.08;
  const windDriftY = Math.sin(windDir) * windSpeed * 0.08;

  function animate() {
    ctx.clearRect(0, 0, W, H);

    const time = Date.now() / 1000;

    // 🌬️ Update and draw WIND particles only
    windParticles.forEach((p) => {
      // Base wind movement
      p.x += Math.cos(p.dir) * p.speed + windDriftX;
      p.y += Math.sin(p.dir) * p.speed + windDriftY;
      
      // Storm turbulence
      if (stormIntensity > 1) {
        p.x += (Math.random() - 0.5) * p.turbulence * stormIntensity * 0.5;
        p.y += (Math.random() - 0.5) * p.turbulence * stormIntensity * 0.5;
      }
      
      // Gentle vertical variation for more natural wind flow
      p.y += Math.sin(time * 3 + p.x * 0.01) * 0.1;

      // Wrap around edges
      if (p.x > W + 10) p.x = -10;
      if (p.x < -10) p.x = W + 10;
      if (p.y > H + 10) p.y = -10;
      if (p.y < -10) p.y = H + 10;

      // Draw wind particle as directional streaks
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      
      // Draw as streak in wind direction - longer streaks for stronger wind
      const streakLength = 4 + (windSpeed / 20);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x - Math.cos(p.dir) * streakLength, 
        p.y - Math.sin(p.dir) * streakLength
      );
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = p.size;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    });

    // Optional: Add wind speed indicator text
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px Arial";
    ctx.fillText(`Wind: ${windSpeed.toFixed(1)} knots`, 10, 20);
    
    animationId = requestAnimationFrame(animate);
  }

  animate();
}

export function cleanupMarineCanvasEffect() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  windParticles = [];
}