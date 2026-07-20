import React, { useState } from "react";
import { CameraFeed } from "./components/CameraFeed";
import { PlacedItemsList } from "./components/PlacedItemsList";
import { ChatBox } from "./components/ChatBox";
import { SketchPad } from "./components/SketchPad";
import { PlacedItem } from "./types";
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Palette, 
  ShoppingBag, 
  Bookmark, 
  Info,
  Layers,
  Check,
  X,
  Upload,
  AlertCircle,
  Undo
} from "lucide-react";

export default function App() {
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([
    {
      id: "preset-1",
      name: "Mid-Century Ash Armchair",
      category: "furniture",
      description: "A comfortable solid wood armchair with soft linen upholstery.",
      color: "Cream & Natural Ash",
      material: "Solid ash wood, Belgian linen",
      dimensions: "32\" H x 28\" W x 30\" D",
      price: 249,
      iconType: "armchair",
      x: 35,
      y: 65,
      status: "draft"
    },
    {
      id: "preset-2",
      name: "Minimalist Brass Arch Lamp",
      category: "lighting",
      description: "An elegant warm floor lamp with brushed brass finish.",
      color: "Brushed Gold",
      material: "Stainless steel, brass plating",
      dimensions: "72\" H x 12\" W",
      price: 135,
      iconType: "lamp",
      x: 75,
      y: 40,
      status: "saved"
    }
  ]);

  const [selectedItemId, setSelectedItemId] = useState<string | null>("preset-1");
  const [roomStyle, setRoomStyle] = useState<string>("Japandi Minimalist");
  const [spaceType, setSpaceType] = useState<string>("Living Room");
  const [panelOpen, setPanelOpen] = useState<boolean>(true);
  const [panelTab, setPanelTab] = useState<"chat" | "sketch">("chat");
  const [placingLoading, setPlacingLoading] = useState<boolean>(false);
  const [lastPlacedCoords, setLastPlacedCoords] = useState<{ x: number; y: number } | null>(null);
  const [customUploadError, setCustomUploadError] = useState<string | null>(null);

  const selectedItem = placedItems.find((i) => i.id === selectedItemId);

  // Get position-based context
  const getAreaDescription = (x: number, y: number) => {
    if (y < 35) {
      if (x < 30) return "upper left corner / high wall";
      if (x > 70) return "upper right corner / high wall";
      return "main ceiling or top accent wall";
    }
    if (y > 65) {
      if (x < 30) return "lower left floor area / rug corner";
      if (x > 70) return "lower right floor area / corner space";
      return "central floor space";
    }
    if (x < 30) return "middle left wall / shelf area";
    if (x > 70) return "middle right wall / window zone";
    return "center wall or back wall";
  };

  // Tap to Place Action
  const handleTapToPlace = async (x: number, y: number) => {
    setPlacingLoading(true);
    setLastPlacedCoords({ x, y });
    const areaName = getAreaDescription(x, y);

    try {
      const res = await fetch("/api/suggest-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tapX: Math.round(x),
          tapY: Math.round(y),
          areaName,
          roomStyle,
          spaceType
        })
      });

      if (!res.ok) throw new Error("Suggestion failed.");

      const suggestion = await res.json();
      const newItem: PlacedItem = {
        id: Math.random().toString(),
        name: suggestion.name || "Custom Decor Accent",
        category: suggestion.category || "decor",
        description: suggestion.description || "An elegant accessory matching the layout.",
        color: suggestion.color || "Neutral Wood",
        material: suggestion.material || "Linen / Ceramics",
        dimensions: suggestion.dimensions || "Medium Size",
        price: suggestion.price || 85,
        iconType: suggestion.iconType || "container",
        x,
        y,
        status: "draft"
      };

      setPlacedItems((prev) => [...prev, newItem]);
      setSelectedItemId(newItem.id);
    } catch (err) {
      console.warn("Using fallback local item:", err);
      const fallbackItem: PlacedItem = {
        id: Math.random().toString(),
        name: "Eco-Friendly Terracotta Vase",
        category: "decor",
        description: "A textured organic ceramic vase that adds natural warmth to this location.",
        color: "Terracotta",
        material: "Glazed terracotta ceramic",
        dimensions: "12\" H x 6\" W",
        price: 39,
        iconType: "flower",
        x,
        y,
        status: "draft"
      };
      setPlacedItems((prev) => [...prev, fallbackItem]);
      setSelectedItemId(fallbackItem.id);
    } finally {
      setPlacingLoading(false);
    }
  };

  // Handle sketch completed analysis
  const handleAnalyzeComplete = (analyzedItem: any) => {
    const newItem: PlacedItem = {
      id: Math.random().toString(),
      name: analyzedItem.name || "Handmade Sketch Decor",
      category: analyzedItem.category || "furniture",
      description: analyzedItem.description || "An item designed and generated from your custom sketch.",
      color: analyzedItem.color || "Natural Wood",
      material: analyzedItem.material || "Premium Crafted",
      dimensions: analyzedItem.dimensions || "Standard Fit",
      price: analyzedItem.price || 149,
      iconType: analyzedItem.iconType || "armchair",
      x: 45 + Math.random() * 10, // Center with a bit of variation
      y: 50 + Math.random() * 10,
      status: "draft"
    };

    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedItemId(newItem.id);
  };

  // Image Upload for uploading item into the location (as annotated on the bottom-right of the panel)
  const handleItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPlacingLoading(true);
    setCustomUploadError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Content = event.target?.result as string;

        // Reuse sketch analysis endpoint which is designed for multimodal image parsing!
        const res = await fetch("/api/analyze-sketch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Content })
        });

        if (!res.ok) throw new Error("Server failed to parse item photo.");

        const parsedResult = await res.json();
        
        const newItem: PlacedItem = {
          id: Math.random().toString(),
          name: parsedResult.name || "Uploaded Decor Item",
          category: parsedResult.category || "decor",
          description: parsedResult.description || "A custom object matched and placed based on your photo upload.",
          color: parsedResult.color || "As Seen",
          material: parsedResult.material || "Custom Material",
          dimensions: parsedResult.dimensions || "Custom Scale",
          price: parsedResult.price || 120,
          iconType: parsedResult.iconType || "container",
          x: 50, // Center of room
          y: 60,
          status: "draft"
        };

        setPlacedItems((prev) => [...prev, newItem]);
        setSelectedItemId(newItem.id);
      } catch (err: any) {
        console.error("Item upload failure:", err);
        setCustomUploadError("Could not recognize furniture from image. Please try another photo.");
      } finally {
        setPlacingLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Status updates (cart, saved, draft)
  const handleUpdateStatus = (id: string, status: "cart" | "saved" | "draft") => {
    setPlacedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  // Delete placed item
  const handleDeleteItem = (id: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // Clear entire cart
  const handleClearCart = () => {
    setPlacedItems((prev) =>
      prev.map((item) => (item.status === "cart" ? { ...item, status: "draft" } : item))
    );
  };

  return (
    <div className="w-full h-screen bg-stone-950 text-stone-100 flex flex-col font-sans overflow-hidden">
      
      {/* 50/50 Horizontal Split Container */}
      <div className="flex-1 flex flex-col md:flex-row h-full">
        
        {/* Top Half: Camera Room Canvas & Tap-to-Place Feed */}
        <section className="h-[50vh] md:h-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-stone-800 bg-stone-900 overflow-hidden">
          <CameraFeed 
            placedItems={placedItems}
            onTapToPlace={handleTapToPlace}
            onSelectItem={(item) => setSelectedItemId(item.id)}
            selectedItemId={selectedItemId}
            onUpdateStatus={handleUpdateStatus}
            onDeleteItem={handleDeleteItem}
            onClearCart={handleClearCart}
          />

          {/* Place Item Loading Overlay */}
          {placingLoading && (
            <div className="absolute inset-0 z-40 bg-stone-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4">
              <span className="absolute inline-flex h-20 w-20 rounded-full bg-amber-500 opacity-25 animate-ping" />
              <div className="relative p-5 bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col items-center gap-3 max-w-xs">
                <Sparkles className="w-6 h-6 text-amber-500 animate-spin" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Room Placement</h4>
                <p className="text-[11px] text-stone-400">
                  Mapping coordinates & generating matching layout item with Gemini AI...
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Bottom Half: Interactive Chatbot & Specs Part */}
        <section className="h-[50vh] md:h-full md:w-1/2 flex flex-col bg-stone-950 relative min-h-0 overflow-hidden">
          
          {/* Style Configuration Filters (Hand-designed styled bar) */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-stone-900/60 border-b border-stone-900 text-xs shrink-0 z-10">
            <div className="flex items-center gap-1.5 font-bold text-stone-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Theme Filter</span>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={roomStyle} 
                onChange={(e) => setRoomStyle(e.target.value)}
                className="bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-200 py-1 px-2.5 rounded-lg font-semibold text-[10px] cursor-pointer outline-none transition"
              >
                <option>Japandi Minimalist</option>
                <option>Mid-Century Modern</option>
                <option>Industrial Loft</option>
                <option>Boho Chic</option>
                <option>Scandi Warm</option>
              </select>

              <select 
                value={spaceType} 
                onChange={(e) => setSpaceType(e.target.value)}
                className="bg-stone-850 hover:bg-stone-800 border border-stone-800 text-stone-200 py-1 px-2.5 rounded-lg font-semibold text-[10px] cursor-pointer outline-none transition"
              >
                <option>Living Room</option>
                <option>Cozy Bedroom</option>
                <option>Home Workspace</option>
                <option>Reading Nook</option>
              </select>
            </div>
          </div>

          {/* Core Content Area: Selected Item Specs & Descriptions */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto pb-[70px] min-h-0 scrollbar-thin">
            
            {/* If an item is active/selected, show detailed interactive Spec Sheet */}
            {selectedItem ? (
              <div className="bg-stone-900 border border-stone-850 rounded-xl p-4 shadow-xl space-y-3.5 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                
                <div className="flex items-start justify-between gap-3 pl-1.5">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-500 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full">
                      {selectedItem.category} • active spec
                    </span>
                    <h2 className="text-sm font-bold text-stone-100 mt-1.5 leading-tight">{selectedItem.name}</h2>
                  </div>

                  <div className="text-right">
                    <span className="text-stone-400 text-[10px] block uppercase font-mono font-bold">Estimated Cost</span>
                    <span className="text-lg font-extrabold text-emerald-400 font-mono">${selectedItem.price}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed pl-1.5 bg-stone-950/30 py-2 px-3 rounded-lg border border-stone-850/40">
                  {selectedItem.description}
                </p>

                {/* Grid of details */}
                <div className="grid grid-cols-3 gap-2 text-[10px] pl-1.5 pt-1">
                  <div className="bg-stone-950/40 p-2 rounded-lg border border-stone-850">
                    <span className="text-stone-500 block uppercase font-mono text-[8px] font-bold">Material</span>
                    <strong className="text-stone-200 block truncate">{selectedItem.material}</strong>
                  </div>
                  <div className="bg-stone-950/40 p-2 rounded-lg border border-stone-850">
                    <span className="text-stone-500 block uppercase font-mono text-[8px] font-bold">Sizing</span>
                    <strong className="text-stone-200 block truncate">{selectedItem.dimensions}</strong>
                  </div>
                  <div className="bg-stone-950/40 p-2 rounded-lg border border-stone-850">
                    <span className="text-stone-500 block uppercase font-mono text-[8px] font-bold">Accent Color</span>
                    <strong className="text-stone-200 block truncate">{selectedItem.color}</strong>
                  </div>
                </div>

                {/* Hand annotated: item-specific actions (✓ Add to Cart, X Cancel Placement, Save Bookmark) */}
                <div className="flex items-center justify-between border-t border-stone-850 pt-3 pl-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-stone-400">Spec Status:</span>
                    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                      selectedItem.status === "cart"
                        ? "bg-emerald-950 text-emerald-400"
                        : selectedItem.status === "saved"
                        ? "bg-rose-950 text-rose-400"
                        : "bg-stone-800 text-stone-400"
                    }`}>
                      {selectedItem.status === "cart" ? "In Cart" : selectedItem.status === "saved" ? "Saved Idea" : "Draft"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Add to Cart (✓) */}
                    <button
                      onClick={() => handleUpdateStatus(selectedItem.id, selectedItem.status === "cart" ? "draft" : "cart")}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition active:scale-95 ${
                        selectedItem.status === "cart"
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700"
                      }`}
                      title="Add to Cart / Tick"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{selectedItem.status === "cart" ? "In Cart" : "Add to Cart"}</span>
                    </button>

                    {/* Bookmark Save */}
                    <button
                      onClick={() => handleUpdateStatus(selectedItem.id, selectedItem.status === "saved" ? "draft" : "saved")}
                      className={`p-2 rounded-lg border transition active:scale-95 ${
                        selectedItem.status === "saved"
                          ? "bg-amber-500 text-white border-amber-400"
                          : "bg-stone-800 hover:bg-stone-750 border-stone-700 text-stone-300"
                      }`}
                      title="Save / Bookmark Item"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                    </button>

                    {/* Cancel Item (✗) */}
                    <button
                      onClick={() => handleDeleteItem(selectedItem.id)}
                      className="p-2 bg-stone-800 hover:bg-red-950/60 border border-stone-700 hover:border-red-900/40 text-stone-400 hover:text-red-400 rounded-lg transition active:scale-95"
                      title="Cancel & Delete Placement"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Placed items list fallback */
              <div className="space-y-4">
                <div className="bg-stone-900/40 border border-stone-850/60 rounded-xl p-4 flex items-center gap-3">
                  <Info className="w-4 h-4 text-amber-500 shrink-0" />
                  <p className="text-[11px] text-stone-300 leading-normal">
                    <strong>Tip:</strong> Tap on any empty floor, wall, or tabletop area in the room feed above. Gemini AI will instantly suggest and place an optimized interior decor item.
                  </p>
                </div>

                <div>
                  <h3 className="text-[10px] uppercase tracking-wider font-extrabold text-stone-500 mb-2">
                    Placed Room Elements ({placedItems.length})
                  </h3>
                  <PlacedItemsList 
                    items={placedItems}
                    onUpdateStatus={handleUpdateStatus}
                    onDeleteItem={handleDeleteItem}
                    onSelectItem={(item) => setSelectedItemId(item.id)}
                    selectedItemId={selectedItemId}
                  />
                </div>
              </div>
            )}

            {customUploadError && (
              <div className="mt-3 flex items-center gap-2 bg-red-950/40 border border-red-900/40 text-red-300 px-3 py-2 rounded-xl text-xs animate-fade-in">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{customUploadError}</span>
              </div>
            )}
          </div>

          {/* Hand annotated: Collapsible BOTTOM side-panel containing Text Box Chat & Sketch Pad */}
          <div className="absolute bottom-0 left-0 right-0 z-30 bg-stone-950 border-t border-stone-850">
            {panelOpen ? (
              <div className="bg-stone-950 border-x border-stone-850/80 p-3 shadow-2xl transition-all duration-300">
                
                {/* Panel Header & Toggles */}
                <div className="flex items-center justify-between border-b border-stone-900 pb-2.5 mb-2.5">
                  <div className="flex items-center gap-1.5 bg-stone-900 p-0.5 rounded-lg border border-stone-800">
                    <button
                      onClick={() => setPanelTab("chat")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        panelTab === "chat" 
                          ? "bg-amber-500 text-stone-950 shadow" 
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      <MessageSquare className="w-3 h-3" />
                      Text Chat
                    </button>
                    <button
                      onClick={() => setPanelTab("sketch")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                        panelTab === "sketch" 
                          ? "bg-amber-500 text-stone-950 shadow" 
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      <Palette className="w-3 h-3" />
                      Sketch Pad
                    </button>
                  </div>

                  {/* Right side: Expand / Collapse Arrow (sketched as ">" or "v") */}
                  <div className="flex items-center gap-3">
                    
                    {/* Hand annotated: "IMAGE UPLOAD" Arrow ⇧ button directly in the side panel header area */}
                    <label className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-300 px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition active:scale-95" title="Upload custom item photo">
                      <Upload className="w-3 h-3 text-amber-500" />
                      <span>Upload Item ⇧</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleItemImageUpload} 
                        className="hidden" 
                      />
                    </label>

                    <button
                      onClick={() => setPanelOpen(false)}
                      className="p-1 text-stone-400 hover:text-white bg-stone-900 rounded-md transition border border-stone-850"
                      title="Collapse Panel"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-panel content size restricted to match 50/50 horizontal split cleanly */}
                <div className="h-[185px] min-h-[185px]">
                  {panelTab === "chat" ? (
                    <ChatBox 
                      placedItems={placedItems}
                      roomStyle={roomStyle}
                      spaceType={spaceType}
                    />
                  ) : (
                    <SketchPad onAnalyzeComplete={handleAnalyzeComplete} />
                  )}
                </div>
              </div>
            ) : (
              /* Micro-header when collapsed */
              <button
                onClick={() => setPanelOpen(true)}
                className="w-full flex items-center justify-between bg-stone-900 hover:bg-stone-850 text-xs px-4 py-3.5 transition duration-200 active:scale-[0.99] shadow-inner font-bold"
              >
                <div className="flex items-center gap-2 text-stone-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>Text Box / Sketch Pad Side Panel</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                  <span className="font-semibold text-stone-500">Tap to expand</span>
                  <ChevronUp className="w-4 h-4" />
                </div>
              </button>
            )}
          </div>

        </section>
      </div>
    </div>
  );
}
