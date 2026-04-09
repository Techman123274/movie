import { useNavigate } from "react-router-dom";
import { Key, X } from "lucide-react";
import { useState } from "react";

export default function NoApiKeyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[calc(100%-2rem)]">
      <div className="bg-[#1a0a0a] border border-[#E50914]/40 rounded-lg p-4 shadow-2xl flex items-start gap-3">
        <Key className="w-5 h-5 text-[#E50914] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold mb-0.5">TMDB Connection Needed</p>
          <p className="text-gray-400 text-xs leading-relaxed">
            Open Settings to add a TMDB key for this browser and unlock the catalog.
          </p>
          <button
            onClick={() => navigate("/settings")}
            className="mt-2 text-[#E50914] hover:text-red-400 text-xs font-semibold transition-colors underline"
          >
            Open Settings
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-600 hover:text-gray-400 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
