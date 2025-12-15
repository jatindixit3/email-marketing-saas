import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength =
    passedChecks === 0
      ? "none"
      : passedChecks <= 2
      ? "weak"
      : passedChecks === 3
      ? "medium"
      : "strong";

  const strengthColors = {
    none: "bg-gray-600",
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const strengthText = {
    none: "",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Strength Bar */}
      {password.length > 0 && (
        <div>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all",
                  i <= passedChecks
                    ? strengthColors[strength]
                    : "bg-white/10"
                )}
              />
            ))}
          </div>
          <p
            className={cn(
              "text-xs font-medium",
              strength === "weak" && "text-red-400",
              strength === "medium" && "text-yellow-400",
              strength === "strong" && "text-green-400"
            )}
          >
            {strengthText[strength]}
          </p>
        </div>
      )}

      {/* Criteria List */}
      <div className="space-y-1">
        <CriteriaItem met={checks.length} text="At least 8 characters" />
        <CriteriaItem met={checks.uppercase} text="Contains uppercase letter" />
        <CriteriaItem met={checks.number} text="Contains number" />
        <CriteriaItem met={checks.special} text="Contains special character" />
      </div>
    </div>
  );
}

function CriteriaItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <Check className="h-3 w-3 text-green-400" />
      ) : (
        <X className="h-3 w-3 text-gray-500" />
      )}
      <span className={cn("text-xs", met ? "text-green-400" : "text-gray-500")}>
        {text}
      </span>
    </div>
  );
}
