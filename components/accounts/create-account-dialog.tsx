"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createAccount } from "@/actions/accounts";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(50),
  type: z.enum(["CHECKING","SAVINGS","CREDIT_CARD","INVESTMENT","CRYPTO","CASH","OTHER"]),
  balance: z.string(),
  currency: z.string().length(3),
  isDefault: z.boolean().default(false),
  color: z.string(),
});

type FormData = z.infer<typeof schema>;

const ACCOUNT_TYPES = [
  { value: "CHECKING", label: "Checking" },
  { value: "SAVINGS", label: "Savings" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "CRYPTO", label: "Crypto" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
];

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#f59e0b", "#22c55e", "#06b6d4",
  "#3b82f6", "#10b981",
];

export function CreateAccountDialog({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      currency,
      balance: "0",
      isDefault: false,
      color: PRESET_COLORS[0],
      type: "CHECKING",
    },
  });

  const isDefault = watch("isDefault");

  async function onSubmit(data: FormData) {
    try {
      await createAccount({
        ...data,
        balance: parseFloat(data.balance) || 0,
        color: selectedColor,
      });
      toast.success("Account created!");
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to create account");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Account Name</Label>
            <Input {...register("name")} placeholder="e.g. Chase Checking" className="h-9" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Account Type</Label>
              <Select
                defaultValue="CHECKING"
                onValueChange={(v) => setValue("type", v as any)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Currency</Label>
              <Select defaultValue={currency} onValueChange={(v) => setValue("currency", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Opening Balance</Label>
            <Input
              {...register("balance")}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="h-9"
            />
          </div>

          {/* Color picker */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Account Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: color,
                    outline: selectedColor === color ? `3px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm">Set as default account</Label>
              <p className="text-xs text-muted-foreground">
                Used for new transactions by default
              </p>
            </div>
            <Switch
              checked={isDefault}
              onCheckedChange={(v) => setValue("isDefault", v)}
            />
          </div>

          <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
