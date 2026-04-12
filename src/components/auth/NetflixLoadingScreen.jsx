import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from "@/lib/theme";

export default function NetflixLoadingScreen({ onComplete }) {
  const [visible, setVisible] = useState(true);
  const [typedText, setTypedText] = useState("");
  const { themeDefinition } = useAppTheme();
  const brand = themeDefinition.wordmark;
  const isHulu = themeDefinition.loadingVariant === "hulu";

  useEffect(() => {
    if (isHulu) {
      const fadeTimer = window.setTimeout(() => setVisible(false), 950);
      const completeTimer = window.setTimeout(() => onComplete?.(), 1300);

      return () => {
        window.clearTimeout(fadeTimer);
        window.clearTimeout(completeTimer);
      };
    }

    const letters = brand.split("");
    let index = 0;

    const typingTimer = window.setInterval(() => {
      index += 1;
      setTypedText(letters.slice(0, index).join(""));
      if (index >= letters.length) {
        window.clearInterval(typingTimer);
      }
    }, 100);

    const fadeTimer = window.setTimeout(() => setVisible(false), 1500);
    const completeTimer = window.setTimeout(() => onComplete?.(), 1850);

    return () => {
      window.clearInterval(typingTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(completeTimer);
    };
  }, [brand, isHulu, onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[var(--app-bg)]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {isHulu ? (
            <div className="flex flex-col items-center gap-6">
              <motion.div
                className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-6 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/55"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Loading
              </motion.div>
              <motion.div
                className="select-none text-[var(--brand)]"
                style={{
                  fontSize: "clamp(3rem, 9vw, 5.5rem)",
                  fontWeight: 800,
                  textShadow: "0 0 48px color-mix(in srgb, var(--brand) 32%, transparent)",
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
              >
                {brand}
              </motion.div>
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    className="h-1.5 w-10 rounded-full bg-[var(--brand)]"
                    animate={{ opacity: [0.2, 1, 0.2], scaleX: [0.84, 1, 0.84] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.14, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5">
              <motion.div
                className="select-none font-black text-[var(--brand)]"
                style={{
                  fontSize: "clamp(3rem, 10vw, 7rem)",
                  textShadow: "0 0 80px color-mix(in srgb, var(--brand) 45%, transparent)",
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
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
