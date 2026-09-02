"use client";

import { HelpCircle } from "lucide-react";

import { Button } from "~/ui/primitives/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/ui/primitives/dialog";

export interface TutorialStep {
  body: React.ReactNode;
  title: string;
}

interface TutorialDialogProps {
  buttonLabel: string;
  dialogDescription: string;
  dialogTitle: string;
  steps: TutorialStep[];
}

export function TutorialDialog({
  buttonLabel,
  dialogDescription,
  dialogTitle,
  steps,
}: TutorialDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <HelpCircle className="size-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className={`
        max-h-[85vh] overflow-y-auto
        sm:max-w-xl
      `}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-5">
          {steps.map((step, index) => (
            <li className="flex gap-3" key={step.title}>
              <span
                className={`
                  flex size-6 shrink-0 items-center justify-center rounded-full
                  bg-muted text-xs font-semibold
                `}
              >
                {index + 1}
              </span>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{step.title}</p>
                <div className="text-muted-foreground">{step.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </DialogContent>
    </Dialog>
  );
}

function ExternalLink({
  children,
  href,
}: {
  children: React.ReactNode;
  href: string;
}) {
  return (
    <a
      className="text-foreground underline underline-offset-2"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return (
    <code
      className={`
        rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground
      `}
    >
      {children}
    </code>
  );
}

export const GOOGLE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    body: (
      <>
        Go to{" "}
        <ExternalLink href="https://console.cloud.google.com/">
          Google Cloud Console
        </ExternalLink>{" "}
        and create a new project (or pick an existing one) from the project
        selector at the top of the page.
      </>
    ),
    title: "Create a Google Cloud project",
  },
  {
    body: (
      <>
        Go to <strong>APIs &amp; Services → OAuth consent screen</strong>.
        Choose <strong>External</strong> user type, fill in an app name,
        support email, and developer contact email, then save. You can leave
        it in &quot;Testing&quot; mode while developing — add your own Google
        account under <strong>Test users</strong> so you can sign in.
      </>
    ),
    title: "Configure the OAuth consent screen",
  },
  {
    body: (
      <>
        Go to <strong>APIs &amp; Services → Credentials → Create Credentials
        → OAuth client ID</strong>. Application type: <strong>Web
        application</strong>. Under <strong>Authorized redirect URIs</strong>,
        add exactly:
        <div className="mt-2">
          <Field>{"{your domain}"}/api/auth/callback/google</Field>
        </div>
        For local development also add{" "}
        <Field>http://localhost:3000/api/auth/callback/google</Field>.
      </>
    ),
    title: "Create an OAuth Client ID",
  },
  {
    body: (
      <>
        After creating the client, Google shows a <strong>Client ID</strong>{" "}
        and <strong>Client Secret</strong>. Copy both — the secret is only
        shown once, so grab it now (you can always generate a new one later
        if you lose it).
      </>
    ),
    title: "Copy the Client ID and Client Secret",
  },
  {
    body: (
      <>
        Paste both values into the <strong>Google Sign-In</strong> card on
        this page and save. Leaving them blank falls back to the{" "}
        <Field>GOOGLE_CLIENT_ID</Field> / <Field>GOOGLE_CLIENT_SECRET</Field>{" "}
        environment variables instead, if you'd rather set them there.
      </>
    ),
    title: "Paste into this page",
  },
  {
    body: (
      <>
        Once your app is ready for real users, go back to the OAuth consent
        screen and click <strong>Publish App</strong> to move it out of
        Testing mode — otherwise only the test users you listed can sign in.
      </>
    ),
    title: "Publish when ready for real users",
  },
];

export const WHATSAPP_TUTORIAL_STEPS: TutorialStep[] = [
  {
    body: (
      <>
        Go to{" "}
        <ExternalLink href="https://business.facebook.com/">
          Meta Business Manager
        </ExternalLink>{" "}
        and create a Business Account if you don't have one, then go to{" "}
        <ExternalLink href="https://developers.facebook.com/apps/">
          Meta for Developers → My Apps → Create App
        </ExternalLink>
        . Choose the <strong>Business</strong> app type, then add the{" "}
        <strong>WhatsApp</strong> product to it.
      </>
    ),
    title: "Create a Meta app with WhatsApp added",
  },
  {
    body: (
      <>
        In the app dashboard, go to <strong>WhatsApp → API Setup</strong>.
        Meta gives you a free test number automatically. Copy the{" "}
        <strong>Phone number ID</strong> shown there — this is{" "}
        <Field>WHATSAPP_PHONE_NUMBER_ID</Field>.
      </>
    ),
    title: "Get your Phone Number ID",
  },
  {
    body: (
      <>
        On the same API Setup page, generate a{" "}
        <strong>temporary access token</strong> (24h, fine for testing) or —
        for production — go to{" "}
        <strong>Business Settings → System Users</strong>, create a system
        user, assign it the WhatsApp app with{" "}
        <strong>whatsapp_business_messaging</strong> permission, and generate
        a token that doesn't expire. This is{" "}
        <Field>WHATSAPP_ACCESS_TOKEN</Field>.
      </>
    ),
    title: "Get an Access Token",
  },
  {
    body: (
      <>
        In the app dashboard go to <strong>App Settings → Basic</strong> and
        copy the <strong>App Secret</strong> (click &quot;Show&quot;, you may
        need to re-enter your password). This is{" "}
        <Field>WHATSAPP_APP_SECRET</Field> — it's used to verify that
        webhook requests really come from Meta, not an attacker.
      </>
    ),
    title: "Get your App Secret",
  },
  {
    body: (
      <>
        Make up any random string yourself (e.g. a UUID) — this is your{" "}
        <Field>WHATSAPP_VERIFY_TOKEN</Field>. You'll enter this exact same
        string in the next step, so save it somewhere first.
      </>
    ),
    title: "Choose a Webhook Verify Token",
  },
  {
    body: (
      <>
        In <strong>WhatsApp → Configuration</strong>, click{" "}
        <strong>Edit</strong> next to Webhook. Callback URL:
        <div className="mt-2">
          <Field>{"{your domain}"}/api/whatsapp/webhook</Field>
        </div>
        Verify token: paste the string from the previous step. Click{" "}
        <strong>Verify and Save</strong>, then subscribe to the{" "}
        <strong>messages</strong> field so incoming customer messages reach
        your site.
      </>
    ),
    title: "Register the webhook",
  },
  {
    body: (
      <>
        Meta can't reach <Field>localhost</Field> directly. Use{" "}
        <ExternalLink href="https://ngrok.com/">ngrok</ExternalLink> (
        <Field>ngrok http 3000</Field>) or a Cloudflare Tunnel to get a
        temporary HTTPS URL, and use that as the webhook Callback URL while
        testing locally. Switch to your real domain once deployed.
      </>
    ),
    title: "Local development needs a tunnel",
  },
  {
    body: (
      <>
        Paste Phone Number ID, Access Token, App Secret, and Verify Token
        into the <strong>WhatsApp Integration</strong> card on this page and
        save. This enables the inbound side — customer replies auto-match to
        orders under <Field>/admin/whatsapp</Field>.
      </>
    ),
    title: "Paste the 4 values into this page",
  },
  {
    body: (
      <>
        Automatic outbound messages (order confirmations, shipping updates)
        require pre-approved <strong>message templates</strong> — Meta blocks
        free-form text sent by the business first. Go to{" "}
        <strong>WhatsApp Manager → Message Templates → Create Template</strong>{" "}
        and submit these 5 (Category: Utility):
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <Field>order_confirmed</Field> — &quot;Hi {"{{1}}"}, we've
            received your order {"{{2}}"}. Total: {"{{3}}"}. We'll update you
            soon.&quot;
          </li>
          <li>
            <Field>order_status_update</Field> — &quot;Hi {"{{1}}"}, order{" "}
            {"{{2}}"} is now {"{{3}}"}.&quot;
          </li>
          <li>
            <Field>order_shipped</Field> — &quot;Hi {"{{1}}"}, order{" "}
            {"{{2}}"} has shipped. Tracking: {"{{3}}"}.&quot;
          </li>
          <li>
            <Field>order_cancelled_refunded</Field> — &quot;Hi {"{{1}}"},
            order {"{{2}}"} has been {"{{3}}"}. Contact us with
            questions.&quot;
          </li>
          <li>
            <Field>new_arrivals</Field> — &quot;Hi {"{{1}}"}, our new arrivals
            are here: {"{{2}}"} View them here: {"{{3}}"}.&quot;
          </li>
        </ul>
        Approval usually takes minutes to a couple of days. Until approved,
        the site still saves every order normally — only the automatic
        WhatsApp message is skipped.
      </>
    ),
    title: "Submit message templates for approval",
  },
];
