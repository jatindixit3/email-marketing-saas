"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const verifyEmail = async () => {
      const supabase = createClient();

      // Get the token from URL
      const token_hash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (!token_hash || type !== "email") {
        setStatus("error");
        return;
      }

      // Verify the token
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: "email",
      });

      if (error) {
        setStatus("error");
      } else {
        setStatus("success");
      }
    };

    verifyEmail();
  }, [searchParams]);

  useEffect(() => {
    if (status === "success" && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (status === "success" && countdown === 0) {
      router.push("/dashboard");
    }
  }, [status, countdown, router]);

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
          <span className="ml-2 text-2xl font-bold text-white">YourName</span>
        </Link>

        {/* Card */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-white/5">
          <div className="rounded-2xl bg-black/40 backdrop-blur-xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 rounded-2xl pointer-events-none"></div>

            <div className="relative z-10">
              {status === "loading" && (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 text-teal-400 animate-spin mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Verifying your email
                  </h1>
                  <p className="text-gray-400">Please wait...</p>
                </div>
              )}

              {status === "success" && (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Email verified!
                    </h1>
                    <p className="text-gray-400">
                      Redirecting to dashboard in {countdown} seconds...
                    </p>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Your account has been successfully verified. You can now access all features.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => router.push("/dashboard")}
                    className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                      Verification failed
                    </h1>
                    <p className="text-gray-400">
                      The verification link is invalid or has expired.
                    </p>
                  </div>

                  <Alert variant="destructive">
                    <AlertDescription>
                      Please request a new verification email to continue.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push("/auth/resend-verification")}
                      className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold"
                    >
                      Resend verification email
                    </Button>

                    <Link
                      href="/auth/login"
                      className="block text-center text-sm text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      ← Back to login
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
