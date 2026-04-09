import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NetflixLoadingScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [typedText, setTypedText] = useState("");
  const brand = "SUBFLIX";

  useEffect(() => {
    const letters = brand.split("");
    let index = 0;

    const typingTimer = window.setInterval(() => {
      index += 1;
      setTypedText(letters.slice(0, index).join(""));
      if (index >= letters.length) {
        window.clearInterval(typingTimer);
      }
    }, 140);

    const fadeTimer = window.setTimeout(() => setVisible(false), 2200);
    const completeTimer = window.setTimeout(() => onComplete?.(), 2650);

    return () => {
      window.clearInterval(typingTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="flex flex-col items-center gap-5">
            <motion.div
              className="text-[#E50914] font-black select-none"
              style={{
                fontSize: "clamp(3rem, 10vw, 7rem)",
                letterSpacing: "-0.02em",
                textShadow: "0 0 80px rgba(229,9,20,0.4)",
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {typedText}
              <motion.span
                className="inline-block ml-1 text-white/80"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
              >
                |
              </motion.span>
            </motion.div>

            <motion.p
              className="text-xs uppercase tracking-[0.45em] text-white/35"
              initial={{ opacity: 0 }}
              animate={{ opacity: typedText.length === brand.length ? 1 : 0 }}
            >
              Loading Profiles
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
