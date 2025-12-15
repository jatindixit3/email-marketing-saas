"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { signUp } from "@/app/auth/actions";
import { Eye, EyeOff, Mail } from "lucide-react";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      errors.password = "Password must contain an uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      errors.password = "Password must contain a number";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.password = "Password must contain a special character";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!acceptedTerms) {
      errors.terms = "You must accept the terms and conditions";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    const result = await signUp(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Check your email
          </h2>
          <p className="text-gray-400">
            We've sent a verification link to <strong>{email}</strong>
          </p>
        </div>

        <Alert>
          <AlertDescription>
            Please check your email and click the verification link to activate your
            account. You can close this window.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <p className="text-sm text-gray-400">
            Didn't receive the email?{" "}
            <Link
              href="/auth/resend-verification"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Resend verification email
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-400">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-red-400">{fieldErrors.password}</p>
        )}
        {password && <PasswordStrengthIndicator password={password} />}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms((e.target as HTMLInputElement).checked)}
          disabled={loading}
        />
        <Label htmlFor="terms" className="text-sm font-normal leading-tight cursor-pointer">
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-teal-400 hover:text-teal-300 transition-colors"
          >
            Terms and Conditions
          </Link>
        </Label>
      </div>
      {fieldErrors.terms && (
        <p className="text-xs text-red-400">{fieldErrors.terms}</p>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold"
        disabled={loading}
      >
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-400">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-teal-400 hover:text-teal-300 transition-colors font-medium"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
