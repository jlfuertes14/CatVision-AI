"use client";

import React from 'react';

/**
 * LoadingState — Animated cat loading indicator.
 */
export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-8 font-sans selection:bg-amber-500/30">
      <style>
        {`
          /* Animation Keyframes */
          @keyframes cat-paw-strike {
            0%, 10%, 30%, 100% { transform: translateX(0); }
            14%, 22% { transform: translateX(4px); }
          }
          
          @keyframes cat-yarn-roll {
            0%, 12%, 100% { transform: translateX(0) rotate(0deg); }
            16% { transform: translateX(14px) translateY(-2px) rotate(180deg); } /* Initial pop/bounce */
            20%, 35% { transform: translateX(12px) translateY(0) rotate(180deg); } /* Settle */
            55% { transform: translateX(0) rotate(0deg); } /* Roll back */
          }
          
          @keyframes cat-yarn-shadow {
            0%, 12%, 100% { transform: translateX(0) scaleX(1); }
            16% { transform: translateX(14px) scaleX(1.2); opacity: 0.1; }
            20%, 35% { transform: translateX(12px) scaleX(1); opacity: 0.2; }
            55% { transform: translateX(0) scaleX(1); }
          }

          @keyframes cat-tail-swish {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(-8deg); }
          }

          @keyframes cat-blink {
            0%, 42%, 46%, 82%, 86%, 100% { transform: scaleY(1); }
            44%, 84% { transform: scaleY(0.1); }
          }

          @keyframes loading-dots {
            0% { content: ''; }
            25% { content: '.'; }
            50% { content: '..'; }
            75% { content: '...'; }
            100% { content: ''; }
          }

          /* Class Assignments */
          .anim-paw {
            animation: cat-paw-strike 3s ease-in-out infinite;
          }
          .anim-yarn {
            animation: cat-yarn-roll 3s ease-in-out infinite;
            transform-origin: 28px 24px;
          }
          .anim-yarn-shadow {
            animation: cat-yarn-shadow 3s ease-in-out infinite;
          }
          .anim-tail {
            animation: cat-tail-swish 3s ease-in-out infinite;
            transform-origin: 4px 26px;
          }
          .anim-eyes {
            animation: cat-blink 3s linear infinite;
            transform-origin: 14px 11px;
          }
          .anim-dots::after {
            content: '';
            animation: loading-dots 2s infinite;
            display: inline-block;
            width: 1.5em;
            text-align: left;
          }
        `}
      </style>

      {/* Main Pixel Art Container */}
      <div className="relative w-48 h-auto transition-all duration-300">
        <svg 
          viewBox="0 0 48 32" 
          xmlns="http://www.w3.org/2000/svg" 
          shapeRendering="crispEdges"
          className="w-full h-full drop-shadow-sm"
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Shadows */}
          <rect x="2" y="27" width="16" height="1" fill="rgba(0,0,0,0.15)" />
          <rect x="25" y="27" width="6" height="1" fill="rgba(0,0,0,0.15)" className="anim-yarn-shadow" />

          {/* CAT TAIL */}
          <g className="anim-tail">
            <rect x="2" y="19" width="3" height="8" fill="#d97706" /> {/* Darker amber for better contrast */}
            <rect x="1" y="16" width="2" height="3" fill="#d97706" />
            <rect x="0" y="14" width="2" height="2" fill="#fef3c7" /> {/* White tip */}
          </g>

          {/* CAT BODY (Rounded) */}
          <rect x="8" y="16" width="9" height="1" fill="#d97706" />
          <rect x="7" y="17" width="10" height="1" fill="#d97706" />
          <rect x="5" y="18" width="12" height="9" fill="#d97706" />
          
          {/* Back Paw */}
          <rect x="5" y="25" width="3" height="2" fill="#fef3c7" />
          
          {/* Belly & Chest */}
          <rect x="13" y="17" width="4" height="10" fill="#fef3c7" />

          {/* Front Resting Paw */}
          <rect x="13" y="25" width="4" height="2" fill="#fef3c7" />

          {/* CAT HEAD (Rounded) */}
          <rect x="10" y="7" width="8" height="1" fill="#d97706" />
          <rect x="9" y="8" width="10" height="1" fill="#d97706" />
          <rect x="8" y="9" width="12" height="6" fill="#d97706" />
          <rect x="9" y="15" width="10" height="1" fill="#d97706" />

          {/* Stripes */}
          <rect x="9" y="7" width="2" height="1" fill="#b45309" />
          <rect x="13" y="7" width="2" height="1" fill="#b45309" />
          <rect x="17" y="7" width="1" height="1" fill="#b45309" />
          <rect x="6" y="20" width="3" height="1" fill="#b45309" />
          <rect x="6" y="22" width="4" height="1" fill="#b45309" />

          {/* Ears */}
          <rect x="10" y="4" width="1" height="1" fill="#d97706" />
          <rect x="9" y="5" width="3" height="2" fill="#d97706" />
          <rect x="10" y="6" width="1" height="1" fill="#f472b6" /> {/* Pink inner */}

          <rect x="17" y="4" width="1" height="1" fill="#d97706" />
          <rect x="16" y="5" width="3" height="2" fill="#d97706" />
          <rect x="17" y="6" width="1" height="1" fill="#f472b6" /> {/* Pink inner */}

          {/* Face Details */}
          <g className="anim-eyes">
            {/* Left Eye */}
            <rect x="10" y="10" width="2" height="2" fill="#ffffff" />
            <rect x="11" y="10" width="1" height="2" fill="#0f172a" />
            {/* Right Eye */}
            <rect x="16" y="10" width="2" height="2" fill="#ffffff" />
            <rect x="17" y="10" width="1" height="2" fill="#0f172a" />
          </g>

          {/* Nose */}
          <rect x="14" y="13" width="1" height="1" fill="#f43f5e" />

          {/* Whiskers */}
          <rect x="4" y="12" width="3" height="1" fill="#475569" opacity="0.4" />
          <rect x="3" y="14" width="4" height="1" fill="#475569" opacity="0.4" />
          <rect x="21" y="12" width="3" height="1" fill="#475569" opacity="0.4" />
          <rect x="21" y="14" width="4" height="1" fill="#475569" opacity="0.4" />

          {/* BATTING PAW (Animated) */}
          <g className="anim-paw">
            <rect x="15" y="21" width="5" height="2" fill="#d97706" />
            <rect x="20" y="21" width="3" height="2" fill="#fef3c7" />
          </g>

          {/* YARN BALL (Animated) */}
          <g className="anim-yarn">
            {/* Base Cross Shape */}
            <rect x="26" y="21" width="4" height="6" fill="#059669" /> {/* Emerald 600 */}
            <rect x="25" y="22" width="6" height="4" fill="#059669" />
            
            {/* Yarn Texture Details */}
            <rect x="26" y="22" width="2" height="2" fill="#34d399" /> {/* Highlight */}
            <rect x="29" y="25" width="1" height="1" fill="#047857" /> {/* Shadow */}
            <rect x="25" y="24" width="1" height="1" fill="#047857" /> {/* Shadow */}
            <rect x="28" y="22" width="1" height="1" fill="#047857" /> {/* Thread line */}
            <rect x="27" y="25" width="1" height="1" fill="#34d399" /> {/* Thread line */}
          </g>
        </svg>
      </div>

      {/* Loading Typography */}
      <div className="mt-6 text-xl sm:text-2xl font-black tracking-widest text-cafe-brown flex items-center gap-2">
        <span>PURR-CESSING</span>
        <span className="anim-dots font-mono text-cafe-orange"></span>
      </div>
      <p className="text-cafe-brown/70 text-sm mt-1 font-medium tracking-wide">
        Analyzing whiskers...
      </p>
    </div>
  );
}
