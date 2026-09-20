"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Field {
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
}

interface Props {
  fields: Field[];
  submitLabel: string;
  action: (formData: FormData) => Promise<{ ok: boolean; message?: string }>;
  onSuccessRedirect?: string;
  successStaysOnPage?: boolean;
}

export function AuthForm({ fields, submitLabel, action, onSuccessRedirect, successStaysOnPage }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <form
      className="flex flex-col gap-4"
      action={(formData: FormData) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const res = await action(formData);
          if (!res.ok) {
            setError(res.message ?? "Si è verificato un errore. Riprova.");
            return;
          }
          if (res.message) setSuccess(res.message);
          if (onSuccessRedirect && !successStaysOnPage) {
            router.push(onSuccessRedirect);
            router.refresh();
          }
        });
      }}
    >
      {fields.map((f) => (
        <Input key={f.name} name={f.name} label={f.label} type={f.type} autoComplete={f.autoComplete} required />
      ))}
      {error && <p className="text-sm text-card-red">{error}</p>}
      {success && <p className="text-sm text-card-green">{success}</p>}
      <Button type="submit" loading={pending} className="mt-2 w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
