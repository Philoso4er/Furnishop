import React, { useRef, useState, useEffect } from "react";
import { Paintbrush, Eraser, RotateCcw, Sparkles, AlertCircle } from "lucide-react";

interface SketchPadProps {
  onAnalyzeComplete: (analyzedItem: any) => void;
}

export const SketchPad: React.FC<SketchPadProps> = ({ onAnalyzeComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#2b2b2b");
  const [brushSize, setBrushSize] = useState(5);
  const [isErasing, setIsErasing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up the canvas with high resolution support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use parent sizing
    const rect = canvas.parentElement?.getBoundingClientRect();
    canvas.width = (rect?.width || 340) * 2;
    canvas.height = 200 * 2;
    canvas.style.width = "100%";
    canvas.style.height = "200px";

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(2, 2);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    contextRef.current = context;

    // Set solid white background so image uploads cleanly
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Update stroke settings
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = isErasing ? "#ffffff" : color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize, isErasing]);

  // Start Drawing
  const startDrawing = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;

    let clientX, clientY;
    if ("touches" in nativeEvent) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
  };

  // Continue Drawing
  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    nativeEvent.preventDefault(); // prevent scrolling on mobile while sketching

    let clientX, clientY;
    if ("touches" in nativeEvent) {
      clientX = nativeEvent.touches[0].clientX;
      clientY = nativeEvent.touches[0].clientY;
    } else {
      clientX = nativeEvent.clientX;
      clientY = nativeEvent.clientY;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  // End Drawing
  const stopDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  // Reset/Clear Drawing Board
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    setError(null);
  };

  // Analyze sketch using Gemini AI
  const handleAnalyze = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setAnalyzing(true);
    setError(null);

    try {
      const dataUrl = canvas.toDataURL("image/png");

      const res = await fetch("/api/analyze-sketch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl })
      });

      if (!res.ok) {
        throw new Error("Analysis failed. Please check backend connection.");
      }

      const parsedResult = await res.json();
      if (parsedResult.name) {
        onAnalyzeComplete(parsedResult);
      } else {
        throw new Error("Could not recognize design. Draw something clearer!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to read drawing. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-stone-900 rounded-xl border border-stone-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-semibold text-stone-200">Sketch Custom Decor Idea</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsErasing(!isErasing)}
            className={`p-1.5 rounded transition text-xs ${
              isErasing ? "bg-amber-500 text-white" : "bg-stone-800 text-stone-300 hover:text-white"
            }`}
            title={isErasing ? "Switch to Pen" : "Switch to Eraser"}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded transition text-xs"
            title="Reset canvas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative border-2 border-stone-800 rounded-lg overflow-hidden bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="block touch-none"
        />
        {analyzing && (
          <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-stone-200 text-xs">
            <Sparkles className="w-6 h-6 text-amber-400 animate-spin mb-2" />
            <span>AI recognizing your sketch...</span>
          </div>
        )}
      </div>

      {/* Tool Options */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {["#1c1917", "#7c2d12", "#065f46", "#1e3a8a", "#854d0e", "#57534e"].map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setIsErasing(false);
              }}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full border-2 transition ${
                !isErasing && color === c ? "border-amber-400 scale-110" : "border-transparent"
              }`}
            />
          ))}
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2 text-[11px] text-stone-400">
          <span>Brush Size:</span>
          <input
            type="range"
            min="2"
            max="15"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-16 accent-amber-500 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="font-mono text-[10px] text-stone-300">{brushSize}px</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-900/45 text-red-300 p-2 rounded-lg text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action CTA */}
      <button
        onClick={handleAnalyze}
        disabled={analyzing}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-55 text-white py-2 rounded-lg font-semibold text-xs shadow transition active:scale-[0.98]"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Convert Sketch to Custom Room Item
      </button>
    </div>
  );
};
