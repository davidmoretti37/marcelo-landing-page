"use client";

const STEPS = ["Routes", "Passengers", "Budget", "Results"] as const;

interface StepProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepProgress({ currentStep, onStepClick }: StepProgressProps) {
  return (
    <div className="relative flex items-center justify-between w-full">
      {/* Track line */}
      <div
        className="absolute top-[10px] left-0 right-0 h-[1px]"
        style={{ background: "var(--sr-border)" }}
      />

      {/* Gold progress fill */}
      <div
        className="absolute top-[10px] left-0 h-[1px] transition-all duration-500 ease-out"
        style={{
          background: "var(--sr-gold)",
          width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
        }}
      />

      {/* Step dots */}
      {STEPS.map((label, index) => {
        const isPast = index < currentStep;
        const isCurrent = index === currentStep;
        const isFuture = index > currentStep;
        const isClickable = isPast;

        return (
          <button
            key={label}
            onClick={() => isClickable && onStepClick(index)}
            disabled={!isClickable}
            className="relative flex flex-col items-center gap-2 z-10"
            style={{
              cursor: isClickable ? "pointer" : "default",
            }}
          >
            {/* Glow ring for current step */}
            {isCurrent && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full animate-pulse"
                style={{
                  background: "var(--sr-gold)",
                  opacity: 0.2,
                  filter: "blur(4px)",
                }}
              />
            )}

            {/* Dot */}
            <div
              className="w-5 h-5 rounded-full border-2 transition-all duration-300 flex items-center justify-center"
              style={{
                borderColor: isFuture
                  ? "var(--sr-text-dim)"
                  : "var(--sr-gold)",
                background: isPast || isCurrent
                  ? "var(--sr-gold)"
                  : "var(--sr-bg)",
                boxShadow: isCurrent
                  ? "0 0 12px rgba(200,164,78,0.4)"
                  : "none",
              }}
            >
              {/* Checkmark for past steps */}
              {isPast && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--sr-bg)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}

              {/* Inner dot for current step */}
              {isCurrent && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--sr-bg)" }}
                />
              )}
            </div>

            {/* Label */}
            <span
              className="text-[10px] md:text-xs tracking-wider uppercase whitespace-nowrap"
              style={{
                color: isFuture
                  ? "var(--sr-text-dim)"
                  : isCurrent
                    ? "var(--sr-gold)"
                    : "var(--sr-text-muted)",
                fontFamily: "var(--font-dm-sans)",
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
