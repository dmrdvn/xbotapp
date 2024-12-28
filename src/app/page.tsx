"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BsRobot, BsTwitter, BsLightning, BsGear, BsPeople, BsArrowRight, BsBarChart } from "react-icons/bs";
import { auth } from "@/services/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<null | { uid: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ? { uid: user.uid } : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return null; // veya loading spinner
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BsRobot className="h-6 w-6" />
            <span className="font-bold text-xl">xBot</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  Dashboard
                </Button>
                <Button onClick={() => router.push("/settings")}>
                  Settings
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                  Login
                </Button>
                <Button onClick={() => router.push("/auth/register")}>
                  Sign up
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl sm:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
              Automate Your Twitter Presence
            </h1>
            <p className="text-xl text-gray-400">
              Create authentic AI-powered Twitter profiles that engage with your audience, grow your following, and maintain a consistent presence - all while you focus on what matters most.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started <BsArrowRight className="ml-2" />
              </Button>
              <Button size="lg" variant="default" onClick={() => router.push("dashboard")}>
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Twitter Automation
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BsTwitter,
                title: "Smart Tweeting",
                description: "AI-powered tweets that match your profile&apos;s personality and interests",
              },
              {
                icon: BsLightning,
                title: "Automated Engagement",
                description: "Intelligent interactions with your audience through likes, retweets, and replies",
              },
              {
                icon: BsPeople,
                title: "Multiple Personas",
                description: "Manage multiple Twitter profiles with distinct personalities and behaviors",
              },
              {
                icon: BsGear,
                title: "Custom Settings",
                description: "Fine-tune your bot&apos;s behavior with advanced configuration options",
              },
              {
                icon: BsBarChart,
                title: "Analytics",
                description: "Track your growth and engagement with detailed analytics",
              },
              {
                icon: BsRobot,
                title: "AI Learning",
                description: "Bot learns and adapts based on successful interactions",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border border-gray-800 bg-black/50 backdrop-blur-lg hover:border-gray-700 transition-all"
              >
                <feature.icon className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How xBot Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Profile",
                description: "Set up your bot&apos;s personality, interests, and behavior patterns",
              },
              {
                step: "02",
                title: "Configure Settings",
                description: "Customize posting frequency, engagement rules, and automation preferences",
              },
              {
                step: "03",
                title: "Watch It Grow",
                description: "Monitor your profile&apos;s growth and engagement through detailed analytics",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-5xl font-bold text-blue-500 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-4xl font-bold">Ready to Automate Your Twitter?</h2>
            <p className="text-xl text-gray-400">
              Join thousands of users who are already growing their Twitter presence with xBot.
            </p>
            <Button size="lg" onClick={handleGetStarted}>
              Get Started Now <BsArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-800">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BsRobot className="h-6 w-6" />
              <span className="font-bold text-xl">xBot</span>
            </div>
            <div className="text-gray-400 text-sm">
              © 2024 xBot. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
