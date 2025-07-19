import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  size = "md",
  className,
  showText = true,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("flex-shrink-0", sizeClasses[size])}>
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient
              id="shieldGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#3B82F6", stopOpacity: 1 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#1D4ED8", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#1E40AF", stopOpacity: 1 }}
              />
            </linearGradient>
            <linearGradient
              id="crossGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#10B981", stopOpacity: 1 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#059669", stopOpacity: 1 }}
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle with gradient */}
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="url(#shieldGradient)"
            stroke="#1E40AF"
            strokeWidth="2"
          />

          {/* Shield shape */}
          <path
            d="M100 30 L140 50 L140 120 C140 150 100 170 100 170 C100 170 60 150 60 120 L60 50 Z"
            fill="none"
            stroke="white"
            strokeWidth="3"
            opacity="0.9"
          />

          {/* Medical cross */}
          <rect
            x="85"
            y="70"
            width="30"
            height="8"
            rx="4"
            fill="url(#crossGradient)"
            filter="url(#glow)"
          />
          <rect
            x="96"
            y="59"
            width="8"
            height="30"
            rx="4"
            fill="url(#crossGradient)"
            filter="url(#glow)"
          />

          {/* Blockchain nodes */}
          <circle cx="70" cy="80" r="4" fill="#F59E0B" opacity="0.8" />
          <circle cx="130" cy="80" r="4" fill="#F59E0B" opacity="0.8" />
          <circle cx="70" cy="120" r="4" fill="#F59E0B" opacity="0.8" />
          <circle cx="130" cy="120" r="4" fill="#F59E0B" opacity="0.8" />

          {/* Connecting lines */}
          <line
            x1="74"
            y1="80"
            x2="126"
            y2="80"
            stroke="#F59E0B"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1="74"
            y1="120"
            x2="126"
            y2="120"
            stroke="#F59E0B"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1="70"
            y1="84"
            x2="70"
            y2="116"
            stroke="#F59E0B"
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1="130"
            y1="84"
            x2="130"
            y2="116"
            stroke="#F59E0B"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* DrugShield text */}
          {showText && (
            <text
              x="100"
              y="155"
              textAnchor="middle"
              fill="white"
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fontWeight="bold"
            >
              DrugShield
            </text>
          )}

          {/* Safety indicator dots */}
          <circle cx="85" cy="140" r="2" fill="#10B981" />
          <circle cx="95" cy="140" r="2" fill="#10B981" />
          <circle cx="105" cy="140" r="2" fill="#10B981" />
          <circle cx="115" cy="140" r="2" fill="#10B981" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-900 dark:text-white">
            DrugShield
          </span>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Secure Drug Verification
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
