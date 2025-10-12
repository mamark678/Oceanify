import { useEffect, useRef } from "react";
import useMarineData from "./UseMarineData";
import { drawMarineCanvasEffect, cleanupMarineCanvasEffect } from "./CanvasEffect";

export default function MarineVisualizer({ lat, lng }) {
  const canvasRef = useRef(null);
  const data = useMarineData(lat, lng);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Make sure canvas matches window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 🔧 Ensure transparency (no black background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the effect (from your canvasEffect.js)
    if (data) {
      drawMarineCanvasEffect(canvas, data);
    }

    // Optional: handle window resizing
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (data) {
        drawMarineCanvasEffect(canvas, data);
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    // Cleanup function
    return () => {
      window.removeEventListener("resize", handleResize);
      cleanupMarineCanvasEffect();
    };
  }, [data]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 400,
        pointerEvents: "none",
        transition: "opacity 0.8s ease",
        opacity: data ? 1 : 0,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", background: "transparent" }}
      />
    </div>
  );
}