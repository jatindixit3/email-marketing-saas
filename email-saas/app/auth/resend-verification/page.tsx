"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resendVerification } from "@/app/auth/actions";

export default function ResendVerificationPage() {
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

    const result = await resendVerification(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-teal-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          <Mail className="h-10 w-10 text-teal-400" />
          <span className="ml-2 text-2xl font-bold text-white">SendBear</span>
        </Link>

        {/* Card */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-white/5">
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 rounded-2xl pointer-events-none"></div>

            <div className="relative z-10">
              {success ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
                      <Mail className="h-6 w-6 text-teal-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Check your email
                    </h1>
                    <p className="text-gray-400">
                      We've sent a new verification link to <strong>{email}</strong>
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Please check your email and click the verification link to activate your account.
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
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Resend verification email
                  </h1>
                  <p className="text-gray-400 mb-6">
                    Enter your email to receive a new verification link
                  </p>

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
                      {loading ? "Sending..." : "Resend verification email"}
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
