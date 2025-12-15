import Link from "next/link";
import { Mail, Rocket, CheckCircle, Lock } from "lucide-react";
import { SignUpForm } from "@/components/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-teal-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Instructions */}
          <div className="hidden lg:block">
            {/* Logo */}
            <Link href="/" className="flex items-center mb-8">
              <Mail className="h-10 w-10 text-teal-400" />
              <span className="ml-2 text-2xl font-bold text-white">YourName</span>
            </Link>

            <h1 className="text-4xl font-bold text-white mb-4">
              Create Your Free Account
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Start your email marketing journey in just 60 seconds. No credit card required.
            </p>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Enter Your Email</h3>
                  <p className="text-gray-400 text-sm">
                    Use a valid email address you have access to. You'll need to verify it to access all features.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Lock className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Create a Strong Password</h3>
                  <p className="text-gray-400 text-sm">
                    Choose a password with at least 8 characters. Mix letters, numbers, and symbols for maximum security.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Rocket className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Start Using Immediately</h3>
                  <p className="text-gray-400 text-sm">
                    After signing up, you'll be redirected to your dashboard where you can start creating campaigns right away.
                  </p>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div className="mt-8 p-6 rounded-lg bg-gray-900/50 border border-gray-800">
              <h3 className="font-semibold text-white mb-3">What You Get for Free:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Up to 500 contacts</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Unlimited campaigns</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Email templates & drag-and-drop builder</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                  <span>Campaign analytics & reporting</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right side - Sign Up Form */}
          <div>
            {/* Mobile logo */}
            <Link href="/" className="flex lg:hidden items-center justify-center mb-8">
              <Mail className="h-10 w-10 text-teal-400" />
              <span className="ml-2 text-2xl font-bold text-white">YourName</span>
            </Link>

            {/* Card */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-white/5">
              <div className="rounded-2xl bg-black/40 backdrop-blur-xl p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 rounded-2xl pointer-events-none"></div>

                <div className="relative z-10">
                  <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
                  <p className="text-gray-400 mb-6">Get started for free - no credit card required</p>

                  <SignUpForm />

                  {/* Mobile what you get */}
                  <div className="lg:hidden mt-6 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                    <p className="text-xs font-semibold text-white mb-2">Free Plan Includes:</p>
                    <ul className="space-y-1">
                      <li className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle className="h-3 w-3 text-teal-400 flex-shrink-0" />
                        <span>500 contacts</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle className="h-3 w-3 text-teal-400 flex-shrink-0" />
                        <span>Unlimited campaigns</span>
                      </li>
                      <li className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle className="h-3 w-3 text-teal-400 flex-shrink-0" />
                        <span>Templates & analytics</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
