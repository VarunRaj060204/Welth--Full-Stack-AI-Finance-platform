"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/utils";
import { db } from "@/lib/db";

interface CurrencySettingsProps {
  currentCurrency: string;
  userId: string;
}

export function CurrencySettings({ currentCurrency, userId }: CurrencySettingsProps) {
  const [currency, setCurrency] = useState(currentCurrency);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/currency", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency }),
      });
      if (!res.ok) throw new Error();
      toast.success("Currency updated!");
      router.refresh();
    } catch {
      toast.error("Failed to update currency");
    } finally {
      setSaving(false);
    }
  }

  const curr = SUPPORTED_CURRENCIES.find((c) => c.code === currency);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Default Currency</h3>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Set your primary currency for displaying balances and totals.
      </p>

      <div className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground w-8">
                      {c.symbol}
                    </span>
                    {c.code} — {c.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {curr && (
          <div className="bg-muted/40 rounded-xl p-3 text-sm">
            <div className="text-xs text-muted-foreground mb-1">Preview</div>
            <div className="font-semibold">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: curr.code,
              }).format(1234.56)}
            </div>
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={saving || currency === currentCurrency}
          className="w-full h-9"
          size="sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
