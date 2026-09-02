"use client";

import { ArrowRight, Package, Phone, Shield, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import type { Inquiry } from "~/db/schema";

import {
  changePassword,
  twoFactor,
  useCurrentUserOrRedirect,
} from "~/lib/auth-client";
import { OrderCard } from "~/ui/components/order-card";
import { updatePhoneValueAction } from "~/app/actions/user";
import { Button } from "~/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/ui/primitives/card";
import { Input } from "~/ui/primitives/input";
import { Label } from "~/ui/primitives/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/ui/primitives/tabs";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

interface ProfilePageClientProps {
  orderCount: number;
  recentOrders: Inquiry[];
}

export function ProfilePageClient({
  orderCount,
  recentOrders,
}: ProfilePageClientProps) {
  const { isPending, user } = useCurrentUserOrRedirect();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [secret, setSecret] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [phoneMessage, setPhoneMessage] = useState("");
  const [isPhoneSaving, startPhoneSaving] = useTransition();
  const userPhone = (user as unknown as { phone?: string | null })?.phone ?? "";
  useEffect(() => {
    if (!isPending && user) setPhoneDraft(userPhone);
  }, [isPending, userPhone, user]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
        </div>
      </div>
    );
  }

  const handleEnableTwoFactor = () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);

    twoFactor
      .enable({
        password,
      })
      .then((result) => {
        if ("data" in result && result.data) {
          const uri = result.data.totpURI;
          setQrCodeData(uri);

          if (typeof uri === "string" && uri.includes("secret=")) {
            const secretMatch = uri.split("secret=")[1];
            if (secretMatch) {
              const extractedSecret = secretMatch.split("&")[0];
              if (extractedSecret) {
                setSecret(extractedSecret);
              }
            }
          }

          setShowQrCode(true);
          setMessage("Scan the QR code with your authenticator app");
        } else {
          setError(
            "Failed to enable two-factor authentication. Unexpected response format.",
          );
        }
      })
      .catch((err: unknown) => {
        setError(
          "Failed to enable two-factor authentication. Please try again.",
        );
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDisableTwoFactor = () => {
    if (!password) {
      setError("Password is required");
      return;
    }

    setError("");
    setLoading(true);

    twoFactor
      .disable({
        password,
      })
      .then(() => {
        setMessage("Two-factor authentication has been disabled");
        setShowQrCode(false);
      })
      .catch((err: unknown) => {
        setError(
          "Failed to disable two-factor authentication. Please try again.",
        );
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    setPasswordLoading(true);

    try {
      const { error } = await changePassword({
        currentPassword,
        newPassword,
      });
      if (error) {
        setPasswordError(error.message || "Failed to change password");
      } else {
        setPasswordMessage("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordError("Failed to change password. Please try again.");
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSavePhone = () => {
    setPhoneError("");
    setPhoneMessage("");
    const trimmed = phoneDraft.trim();
    if (trimmed && trimmed.replace(/\D/g, "").length < 7) {
      setPhoneError("Phone must be at least 7 digits.");
      return;
    }
    startPhoneSaving(async () => {
      const res = await updatePhoneValueAction(trimmed);
      if (!res.success) {
        setPhoneError(res.error || "Could not save phone.");
        toast.error(res.error || "Could not save phone.");
        return;
      }
      setPhoneMessage(trimmed ? "Phone saved. You'll get New Arrivals on WhatsApp." : "Phone removed.");
      toast.success(trimmed ? "Phone saved." : "Phone removed.");
    });
  };

  const isPhoneMissing = !isPending && user && !(user as unknown as { phone?: string | null }).phone;

  return (
    <div className="space-y-6">
      {isPhoneMissing && (
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="font-medium text-amber-900">Add your WhatsApp number</p>
            <p className="text-amber-700">We use your phone for order updates and New Arrivals broadcasts. Works the same whether you signed up with email or Google.</p>
          </div>
        </div>
      )}
      <div className="space-y-0.5">
        <h2 className="font-display text-2xl text-foreground">Details</h2>
        <p className="text-muted-foreground">
          Your account, and everything you&apos;ve requested from KRS.
        </p>
      </div>

      <Tabs className="space-y-4" defaultValue="overview">
        <TabsList>
          <TabsTrigger className="flex items-center gap-2" value="overview">
            <User className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger className="flex items-center gap-2" value="security">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <p className="text-sm text-foreground">
                  {user?.name || "Not set"}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <p className="text-sm text-foreground">
                  {user?.email || "Not set"}
                </p>
              </div>
              {user?.createdAt && (
                <div className="grid gap-1.5">
                  <Label>Client Since</Label>
                  <p className="text-sm text-foreground">
                    {DATE_FORMATTER.format(new Date(user.createdAt))}
                  </p>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="phone">WhatsApp Phone</Label>
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    inputMode="tel"
                    placeholder="+1 555 123 4567"
                    value={phoneDraft}
                    onChange={(e) => {
                      setPhoneDraft(e.target.value);
                      if (phoneError) setPhoneError("");
                      if (phoneMessage) setPhoneMessage("");
                    }}
                  />
                  <Button disabled={isPhoneSaving} onClick={handleSavePhone} variant="outline">
                    {isPhoneSaving ? "Saving…" : "Save"}
                  </Button>
                </div>
                {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
                {phoneMessage && <p className="text-sm text-krs-mocha">{phoneMessage}</p>}
                <p className="text-xs text-muted-foreground">For order updates & New Arrivals. Works for email or Google sign-in. Leave blank to remove.</p>
              </div>
              <Link
                className={`
                  inline-flex items-center gap-1 text-sm text-primary
                  hover:underline
                `}
                href="/dashboard/uploads"
              >
                Manage uploads <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex space-x-4">
                    <Button disabled={passwordLoading} onClick={handleChangePassword}>
                      {passwordLoading ? "Processing..." : "Change Password"}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="mt-2 text-sm text-destructive">{passwordError}</p>
                  )}
                  {passwordMessage && (
                    <p className="mt-2 text-sm text-krs-mocha">{passwordMessage}</p>
                  )}
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              {orderCount > 0 && (
                <Link
                  className={`
                    flex items-center gap-1 text-sm text-primary
                    hover:underline
                  `}
                  href="/dashboard/orders"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Package
                    className={`mx-auto h-8 w-8 text-muted-foreground`}
                  />
                  <p className="mt-3 text-sm text-muted-foreground">
                    No orders yet — nothing requested from the collection so
                    far.
                  </p>
                  <Link href="/products">
                    <Button className="mt-4" variant="outline">
                      Browse the Collection
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="security">
          {error && (
            <div
              className={`
                rounded-md bg-destructive/10 p-4 text-sm text-destructive
              `}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              className={`
                rounded-md bg-krs-champagne/10 p-4 text-sm text-krs-mocha
              `}
            >
              {message}
            </div>
          )}

          {showQrCode && qrCodeData && (
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center">
                  <img
                    alt="QR Code for Two-Factor Authentication"
                    className="h-48 w-48"
                    src={qrCodeData}
                  />
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Scan this QR code with your authenticator app (Google
                    Authenticator, Authy, etc.)
                  </p>
                  {secret && (
                    <div className="mt-6 w-full">
                      <p className="text-sm font-medium">Manual entry code:</p>
                      <p
                        className={`
                          mt-2 rounded-md bg-muted p-4 font-mono text-sm
                          break-all
                        `}
                      >
                        {secret}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Your Password</Label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                />
                <p className="text-sm text-muted-foreground">
                  Required to change your two-factor authentication settings
                </p>
              </div>

              <div className="flex space-x-4">
                <Button disabled={loading} onClick={handleEnableTwoFactor}>
                  {loading ? "Processing..." : "Enable Two-Factor"}
                </Button>

                <Button
                  disabled={loading}
                  onClick={handleDisableTwoFactor}
                  variant="destructive"
                >
                  {loading ? "Processing..." : "Disable Two-Factor"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Backup Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/auth/mfa">manage backup codes</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
