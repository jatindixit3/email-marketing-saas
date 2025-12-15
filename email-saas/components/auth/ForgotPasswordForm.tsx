"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword } from "@/app/auth/actions";
import { Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    const result = await resetPassword(formData);

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
            If an account exists for <strong>{email}</strong>, you'll receive password reset instructions.
          </p>
        </div>

        <Alert>
          <AlertDescription>
            Please check your email and follow the instructions to reset your password.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <p className="text-sm text-gray-400">
          Enter your email address and we'll send you instructions to reset your password.
        </p>
      </div>

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
      </div>

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
        {loading ? "Sending..." : "Send reset instructions"}
      </Button>

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </form>
  );
}
