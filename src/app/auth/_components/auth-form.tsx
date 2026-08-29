"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { SEO_CONFIG, SYSTEM_CONFIG } from "~/app";
import { signIn, signUp } from "~/lib/auth-client";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";

type AuthMode = "sign-in" | "sign-up";

interface AuthFormProps {
  initialMode: AuthMode;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.27 14.28A7.2 7.2 0 0 1 4.87 12c0-.79.14-1.56.4-2.28V6.63H1.29A11.98 11.98 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.87 8.87 4.76 12 4.76z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthForm({ initialMode }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Warms the client-side router cache for the post-auth destination so
  // navigation after a successful sign-in/up doesn't wait on a cold RSC fetch.
  useEffect(() => {
    router.prefetch(SYSTEM_CONFIG.redirectAfterSignIn);
  }, [router]);

  // Switching modes is a pure client-state swap — no route change, no
  // server round-trip. We still keep the URL in sync (via history, not
  // the router) so refresh/share links land on the right form.
  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setEmailError("");
    setNameError("");
    setPasswordError("");
    const url = next === "sign-in" ? "/auth/sign-in" : "/auth/sign-up";
    window.history.replaceState(null, "", url);
  };

  const validateEmail = (value: string) => {
    const v = value.trim();
    if (!v) return "Email is required.";
    if (!EMAIL_RE.test(v)) return "Please enter a valid email address.";
    return "";
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const { error: socialError } = await signIn.social({
        callbackURL: SYSTEM_CONFIG.redirectAfterSignIn,
        provider: "google",
      });
      if (socialError) {
        setError(socialError.message || "Could not connect to Google.");
        setGoogleLoading(false);
      }
      // On success the browser is redirected to Google, so we intentionally
      // leave `googleLoading` true — there's no "after" state to reset it in.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect to Google.");
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
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
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const eErr = validateEmail(trimmedEmail);
    const nErr = trimmedName ? "" : "Name is required.";
    const pErr = !password
      ? "Password is required."
      : password.length < 8
        ? "Password must be at least 8 characters."
        : "";

    if (eErr || nErr || pErr) {
      setEmailError(eErr);
      setNameError(nErr);
      setPasswordError(pErr);
      return;
    }

    setEmailError("");
    setNameError("");
    setPasswordError("");
    setError("");
    setLoading(true);

    try {
      const { error: signUpError } = await signUp.email({
        email: trimmedEmail,
        name: trimmedName,
        password,
      });

      if (signUpError) {
        const raw = signUpError.message || "";
        const status = (signUpError as { status?: number }).status;
        if (raw.toLowerCase().includes("already exists") || raw.toLowerCase().includes("already registered") || status === 409) {
          setError("An account with this email already exists.");
        } else if (raw.toLowerCase().includes("too many") || status === 429) {
          setError("Too many attempts. Please wait a minute.");
        } else if (!raw || raw.includes("no response")) {
          setError("Could not reach server. Please refresh and try again.");
        } else {
          setError(raw);
        }
        setLoading(false);
        return;
      }

      router.push(SYSTEM_CONFIG.redirectAfterSignIn);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration request failed");
      setLoading(false);
    }
  };

  const isSignIn = mode === "sign-in";

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
          alt="Krönig watch mechanism, close detail"
          className="object-cover"
          fill
          priority
          sizes="(max-width: 768px) 0vw, 50vw"
          src="/hero-flythrough/scene1-desktop.webp"
        />
        <div
          className={`
            absolute inset-0 bg-gradient-to-t from-krs-onyx/85 via-krs-onyx/20
            to-transparent
          `}
        />
        <div className="absolute bottom-8 left-8 z-10 text-white">
          <h1 className="text-3xl font-bold">{SEO_CONFIG.name}</h1>
          <p className="mt-2 max-w-md text-sm text-white/80">
            {SEO_CONFIG.slogan}
          </p>
        </div>
      </div>

      {/* Right side - form */}
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
            <h2 className="text-3xl font-bold">
              {isSignIn ? "Sign In" : "Create Account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isSignIn
                ? "Enter your credentials to access your account"
                : "Enter your details to create your account"}
            </p>
          </div>

          <Card className="border-none shadow-sm">
            <CardContent className="space-y-4 pt-2">
              <Button
                className="w-full gap-2"
                disabled={googleLoading || loading}
                onClick={() => void handleGoogle()}
                type="button"
                variant="outline"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </Button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or
                  </span>
                </div>
              </div>

              <form
                className="space-y-4"
                noValidate
                onSubmit={(e) => {
                  void (isSignIn ? handleSignIn(e) : handleSignUp(e));
                }}
              >
                {!isSignIn && (
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      autoComplete="name"
                      id="name"
                      onChange={(e) => {
                        setName(e.target.value);
                        if (nameError) setNameError("");
                      }}
                      placeholder="John Doe"
                      type="text"
                      value={name}
                    />
                    {nameError ? (
                      <p className="text-sm text-destructive">{nameError}</p>
                    ) : null}
                  </div>
                )}

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
                      setEmail(e.target.value);
                      if (emailError) setEmailError(validateEmail(e.target.value));
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
                      autoComplete={isSignIn ? "current-password" : "new-password"}
                      className="pr-10"
                      id="password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
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
                  {isSignIn ? (
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
                  ) : null}
                  {passwordError ? (
                    <p className="col-span-2 text-sm text-destructive">
                      {passwordError}
                    </p>
                  ) : null}
                </div>

                {error && (
                  <div className="text-sm font-medium text-destructive">
                    {error}
                  </div>
                )}

                <Button className="w-full" disabled={loading || googleLoading} type="submit">
                  {loading
                    ? isSignIn
                      ? "Signing in..."
                      : "Creating account..."
                    : isSignIn
                      ? "Sign in"
                      : "Create account"}
                </Button>
              </form>

              <div className="text-center text-sm text-muted-foreground">
                {isSignIn ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      className={`
                        text-primary underline-offset-4
                        hover:underline
                      `}
                      onClick={() => switchMode("sign-up")}
                      type="button"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      className={`
                        text-primary underline-offset-4
                        hover:underline
                      `}
                      onClick={() => switchMode("sign-in")}
                      type="button"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
