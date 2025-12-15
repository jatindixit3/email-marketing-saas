import Link from "next/link";
import { Mail } from "lucide-react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
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
              <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
              <p className="text-gray-400 mb-6">Enter your new password below</p>

              <ResetPasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
