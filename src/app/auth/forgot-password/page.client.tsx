"use client";

import Link from "next/link";
import { useState } from "react";

import { SEO_CONFIG } from "~/app";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export function ForgotPasswordPageClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = (v: string) => {
    const t = v.trim();
    if (!t) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Please enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    const vErr = validateEmail(trimmed);
    if (vErr) {
      setEmailError(vErr);
      return;
    }
    setEmailError("");
    setError("");
    setLoading(true);

    try {
      const { error: resetError } = await authClient.forgetPassword({
        email: trimmed,
        redirectTo: "/auth/reset-password",
      });

      if (resetError) {
        const raw = resetError.message || "";
        const status = (resetError as { status?: number }).status;
        if (raw.toLowerCase().includes("too many") || status === 429) {
          setError("Too many requests. Please wait a minute before retrying.");
        } else {
          setError(raw || "Could not send the reset email.");
        }
        return;
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="space-y-1.5 text-center">
          <h1 className="font-display text-2xl">{SEO_CONFIG.name}</h1>
          <h2 className="text-3xl font-bold">Reset your password</h2>
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset it.
          </p>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-2">
            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{email}</strong>, a reset
                  link is on its way. Check your inbox.
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/auth/sign-in">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                noValidate
                onSubmit={(e) => {
                  void handleSubmit(e);
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    autoCapitalize="off"
                    autoComplete="email"
                    autoCorrect="off"
                    inputMode="email"
                    onBlur={() => setEmailError(validateEmail(email))}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
                    }}
                    placeholder="name@example.com"
                    spellCheck={false}
                    type="text"
                    value={email}
                  />
                  {emailError ? <p className="text-sm text-destructive">{emailError}</p> : null}
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  <Link
                    className={`
                      text-primary underline-offset-4
                      hover:underline
                    `}
                    href="/auth/sign-in"
                  >
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
