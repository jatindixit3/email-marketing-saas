"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  Star,
  Mail,
  BarChart,
  Users,
  Zap,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function LandingPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePricingClick = (planName: string) => {
    // Route to signup with plan pre-selected
    window.location.href = `/auth/signup?plan=${planName.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                [YOUR_NAME]
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">
                Features
              </a>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
                Pricing
              </Link>
              <a href="#faq" className="text-gray-600 hover:text-gray-900">
                FAQ
              </a>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
              Email marketing for $9/month
              <br />
              instead of $300
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              The fastest-growing email marketing platform. Full-featured, 10x more affordable than Mailchimp. Start growing your list today.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white text-base px-8 py-6">
                Get Started for Free
              </Button>
            </Link>
            <p className="mt-3 text-sm text-gray-500">
              No credit card required
            </p>
          </div>

          {/* Testimonials */}
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
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="text-gray-700 mb-2">{testimonial.text}</p>
                <p className="text-gray-900 font-medium">- {testimonial.name}</p>
              </div>
            ))}
          </div>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-teal-50 border-2 border-teal-600 rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">SendBear</h3>
                <div className="text-3xl font-bold text-gray-900">$9/mo</div>
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
                    <Check className="h-5 w-5 text-teal-600 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Mailchimp</h3>
                <div className="text-3xl font-bold text-gray-900">$300/mo</div>
              </div>
              <ul className="space-y-3">
                {[
                  { text: "Unlimited Contacts", available: false },
                  { text: "Advanced Automation", available: false },
                  { text: "A/B Testing", available: false },
                  { text: "Advanced Customers", available: false },
                  { text: "Advanced Configuration", available: false },
                  { text: "Advanced Automation", available: false },
                  { text: "A/B Testing", available: false },
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700"></th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Check className="h-5 w-5 text-teal-600" />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Check className="h-5 w-5 text-gray-300" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { feature: "Unlimited Contacts", yours: true, theirs: true },
                    { feature: "Advanced Automation", yours: true, theirs: false },
                    { feature: "Advanced Promotion", yours: true, theirs: false },
                    { feature: "A/B Testing", yours: true, theirs: false },
                  ].map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.yours ? (
                          <Check className="h-5 w-5 text-teal-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {row.theirs ? (
                          <Check className="h-5 w-5 text-gray-400 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-red-500 mx-auto" />
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
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
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
                ctaVariant: "outline" as const,
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
                  "Premiat Enterprise",
                ],
                cta: "Get Started",
                ctaVariant: "default" as const,
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
                ctaVariant: "outline" as const,
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
                ctaVariant: "outline" as const,
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
                ctaVariant: "outline" as const,
              },
            ].map((plan, index) => (
              <div
                key={index}
                className={`rounded-xl border-2 p-6 ${
                  plan.highlighted
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="mb-4">
                  <h3
                    className={`text-lg font-semibold mb-3 ${
                      plan.highlighted ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline">
                    <span
                      className={`text-4xl font-bold ${
                        plan.highlighted ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {plan.price}
                    </span>
                    <span
                      className={`text-sm ml-1 ${
                        plan.highlighted ? "text-teal-100" : "text-gray-600"
                      }`}
                    >
                      {plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <Check
                        className={`h-4 w-4 mr-2 flex-shrink-0 mt-0.5 ${
                          plan.highlighted ? "text-white" : "text-teal-600"
                        }`}
                      />
                      <span
                        className={
                          plan.highlighted ? "text-teal-50" : "text-gray-700"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePricingClick(plan.name)}
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-white text-teal-600 hover:bg-gray-100"
                      : "bg-teal-600 text-white hover:bg-teal-700"
                  }`}
                  variant={plan.ctaVariant}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              FAQ
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                question: "How easy is it to migrate from Mailchimp?",
                answer:
                  "How easy is it to migrate from Mailchimp? You can get simplify free negrat the migrations oots more car denos our Mailchimp amd browsers can easy relovan n financed.",
              },
              {
                question: "Do you offer free migration help?",
                answer: "",
              },
              {
                question: "Do you offer free migration help?",
                answer: "",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 text-sm">
                    {faq.question}
                  </span>
                  {openFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && faq.answer && (
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500">Secure</div>
                <div className="text-sm text-gray-300">payments</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500">GDPR</div>
                <div className="text-sm text-gray-300">compliance</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-500">Trust security</div>
                <div className="text-sm text-gray-300">guarantee</div>
              </div>
            </div>
          </div>

          <div className="text-center border-t border-gray-800 pt-8">
            <p className="text-sm text-gray-500">
              © 2025 SendBear. All rights reserved.
            </p>
            <div className="flex justify-center gap-6 mt-4">
              <a href="https://twitter.com/yourcompany" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/yourcompany" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="https://github.com/yourcompany" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
