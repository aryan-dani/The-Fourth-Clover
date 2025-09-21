"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in search params
        const searchParams = new URLSearchParams(window.location.search);
        const error: string | null = searchParams.get("error");
        const errorDescription: string | null =
          searchParams.get("error_description");

        if (error) {
          console.error("OAuth Error:", error, errorDescription);
          setStatus("error");
          setMessage(`Authentication failed: ${errorDescription || error}`);
          setTimeout(() => router.push("/auth/signin"), 5000);
          return;
        } // For OAuth flows, the session info is in the URL hash
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken: string | null = hashParams.get("access_token");
        const refreshToken: string | null = hashParams.get("refresh_token");

        if (accessToken) {
          setMessage("Establishing session...");

          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });

          if (error) {
            console.error("Error setting session:", error);
            setStatus("error");
            setMessage(`Failed to establish session: ${error.message}`);
            setTimeout(() => router.push("/auth/signin"), 5000);
            return;
          }

          if (data.session) {
            setMessage("Setting up your account...");

            // Profile creation is handled by database trigger
            // Just verify the session and redirect
            setStatus("success");
            setMessage("Sign in successful! Redirecting...");

            // Clear the hash from URL and redirect
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );

            setTimeout(() => {
              router.push("/dashboard");
            }, 1500);
          } else {
            setStatus("error");
            setMessage("Failed to create session. Please try again.");
            setTimeout(() => router.push("/auth/signin"), 3000);
          }
        } else {
          // No access token in URL hash, check if user is already signed in
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            setStatus("success");
            setMessage("You are already signed in. Redirecting...");
            setTimeout(() => router.push("/dashboard"), 1000);
          } else {
            setStatus("error");
            setMessage(
              "No authentication data found. Please try signing in again."
            );
            setTimeout(() => router.push("/auth/signin"), 3000);
          }
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setStatus("error");
        setMessage("An error occurred during sign in. Please try again.");
        setTimeout(() => router.push("/auth/signin"), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <div className="circle-logo">
              <span className="text-2xl">🍀</span>
            </div>
          </div>

          {status === "loading" && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="h-8 w-8 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {message}
              </p>
            </>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}
