"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Mail,
  ChevronDown,
  ChevronUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

export default function LandingPageDark() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePricingClick = (planName: string) => {
    // Route to signup with plan pre-selected
    window.location.href = `/auth/signup?plan=${planName.toLowerCase()}`;
  };

  return (
    <>
      {/* Load Spline Viewer */}
      <Script
        type="module"
        src="https://unpkg.com/@splinetool/viewer@1.12.16/build/spline-viewer.js"
        strategy="beforeInteractive"
      />

      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-teal-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>

        {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center">
              <Mail className="h-8 w-8 text-teal-400" />
              <span className="ml-2 text-xl font-bold text-white">
                SendBear
              </span>
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                Features
              </a>
              <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <a href="#faq" className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </a>
              <Link href="/auth/login">
                <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-0">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

        <div className="relative z-10">
          {/* Hero Section with HeroGeometric */}
          <HeroGeometric
            badge="10x Cheaper Than Mailchimp"
            title1="Email Marketing That"
            title2="Doesn't Bite"
          />

          {/* Testimonials Section */}
          <section className="pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

            {/* Testimonials - Glass Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  text: "We saved thousands switching to SendBear. Best decision ever.",
                  name: "Alex K., Founder",
                },
                {
                  text: "SendBear is incredibly simple yet powerful. Love it!",
                  name: "Sarah M., Marketing Director",
                },
                {
                  text: "Finally, email marketing that doesn't break the bank.",
                  name: "Masa K., Founder",
                },
              ].map((testimonial, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-300">
                  <p className="text-gray-300 mb-3 text-sm">{testimonial.text}</p>
                  <p className="text-white font-medium text-sm">- {testimonial.name}</p>
                </div>
              ))}
            </div>

            {/* Comparison Cards - Liquid Glass */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* SendBear Card */}
              <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-teal-400 via-teal-500 to-purple-500 shadow-2xl shadow-teal-500/50">
                <div className="h-full rounded-2xl p-6 bg-gradient-to-br from-teal-500/10 via-black to-purple-500/10 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>

                  <div className="relative z-10">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-teal-400 mb-2">SendBear</h3>
                      <div className="text-3xl font-bold text-white">$9/mo</div>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "Unlimited Contacts",
                        "Advanced Automation",
                        "A/B Testing",
                        "Advanced Customers",
                        "Advanced Configuration",
                        "Advanced Automation",
                        "A/B Testing",
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <Check className="h-5 w-5 text-teal-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mailchimp Card */}
              <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-white/10 to-white/5">
                <div className="h-full rounded-2xl p-6 bg-black/40 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50"></div>

                  <div className="relative z-10">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-gray-400 mb-2">Mailchimp</h3>
                      <div className="text-3xl font-bold text-white">$300/mo</div>
                    </div>
                    <ul className="space-y-3">
                      {[
                        "Unlimited Contacts",
                        "Advanced Automation",
                        "A/B Testing",
                        "Advanced Customers",
                        "Advanced Configuration",
                        "Advanced Automation",
                        "A/B Testing",
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <X className="h-5 w-5 text-red-500/70 mr-2 flex-shrink-0" />
                          <span className="text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-300"></th>
                      <th className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <Check className="h-5 w-5 text-teal-400" />
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <Check className="h-5 w-5 text-gray-600" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { feature: "Unlimited Contacts", yours: true, theirs: true },
                      { feature: "Advanced Automation", yours: true, theirs: false },
                      { feature: "Advanced Promotion", yours: true, theirs: false },
                      { feature: "A/B Testing", yours: true, theirs: false },
                    ].map((row, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm text-white">
                          {row.feature}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.yours ? (
                            <Check className="h-5 w-5 text-teal-400 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500/70 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {row.theirs ? (
                            <Check className="h-5 w-5 text-gray-600 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-red-500/70 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Pricing
              </h2>
            </div>

            <div className="grid md:grid-cols-5 gap-6 max-w-6xl mx-auto">
              {[
                {
                  name: "Free Forever",
                  price: "$0",
                  period: "/mo",
                  features: [
                    "Unlimited Contacts",
                    "Advanced Automation",
                    "A/B Testing",
                    "Portfolio Designer",
                  ],
                  cta: "Free Forever",
                },
                {
                  name: "Growth",
                  price: "$9",
                  period: "/mo",
                  features: [
                    "Unlimited Contacts",
                    "Advanced Automation",
                    "A/B Testing",
                    "Theme Boosters",
                    "Premium Enterprise",
                  ],
                  cta: "Get Started",
                  highlighted: true,
                },
                {
                  name: "Pro",
                  price: "$29",
                  period: "/mo",
                  features: [
                    "Unlimited Contacts",
                    "Advanced Automation",
                    "A/B Testing",
                    "Theme Boosters",
                    "Premium Enterprise",
                  ],
                  cta: "Get Started",
                },
                {
                  name: "Business",
                  price: "$49",
                  period: "/mo",
                  features: [
                    "Unlimited Contacts",
                    "Advanced Automation",
                    "A/B Testing",
                    "Theme Boosters Component",
                    "Premium Enterprise",
                  ],
                  cta: "Get Started",
                },
                {
                  name: "Enterprise",
                  price: "$99",
                  period: "/mo",
                  features: [
                    "Unlimited Contacts",
                    "Advanced Automation",
                    "A/B Testing",
                    "Theme Boosters Component",
                    "Premium Enterprise",
                  ],
                  cta: "Get Started",
                },
              ].map((plan, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-2xl p-[1px] transition-all duration-300 hover:scale-105",
                    plan.highlighted
                      ? "bg-gradient-to-br from-teal-400 via-teal-500 to-purple-500 shadow-2xl shadow-teal-500/50"
                      : "bg-gradient-to-br from-white/10 to-white/5"
                  )}
                >
                  <div
                    className={cn(
                      "h-full rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden",
                      plan.highlighted
                        ? "bg-gradient-to-br from-teal-500/10 via-black to-purple-500/10"
                        : "bg-black/40"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>

                    <div className="relative z-10">
                      <div className="mb-4">
                        <h3 className={cn(
                          "text-lg font-semibold mb-3",
                          plan.highlighted ? "text-teal-400" : "text-white"
                        )}>
                          {plan.name}
                        </h3>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-white">
                            {plan.price}
                          </span>
                          <span className="text-sm ml-1 text-gray-400">
                            {plan.period}
                          </span>
                        </div>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-sm">
                            <Check className={cn(
                              "h-4 w-4 mr-2 flex-shrink-0 mt-0.5",
                              plan.highlighted ? "text-teal-400" : "text-teal-400"
                            )} />
                            <span className="text-gray-300">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handlePricingClick(plan.name)}
                        className={cn(
                          "w-full transition-all duration-300",
                          plan.highlighted
                            ? "bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold shadow-lg shadow-teal-500/50"
                            : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20"
                        )}
                      >
                        {plan.cta}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                FAQ
              </h2>
            </div>

            <div className="space-y-3">
              {[
                {
                  question: "How easy is it to migrate from Mailchimp?",
                  answer:
                    "Super easy! We have a one-click migration tool that imports all your contacts, lists, segments, and even your email templates. Most migrations complete in under 5 minutes.",
                },
                {
                  question: "Do you offer free migration help?",
                  answer: "Yes! Our support team will help you migrate your entire account for free.",
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Absolutely! No long-term contracts. Cancel anytime with one click.",
                },
              ].map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center"
                  >
                    <span className="font-medium text-white text-sm pr-4">
                      {faq.question}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-teal-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && faq.answer && (
                    <div className="px-6 pb-4 text-sm text-gray-300 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-teal-500/20 blur-3xl"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to save thousands on email marketing?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Join 500+ businesses who switched and never looked back
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold text-lg px-8 py-6 shadow-lg shadow-teal-500/50"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 backdrop-blur-xl"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-gray-400 text-sm">
              14-day free trial • No credit card required • Migrate in 5 minutes
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/5 backdrop-blur-xl rounded flex items-center justify-center border border-white/10">
                  <Zap className="h-4 w-4 text-teal-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Secure</div>
                  <div className="text-sm text-gray-300">payments</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/5 backdrop-blur-xl rounded flex items-center justify-center border border-white/10">
                  <Check className="h-4 w-4 text-teal-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">GDPR</div>
                  <div className="text-sm text-gray-300">compliance</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/5 backdrop-blur-xl rounded flex items-center justify-center border border-white/10">
                  <Check className="h-4 w-4 text-teal-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500">Trust security</div>
                  <div className="text-sm text-gray-300">guarantee</div>
                </div>
              </div>
            </div>

            <div className="text-center border-t border-white/10 pt-8">
              <p className="text-sm text-gray-500">
                © 2025 SendBear. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        </div>
      </div>
    </>
  );
}
