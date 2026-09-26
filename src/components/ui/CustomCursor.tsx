"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const TRAIL_LENGTH = 28;

export function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Smooth trailing ring
  const ringX = useMotionValue(-100);
  const ringY = useMotionValue(-100);
  const springX = useSpring(ringX, { stiffness: 150, damping: 20, mass: 0.5 });
  const springY = useSpring(ringY, { stiffness: 150, damping: 20, mass: 0.5 });

  // Instant dot
  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
    };

    const onMouseDown = () => setClicked(true);
    const onMouseUp = () => setClicked(false);

    const onHoverStart = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("a, button, [role='button'], input, textarea, select, label, .cursor-pointer")) {
        setHovered(true);
      } else {
        setHovered(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseover", onHoverStart);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseover", onHoverStart);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dotX, dotY, ringX, ringY]);

  return (
    <>
      {/* Trailing Ring */}
      <motion.div
        animate={{
          scale: hovered ? 1.5 : clicked ? 0.8 : 1,
          opacity: hovered ? 0.3 : 0.5,
        }}
        transition={{ scale: { type: "spring", stiffness: 300, damping: 20 } }}
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-8 h-8 rounded-full border-[1.5px] border-[#0052FF]"
        style={{
          x: springX,
          y: springY,
          translateX: "-50%",
          translateY: "-50%",
          backgroundColor: hovered ? "rgba(0,82,255,0.05)" : "transparent",
        }}
      />

      {/* Solid Center Dot */}
      <motion.div
        animate={{
          scale: hovered ? 0 : clicked ? 0.5 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="fixed top-0 left-0 z-[9999] pointer-events-none w-1.5 h-1.5 rounded-full bg-[#0052FF]"
        style={{
          x: dotX,
          y: dotY,
          translateX: "-50%",
          translateY: "-50%",
        }}
      />
    </>
  );
}
