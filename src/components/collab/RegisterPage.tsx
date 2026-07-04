"use client";

import { useState, type FormEvent } from "react";
import { Code2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/store/useStore";

export default function RegisterPage() {
  const { setCurrentPage, setUser } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      setUser(data.user);
      setCurrentPage("dashboard");
      toast.success("Account created successfully!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background animation - subtle moving gradient orbs */}
      <div
        className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full animate-orb pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(88, 166, 255, 0.08) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-1/3 -left-32 w-[350px] h-[350px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(35, 134, 54, 0.06) 0%, transparent 70%)",
          filter: "blur(80px)",
          animation: "float-orb 10s ease-in-out infinite reverse",
        }}
      />

      {/* Subtle dot grid */}
      <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />

      <Card className="w-full max-w-md glass glow-green relative z-10 overflow-hidden">
        {/* Subtle top gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, transparent, #58a6ff, #238636, transparent)",
          }}
        />

        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#238636] glow-green">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-[#e6edf3]">CollabCode</span>
          </div>
          <CardTitle className="text-2xl text-[#e6edf3]">
            Create your account
          </CardTitle>
          <CardDescription className="text-[#8b949e]">
            Start collaborating in seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#e6edf3]">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#0d1117]/80 border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#238636] focus:ring-1 focus:ring-[#238636]/30 transition-all"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#e6edf3]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#0d1117]/80 border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#238636] focus:ring-1 focus:ring-[#238636]/30 transition-all"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#e6edf3]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#0d1117]/80 border-[#30363d] text-[#e6edf3] placeholder:text-[#484f58] focus:border-[#238636] focus:ring-1 focus:ring-[#238636]/30 transition-all"
                autoComplete="new-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full py-5 text-base font-semibold rounded-lg text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(35,134,54,0.3)]"
              style={{
                background: "linear-gradient(135deg, #238636, #2ea043)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-5">
          <p className="text-sm text-[#8b949e]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setCurrentPage("login")}
              className="text-[#58a6ff] hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}