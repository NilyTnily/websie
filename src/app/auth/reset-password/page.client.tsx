"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SEO_CONFIG } from "~/app";
import { authClient } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidToken = searchParams.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token.");
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (resetError) {
        setError(resetError.message || "Could not reset the password.");
        return;
      }

      router.push("/auth/sign-in?reset=true");
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
          <h2 className="text-3xl font-bold">Set a new password</h2>
        </div>

        <Card className="border-none shadow-sm">
          <CardContent className="pt-2">
            {invalidToken || !token ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  This reset link is invalid or has expired.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/forgot-password">Request a new link</Link>
                </Button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  void handleSubmit(e);
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Saving…" : "Reset password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
