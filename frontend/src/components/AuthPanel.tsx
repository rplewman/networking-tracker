import { useState, type FormEvent } from "react";
import { neonAuth } from "../lib/neonAuth";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { InlineBanner } from "./StateViews";

export function AuthPanel() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result =
        mode === "sign-in"
          ? await neonAuth.auth.signIn.email({ email, password })
          : await neonAuth.auth.signUp.email({ email, password, name });
      if (result.error) {
        setError(result.error.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setError("Couldn't reach the auth server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Networking Tracker</h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === "sign-in" ? "Sign in to see your contacts." : "Create an account to get started."}
        </p>

        <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
          {mode === "sign-up" && (
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Name
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Email
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Password
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>

          {error && <InlineBanner message={error} />}

          <Button type="submit" disabled={submitting} className="mt-1 w-full">
            {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
          onClick={() => {
            setError(null);
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          }}
        >
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
