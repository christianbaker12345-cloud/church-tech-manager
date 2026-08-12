"use client";

import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    if (loading) return;

    if (!email.trim() || !password) {
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    void signIn();
  }

  function handleEnter(
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    void signIn();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          Church Tech Manager
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            className="w-full rounded-lg border p-3"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            onKeyDown={handleEnter}
            required
          />

          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="w-full rounded-lg border p-3"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            onKeyDown={handleEnter}
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !email.trim() ||
              !password
            }
          >
            {loading
              ? "Signing In..."
              : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}