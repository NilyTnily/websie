"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SEO_CONFIG, SYSTEM_CONFIG } from "~/app";
import { signIn } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

export function SignInPageClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Warms the client-side router cache for the post-login destination so the
  // navigation after a successful sign-in doesn't wait on a cold RSC fetch.
  useEffect(() => {
    router.prefetch(SYSTEM_CONFIG.redirectAfterSignIn);
  }, [router]);

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return "Email is required.";
    // simple permissive check — allows all valid RFC emails without browser strictness
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Please enter a valid email address.";
    return "";
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(validateEmail(value));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const vErr = validateEmail(trimmedEmail);
    if (vErr) {
      setEmailError(vErr);
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    setEmailError("");
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await signIn.email({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        // map common better-auth messages to friendly UI
        const raw = signInError.message || "";
        const status = (signInError as { status?: number }).status;
        if (raw.toLowerCase().includes("invalid email or password") || status === 401) {
          setError("Invalid email or password.");
        } else if (raw.toLowerCase().includes("too many") || status === 429) {
          setError("Too many attempts. Please wait a minute and try again.");
        } else if (raw.toLowerCase().includes("email") && raw.toLowerCase().includes("not verified")) {
          setError("Please verify your email first.");
        } else if (!raw || raw.includes("no response")) {
          setError("Could not reach auth server. Please refresh and try again.");
        } else {
          setError(raw);
        }
        setLoading(false);
        return;
      }

      // Leave `loading` true through the redirect — resetting it here made the
      // button snap back to normal while the destination page was still
      // loading, which read as the sign-in being stuck.
      router.push(SYSTEM_CONFIG.redirectAfterSignIn);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in request failed");
      setLoading(false);
      console.error(err);
    }
  };

  return (
    <div
      className={`
        grid h-screen w-screen
        md:grid-cols-2
      `}
    >
      {/* Left side - Image */}
      <div
        className={`
          relative hidden
          md:block
        `}
      >
        <Image
          alt="Sign-in background image"
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 0vw, 50vw"
          src="https://images.unsplash.com/photo-1719811059181-09032aef07b8?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3"
        />
        <div
          className={`
            absolute inset-0 bg-gradient-to-t from-background/80 to-transparent
          `}
        />
        <div className="absolute bottom-8 left-8 z-10 text-white">
          <h1 className="text-3xl font-bold">{SEO_CONFIG.name}</h1>
          <p className="mt-2 max-w-md text-sm text-white/80">
            {SEO_CONFIG.slogan}
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div
        className={`
          flex items-center justify-center p-4
          md:p-8
        `}
      >
        <div className="w-full max-w-md space-y-4">
          <div
            className={`
              space-y-4 text-center
              md:text-left
            `}
          >
            <h2 className="text-3xl font-bold">Sign In</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-2">
              <form
                className="space-y-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleEmailLogin(e);
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    autoCapitalize="off"
                    autoComplete="email"
                    autoCorrect="off"
                    id="email"
                    inputMode="email"
                    onBlur={() => setEmailError(validateEmail(email))}
                    onChange={(e) => {
                      handleEmailChange(e.target.value);
                    }}
                    placeholder="name@example.com"
                    spellCheck={false}
                    type="text"
                    value={email}
                  />
                  {emailError ? (
                    <p className="text-sm text-destructive">{emailError}</p>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 items-center gap-x-2 gap-y-2">
                  <Label className="col-start-1 row-start-1" htmlFor="password">
                    Password
                  </Label>
                  <div className="relative col-span-2 row-start-2">
                    <Input
                      className="pr-10"
                      id="password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                      }}
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className={`
                        absolute top-1/2 right-2 -translate-y-1/2
                        text-muted-foreground transition-colors
                        hover:text-foreground
                      `}
                      onClick={() => setShowPassword((prev) => !prev)}
                      tabIndex={-1}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Link
                    className={`
                      col-start-2 row-start-1 justify-self-end text-sm
                      text-muted-foreground
                      hover:underline
                    `}
                    href="/auth/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link
                  className={`
                    text-primary underline-offset-4
                    hover:underline
                  `}
                  href="/auth/sign-up"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
