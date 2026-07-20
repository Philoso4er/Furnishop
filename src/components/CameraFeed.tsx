import React, { useRef, useState, useEffect } from "react";
import { 
  Camera, 
  RotateCcw, 
  Upload, 
  ShoppingBag, 
  Check, 
  X, 
  Bookmark, 
  Sparkles, 
  Trash2, 
  Package, 
  HelpCircle,
  FolderOpen
} from "lucide-react";
import { PlacedItem, PresetRoom } from "../types";

interface CameraFeedProps {
  placedItems: PlacedItem[];
  onTapToPlace: (x: number, y: number) => void;
  onSelectItem: (item: PlacedItem) => void;
  selectedItemId: string | null;
  onUpdateStatus: (id: string, status: "cart" | "saved" | "draft") => void;
  onDeleteItem: (id: string) => void;
  onClearCart: () => void;
}

const PRESET_ROOMS: PresetRoom[] = [
  {
    id: "living-room",
    name: "Living Room",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
    description: "Modern minimalist living room with clean walls and wooden floor"
  },
  {
    id: "bedroom",
    name: "Cozy Bedroom",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    description: "Bright airy bedroom with warm light"
  },
  {
    id: "workspace",
    name: "Home Office",
    url: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    description: "Productive workspace with wooden desk"
  }
];

