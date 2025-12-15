"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, ChevronDown, ChevronUp, Zap, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handlePricingClick = (planName: string) => {
    // Route to signup with plan pre-selected
    window.location.href = `/auth/signup?plan=${planName.toLowerCase()}`;
  };

  const pricingPlans = [
    {
      name: "FREE",
      price: { monthly: 0, annual: 0 },
      contacts: "2,500",
      emails: "10k emails/month",
      features: [
        { text: "2,500 contacts", included: true },
        { text: "10,000 emails/month", included: true },
        { text: "Basic templates", included: true },
        { text: "Email support", included: true },
        { text: "All templates", included: false },
        { text: "Priority support", included: false },
        { text: "Remove branding", included: false },
        { text: "A/B testing", included: false },
        { text: "Dedicated support", included: false },
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "STARTER",
      price: { monthly: 9, annual: 86.4 },
      contacts: "5,000",
      emails: "50k emails/month",
      features: [
        { text: "5,000 contacts", included: true },
        { text: "50,000 emails/month", included: true },
        { text: "Basic templates", included: true },
        { text: "All templates", included: true },
        { text: "Priority support", included: true },
        { text: "Remove branding", included: false },
        { text: "A/B testing", included: false },
        { text: "Dedicated support", included: false },
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "GROWTH",
      price: { monthly: 29, annual: 278.4 },
      contacts: "15,000",
      emails: "150k emails/month",
      features: [
        { text: "15,000 contacts", included: true },
        { text: "150,000 emails/month", included: true },
        { text: "Basic templates", included: true },
        { text: "All templates", included: true },
        { text: "Priority support", included: true },
        { text: "Remove branding", included: true },
        { text: "Advanced analytics", included: true },
        { text: "A/B testing", included: false },
        { text: "Dedicated support", included: false },
      ],
      cta: "Start Free Trial",
      popular: true,
      badge: "MOST POPULAR",
    },
    {
      name: "PRO",
      price: { monthly: 49, annual: 470.4 },
      contacts: "30,000",
      emails: "300k emails/month",
      features: [
        { text: "30,000 contacts", included: true },
        { text: "300,000 emails/month", included: true },
        { text: "Basic templates", included: true },
        { text: "All templates", included: true },
        { text: "Priority support", included: true },
        { text: "Remove branding", included: true },
        { text: "Advanced analytics", included: true },
        { text: "A/B testing", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated support", included: false },
      ],
      cta: "Start Free Trial",
      popular: false,
    },
    {
      name: "SCALE",
      price: { monthly: 99, annual: 950.4 },
      contacts: "100,000",
      emails: "1M emails/month",
      features: [
        { text: "100,000 contacts", included: true },
        { text: "1,000,000 emails/month", included: true },
        { text: "Basic templates", included: true },
        { text: "All templates", included: true },
        { text: "Priority support", included: true },
        { text: "Remove branding", included: true },
        { text: "Advanced analytics", included: true },
        { text: "A/B testing", included: true },
        { text: "Custom integrations", included: true },
        { text: "Dedicated support", included: true },
        { text: "99.99% SLA", included: true },
        { text: "White-label option", included: true },
      ],
      cta: "Start Free Trial",
      popular: false,
    },
  ];

  const getPrice = (plan: typeof pricingPlans[0]) => {
    const price = billingPeriod === "monthly" ? plan.price.monthly : plan.price.annual;
    return price;
  };

  const getDisplayPrice = (plan: typeof pricingPlans[0]) => {
    const price = getPrice(plan);
    if (billingPeriod === "annual") {
      return `$${(price / 12).toFixed(2)}`;
    }
    return `$${price}`;
  };

  const faqItems = [
    {
      question: "Can I switch plans at any time?",
      answer:
        "Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges or credits to your account.",
    },
    {
      question: "What happens when I exceed my contact or email limit?",
      answer:
        "We'll notify you when you're approaching your limits. You can either upgrade your plan or we'll pause sending until the next billing cycle. We never charge overage fees without your approval.",
    },
    {
      question: "How does the 14-day free trial work?",
      answer:
        "All paid plans include a 14-day free trial with full access to all features. No credit card required. You can cancel anytime during the trial with no charges.",
    },
    {
      question: "What's included in the annual discount?",
      answer:
        "When you choose annual billing, you save 20% compared to monthly billing. You pay for 10 months and get 2 months free! Plus, you lock in your rate for the entire year.",
    },
    {
      question: "Can I cancel my subscription?",
      answer:
        "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. You'll have access to your plan until the end of your billing period, and you can export all your data.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "We offer a 30-day money-back guarantee on all paid plans. If you're not satisfied for any reason, contact us within 30 days of your purchase for a full refund.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, Mastercard, American Express, Discover), PayPal, and ACH bank transfers for annual plans. All payments are processed securely through Stripe.",
    },
    {
      question: "Is there a setup fee or hidden costs?",
      answer:
        "No setup fees, no hidden costs. The price you see is the price you pay. All features listed in your plan are included at no extra charge.",
    },
  ];

  const comparisonFeatures = [
    { name: "Contacts", free: "2,500", starter: "5,000", growth: "15,000", pro: "30,000", scale: "100,000" },
    { name: "Emails per month", free: "10,000", starter: "50,000", growth: "150,000", pro: "300,000", scale: "1,000,000" },
    { name: "Email templates", free: "Basic", starter: "All", growth: "All", pro: "All", scale: "All + Custom" },
    { name: "Support", free: "Email", starter: "Priority", growth: "Priority", pro: "Priority", scale: "Dedicated" },
    { name: "Remove branding", free: false, starter: false, growth: true, pro: true, scale: true },
    { name: "A/B testing", free: false, starter: false, growth: false, pro: true, scale: true },
    { name: "Advanced analytics", free: false, starter: false, growth: true, pro: true, scale: true },
    { name: "Custom integrations", free: false, starter: false, growth: false, pro: true, scale: true },
    { name: "Dedicated account manager", free: false, starter: false, growth: false, pro: false, scale: true },
    { name: "White-label option", free: false, starter: false, growth: false, pro: false, scale: true },
    { name: "99.99% SLA", free: false, starter: false, growth: false, pro: false, scale: true },
  ];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-teal-900/20"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

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
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/pricing" className="text-teal-400 font-medium">
                Pricing
              </Link>
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
        {/* Header */}
        <section className="pt-32 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-200 to-white">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>

            {/* Billing Toggle - Liquid Glass Effect */}
            <div className="inline-flex items-center bg-white/5 backdrop-blur-xl rounded-2xl p-1 mb-12 border border-white/10 shadow-2xl">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-medium transition-all",
                  billingPeriod === "monthly"
                    ? "bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white shadow-lg backdrop-blur-xl border border-teal-400/30"
                    : "text-gray-400 hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod("annual")}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                  billingPeriod === "annual"
                    ? "bg-gradient-to-r from-teal-500/20 to-teal-600/20 text-white shadow-lg backdrop-blur-xl border border-teal-400/30"
                    : "text-gray-400 hover:text-white"
                )}
              >
                Annual
                <Badge className="bg-green-500/20 text-green-300 border-green-400/30 text-xs backdrop-blur-xl">
                  Save 20%
                </Badge>
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative rounded-2xl p-[1px] transition-all duration-300 hover:scale-105",
                    plan.popular
                      ? "bg-gradient-to-br from-teal-400 via-teal-500 to-purple-500 shadow-2xl shadow-teal-500/50"
                      : "bg-gradient-to-br from-white/10 to-white/5"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-teal-400 to-teal-500 text-black px-4 py-1 text-xs font-bold shadow-lg border-0">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Liquid Glass Card */}
                  <div className={cn(
                    "h-full rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden",
                    plan.popular
                      ? "bg-gradient-to-br from-teal-500/10 via-black to-purple-500/10"
                      : "bg-black/40"
                  )}>
                    {/* Glass reflection effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>

                    <div className="relative z-10">
                      <div className="text-center pb-4">
                        <h3 className="text-sm font-bold text-teal-400 mb-4 tracking-wide">
                          {plan.name}
                        </h3>

                        <div className="mb-2">
                          <div className="flex items-baseline justify-center">
                            <span className="text-4xl font-bold text-white">
                              {getDisplayPrice(plan)}
                            </span>
                            <span className="text-gray-400 ml-1">/mo</span>
                          </div>
                          {billingPeriod === "annual" && plan.price.annual > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ${plan.price.annual}/year
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-gray-300 space-y-1">
                          <div className="font-medium">{plan.contacts} contacts</div>
                          <div className="text-gray-400">{plan.emails}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Button
                          onClick={() => handlePricingClick(plan.name)}
                          className={cn(
                            "w-full transition-all duration-300",
                            plan.popular
                              ? "bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-black font-bold shadow-lg shadow-teal-500/50"
                              : "bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/20"
                          )}
                        >
                          {plan.cta}
                        </Button>

                        <ul className="space-y-3 pt-4 border-t border-white/10">
                          {plan.features.slice(0, 5).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start text-xs">
                              {feature.included ? (
                                <Check className="h-4 w-4 text-teal-400 mr-2 flex-shrink-0 mt-0.5" />
                              ) : (
                                <X className="h-4 w-4 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                              )}
                              <span className={feature.included ? "text-gray-300" : "text-gray-600"}>
                                {feature.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Signals */}
            <div className="text-center mt-12">
              <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-teal-400" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-400" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Compare all features
              </h2>
              <p className="text-xl text-gray-300">
                See exactly what's included in each plan
              </p>
            </div>

            {/* Liquid Glass Table Container */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-white w-1/4">
                        Feature
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                        FREE
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                        STARTER
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-teal-400 bg-teal-500/10">
                        GROWTH
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                        PRO
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                        SCALE
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {comparisonFeatures.map((feature, index) => (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {feature.name}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <Check className="h-5 w-5 text-teal-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-700 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.free}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {typeof feature.starter === "boolean" ? (
                            feature.starter ? (
                              <Check className="h-5 w-5 text-teal-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-700 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.starter}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm bg-teal-500/10">
                          {typeof feature.growth === "boolean" ? (
                            feature.growth ? (
                              <Check className="h-5 w-5 text-teal-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-700 mx-auto" />
                            )
                          ) : (
                            <span className="text-white font-medium">{feature.growth}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {typeof feature.pro === "boolean" ? (
                            feature.pro ? (
                              <Check className="h-5 w-5 text-teal-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-700 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.pro}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {typeof feature.scale === "boolean" ? (
                            feature.scale ? (
                              <Check className="h-5 w-5 text-teal-400 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-gray-700 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-300">{feature.scale}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

            {/* CTA after table */}
            <div className="text-center mt-12">
              <p className="text-gray-300 mb-4">
                Need more than 100k contacts or custom features?
              </p>
              <Link href="/contact">
                <Button variant="outline" size="lg" className="border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-xl">
                  Contact Sales for Enterprise Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Billing FAQ
              </h2>
              <p className="text-xl text-gray-300">
                Common questions about pricing and billing
              </p>
            </div>

            <div className="space-y-3">
              {faqItems.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:bg-white/10 transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center"
                  >
                    <span className="font-semibold text-white pr-4">
                      {faq.question}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-teal-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-4 text-gray-300 leading-relaxed">
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
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-purple-500/20 to-teal-500/20 blur-3xl"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Ready to grow your email list?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Join thousands of businesses sending better emails
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
                  Schedule a Demo
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-gray-400 text-sm">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
