import { Suspense } from "react";

import { ResetPasswordPageClient } from "./page.client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordPageClient />
    </Suspense>
  );
}