export const CameraFeed: React.FC<CameraFeedProps> = ({
  placedItems,
  onTapToPlace,
  onSelectItem,
  selectedItemId,
  onUpdateStatus,
  onDeleteItem,
  onClearCart
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [snappedPhoto, setSnappedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentPreset, setCurrentPreset] = useState<PresetRoom>(PRESET_ROOMS[0]);
  const [showCartDropdown, setShowCartDropdown] = useState<boolean>(false);

  // Start video stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setSnappedPhoto(null);
    } catch (err: any) {
      console.warn("Camera failed to start:", err);
      setCameraError("Camera access unavailable. Enjoy our curated design templates below!");
      setCameraActive(false);
    }
  };

  // Stop video stream
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture current frame as photo
  const snapPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      setSnappedPhoto(dataUrl);
      stopCamera();
    }
  };

  // Handle image upload fallback for background
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSnappedPhoto(event.target.result as string);
          stopCamera();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tap/click on spatial map to place item
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onTapToPlace(x, y);
  };

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Try starting camera on load
  useEffect(() => {
    startCamera();
  }, []);

  const cartItems = placedItems.filter(i => i.status === "cart");
  const cartTotal = cartItems.reduce((acc, curr) => acc + curr.price, 0);

  return (
    <div className="relative w-full h-full flex flex-col bg-stone-900 overflow-hidden select-none">
      
      {/* Top Header Rail: Status & SHOPPING CART */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        
        {/* Active view status pill */}
        <div className="flex items-center gap-2 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-stone-800 text-[11px] font-bold text-stone-200 shadow-lg pointer-events-auto">
          <span className={`w-2 h-2 rounded-full ${cameraActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
          {cameraActive ? "Live Cam View" : snappedPhoto ? "Room Snapshot" : `Template: ${currentPreset.name}`}
        </div>

        {/* Hand annotated: SHOPPING CART button in upper right */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setShowCartDropdown(!showCartDropdown)}
            className="flex items-center gap-2 bg-stone-950/85 hover:bg-stone-900 border border-stone-800 text-stone-200 p-2.5 rounded-full shadow-lg transition active:scale-95"
            title="Shopping Cart"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              {cartItems.length > 0 && (
                <span className="absolute -top-2.5 -right-2.5 bg-emerald-600 text-white font-bold font-mono text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-stone-950 animate-bounce">
                  {cartItems.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold pr-1">Cart</span>
          </button>

          {/* Mini Cart Slide-over/Dropdown */}
          {showCartDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-stone-950 border border-stone-800 rounded-xl p-3.5 shadow-2xl z-40 text-stone-200">
              <div className="flex items-center justify-between border-b border-stone-850 pb-2 mb-2">
                <span className="text-xs font-bold text-stone-300">Shopping Cart Spec</span>
                {cartItems.length > 0 && (
                  <button 
                    onClick={onClearCart}
                    className="text-[10px] text-stone-500 hover:text-rose-400 transition"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {cartItems.length === 0 ? (
                <p className="text-[10px] text-stone-500 py-4 text-center">
                  Your cart is empty. Tap any placed item on the room feed below and click the green tick ✓ to add it to your cart.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-[11px] bg-stone-900/60 p-2 rounded-lg border border-stone-850">
                      <div className="truncate pr-2">
                        <p className="font-bold text-stone-300 truncate">{item.name}</p>
                        <p className="text-[9px] text-stone-500">{item.material}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-amber-500">${item.price}</span>
                        <button
                          onClick={() => onUpdateStatus(item.id, "draft")}
                          className="p-0.5 text-stone-500 hover:text-red-400"
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-stone-850 pt-2 flex items-center justify-between text-xs font-bold font-mono">
                    <span className="text-stone-400">Total:</span>
                    <span className="text-emerald-400">${cartTotal}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Room Canvas/Stream */}
      <div 
        ref={containerRef}
        onClick={handleTap}
        className="relative flex-1 w-full flex items-center justify-center cursor-crosshair overflow-hidden group"
      >
        {/* Camera video element, snapped image, or template image background */}
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : snappedPhoto ? (
          <img
            src={snappedPhoto}
            alt="Snapped Room"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <img
            src={currentPreset.url}
            alt={currentPreset.name}
            className="w-full h-full object-cover transition-all duration-500"
            referrerPolicy="no-referrer"
          />
        )}

        {/* Floating placed items overlay with in-feed interactive spec buttons (✓ Tick, X Cancel, Save) */}
        {placedItems.map((item) => {
          const isSelected = selectedItemId === item.id;
          return (
            <div
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectItem(item);
              }}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
            >
              <div className="relative flex flex-col items-center justify-center">
                
                {/* Selected Action Toolbar directly beside/on the item, as requested & sketched */}
                {isSelected && (
                  <div className="absolute -top-12 z-30 flex items-center gap-1.5 bg-stone-950/95 border border-stone-700 p-1 rounded-full shadow-2xl animate-fade-in pointer-events-auto">
                    {/* Tick / ✓: Add to Cart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(item.id, item.status === "cart" ? "draft" : "cart");
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 ${
                        item.status === "cart" 
                          ? "bg-emerald-600 text-white" 
                          : "bg-stone-900 hover:bg-stone-800 text-emerald-400"
                      }`}
                      title={item.status === "cart" ? "Remove from Cart" : "Accept & Add to Cart (✓)"}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    {/* Save / Bookmark Idea */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(item.id, item.status === "saved" ? "draft" : "saved");
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90 ${
                        item.status === "saved"
                          ? "bg-amber-500 text-white"
                          : "bg-stone-900 hover:bg-stone-800 text-amber-400"
                      }`}
                      title={item.status === "saved" ? "Remove Saved" : "Save / Bookmark (★)"}
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Cancel / X: Remove Item Placement */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="w-7 h-7 bg-stone-900 hover:bg-red-950/80 text-red-400 rounded-full flex items-center justify-center transition active:scale-90"
                      title="Cancel Item Placement (✗)"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                )}

                {/* Main clickable visual pin */}
                <span className={`absolute inline-flex h-12 w-12 rounded-full opacity-60 animate-ping duration-1000 ${
                  isSelected ? "bg-amber-400" : item.status === "cart" ? "bg-emerald-400" : item.status === "saved" ? "bg-rose-400" : "bg-white"
                }`} />

                <div className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full shadow-2xl border-2 transition-all duration-300 transform hover:scale-110 ${
                  isSelected 
                    ? "bg-amber-500 border-amber-200 scale-105" 
                    : item.status === "cart" 
                    ? "bg-emerald-600 border-emerald-300" 
                    : item.status === "saved"
                    ? "bg-rose-600 border-rose-300"
                    : "bg-stone-800 border-stone-200"
                }`}>
                  <span className="text-white text-[10px] font-extrabold font-mono">
                    ${item.price}
                  </span>
                </div>
                
                {/* Floating item name label */}
                <div className="absolute top-12 whitespace-nowrap bg-stone-950/90 text-white text-[9px] px-2 py-0.5 rounded border border-stone-850 shadow-md font-semibold pointer-events-none transition opacity-80 group-hover:opacity-100">
                  {item.name}
                </div>
              </div>
            </div>
          );
        })}

        {/* Action HUD / Camera Error Banner */}
        {cameraError && (
          <div className="absolute bottom-16 left-4 right-4 bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs px-3.5 py-2 rounded-xl text-center backdrop-blur-sm z-10 shadow-lg animate-fade-in">
            {cameraError}
          </div>
        )}
      </div>

      {/* Floating shutter & template controls inside live cam feed */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Change Template Preset button */}
        <div className="flex bg-stone-950/85 backdrop-blur-md p-1 rounded-full border border-stone-800 pointer-events-auto shadow-lg">
          {PRESET_ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => {
                setCurrentPreset(room);
                setSnappedPhoto(null);
                stopCamera();
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${
                !cameraActive && !snappedPhoto && currentPreset.id === room.id
                  ? "bg-amber-500 text-stone-950"
                  : "text-stone-300 hover:text-white"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        {/* Center/Right: Hand-annotated "TAKE/ADD PHOTO" Shutter button in the lower right */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {cameraActive ? (
            <button
              onClick={snapPhoto}
              title="TAKE/ADD PHOTO"
              className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 border-[3px] border-white shadow-2xl flex items-center justify-center transition active:scale-90"
            >
              <div className="w-5 h-5 bg-white rounded-full" />
            </button>
          ) : (
            <button
              onClick={startCamera}
              title="RESTART LIVE CAM FEED"
              className="w-11 h-11 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-stone-800 shadow-2xl flex items-center justify-center transition active:scale-90 text-amber-500"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}

          {/* Quick Clear Snapshot Fallback */}
          {snappedPhoto && (
            <button
              onClick={() => {
                setSnappedPhoto(null);
                startCamera();
              }}
              title="Clear snapshot"
              className="w-9 h-9 rounded-full bg-stone-950/90 hover:bg-stone-900 border border-stone-800 shadow-xl flex items-center justify-center transition active:scale-90 text-stone-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
