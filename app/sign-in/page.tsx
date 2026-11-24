import type { Metadata } from "next";
import { Stub } from "@/components/tcg/stub";

export const metadata: Metadata = { title: "Sign in — TCG" };

/**
 * PLACEHOLDER. A real route so the masthead's sign-in control is live on
 * staging rather than greyed out. There are no accounts: no form, no session,
 * no provider.
 */
export default function SignIn() {
  return (
    <Stub
      pre="Accounts"
      title="Sign-in is not connected yet."
      body="There are no accounts on this site yet. Nothing you send through the home page needs one."
    />
  );
}
