import Link from "next/link";
import { Mail, Shield, CheckCircle } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
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
              Sign in to Your Account
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Access your email marketing dashboard and manage your campaigns.
            </p>

            {/* Instructions */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Enter Your Credentials</h3>
                  <p className="text-gray-400 text-sm">
                    Use the email and password you created when signing up. Make sure to enter them exactly as you registered.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Shield className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Secure Authentication</h3>
                  <p className="text-gray-400 text-sm">
                    Your account is protected with industry-standard encryption. All data is transmitted securely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-teal-600/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Don't Have an Account?</h3>
                  <p className="text-gray-400 text-sm">
                    Click the "Sign up" link below the login form to create a free account. It only takes a minute!
                  </p>
                </div>
              </div>
            </div>

            {/* Help text */}
            <div className="mt-8 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
              <p className="text-sm text-gray-400">
                <span className="font-semibold text-teal-400">Forgot your password?</span> Click the "Forgot password?" link in the login form to reset it via email.
              </p>
            </div>
          </div>

          {/* Right side - Login Form */}
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
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                  <p className="text-gray-400 mb-6">Sign in to access your dashboard</p>

                  <LoginForm />

                  {/* Mobile instructions */}
                  <div className="lg:hidden mt-6 p-4 rounded-lg bg-gray-900/50 border border-gray-800">
                    <p className="text-xs text-gray-400 text-center">
                      ⚠️ All dashboard features require authentication. You must be signed in to create campaigns, manage contacts, or access templates.
                    </p>
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
