"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthFormShell } from "@/components/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/schemas";
import Link from "next/link";

const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setLoading(true);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${backendBaseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(values)
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "An error occurred. Please try again.");
        return;
      }

      setSuccessMessage(data.message);
      toast.success("Password reset request submitted successfully.");
    } catch (error) {
      toast.error("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFormShell title="Reset password" subtitle="We'll send a password reset link to your email.">
      {successMessage ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700 border border-green-200">
            {successMessage}
          </div>
          <div className="text-center">
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Return to login
            </Link>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" /> : null}
              Send reset link
            </Button>
            <div className="text-center mt-4">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-500">
                Back to login
              </Link>
            </div>
          </form>
        </Form>
      )}
    </AuthFormShell>
  );
}
