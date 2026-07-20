import React from "react";
import { Check, X, Bookmark, Sofa, Lamp, Leaf, Footprints, Image as ImageIcon, Sparkles, HeartHandshake, Package } from "lucide-react";
import { PlacedItem } from "../types";

interface PlacedItemsListProps {
  items: PlacedItem[];
  onUpdateStatus: (id: string, status: "cart" | "saved" | "draft") => void;
  onDeleteItem: (id: string) => void;
  onSelectItem: (item: PlacedItem) => void;
  selectedItemId: string | null;
}

// Map key names to Lucide icons
const getCategoryIcon = (iconName: string) => {
  switch (iconName?.toLowerCase()) {
    case "sofa":
    case "armchair":
      return <Sofa className="w-4 h-4" />;
    case "lamp":
    case "lighting":
      return <Lamp className="w-4 h-4" />;
    case "flower":
    case "plant":
    case "shrub":
      return <Leaf className="w-4 h-4" />;
    case "image":
    case "decor":
      return <ImageIcon className="w-4 h-4" />;
    case "footprints":
      return <Footprints className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

export const PlacedItemsList: React.FC<PlacedItemsListProps> = ({
  items,
  onUpdateStatus,
  onDeleteItem,
  onSelectItem,
  selectedItemId
}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-stone-500 bg-stone-900/40 rounded-xl border border-stone-800/60 border-dashed h-48">
        <Sparkles className="w-7 h-7 text-stone-600 mb-2 animate-pulse" />
        <p className="text-xs font-semibold text-stone-400">No placed items yet</p>
        <p className="text-[11px] text-stone-500 max-w-xs mt-1 leading-relaxed">
          Tap spots on the live room camera above to place custom AI furniture or draft design accessories!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
      {items.map((item) => {
        const isSelected = selectedItemId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              isSelected
                ? "bg-stone-800 border-amber-500/80 shadow-md ring-1 ring-amber-500/30"
                : "bg-stone-900 hover:bg-stone-850 border-stone-800/80"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Icon & Details */}
              <div className="flex items-start gap-3 flex-1">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected 
                    ? "bg-amber-500/20 text-amber-400" 
                    : item.status === "cart"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : item.status === "saved"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-stone-800 text-stone-300"
                }`}>
                  {getCategoryIcon(item.iconType)}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-stone-200">{item.name}</h4>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      item.status === "cart"
                        ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900/30"
                        : item.status === "saved"
                        ? "bg-rose-950/50 text-rose-400 border border-rose-900/30"
                        : "bg-stone-800 text-stone-400"
                    }`}>
                      {item.status === "cart" ? "Added to Cart" : item.status === "saved" ? "Saved Idea" : "Room Placement"}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Meta Details */}
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-stone-500 pt-1 font-mono">
                    <span>Material: <strong className="text-stone-400">{item.material}</strong></span>
                    <span>•</span>
                    <span>Dimensions: <strong className="text-stone-400">{item.dimensions}</strong></span>
                    <span>•</span>
                    <span>Color: <strong className="text-stone-400">{item.color}</strong></span>
                  </div>
                </div>
              </div>

              {/* Price Tag & Action CTAs */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-1">
                <div className="text-sm font-extrabold text-amber-500 font-mono">
                  ${item.price}
                </div>

                {/* 3 Icons Required: Tick, X, Save */}
                <div className="flex items-center gap-1 mt-3">
                  {/* Save/Bookmark Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(item.id, item.status === "saved" ? "draft" : "saved");
                    }}
                    title={item.status === "saved" ? "Remove Bookmark" : "Save / Bookmark Item"}
                    className={`p-1.5 rounded-lg border transition ${
                      item.status === "saved"
                        ? "bg-rose-950/50 hover:bg-rose-900/40 border-rose-800 text-rose-400"
                        : "bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-400 hover:text-stone-200"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current opacity-90" />
                  </button>

                  {/* Tick/Checkmark Icon: Add to Cart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(item.id, item.status === "cart" ? "draft" : "cart");
                    }}
                    title={item.status === "cart" ? "Remove from Cart" : "Add to Cart / Tick"}
                    className={`p-1.5 rounded-lg border transition ${
                      item.status === "cart"
                        ? "bg-emerald-950/50 hover:bg-emerald-900/40 border-emerald-800 text-emerald-400"
                        : "bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-400 hover:text-emerald-400"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  {/* Cancel/Remove Icon: Delete Placement */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                    title="Remove Placement / Delete"
                    className="p-1.5 bg-stone-800 hover:bg-red-950/40 border border-stone-700 hover:border-red-900/60 text-stone-400 hover:text-red-400 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
