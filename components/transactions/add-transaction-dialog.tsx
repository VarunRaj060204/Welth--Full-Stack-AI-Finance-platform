"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, Plus, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Badge } from "@/components/ui/badge";
import { createTransaction } from "@/actions/transactions";
import { TRANSACTION_CATEGORIES } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  amount: z.string().min(1),
  description: z.string().min(1).max(200),
  date: z.string(),
  category: z.string(),
  accountId: z.string(),
  currency: z.string(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]).optional(),
});

type FormData = z.infer<typeof schema>;

interface Account {
  id: string;
  name: string;
  currency: string;
  color: string;
}

interface AddTransactionDialogProps {
  accounts: Account[];
  currency: string;
  children: React.ReactNode;
}

export function AddTransactionDialog({
  accounts,
  currency,
  children,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
      currency,
      isRecurring: false,
    },
  });

  const type = watch("type");
  const isRecurring = watch("isRecurring");

  async function handleReceiptScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const res = await fetch("/api/receipts/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setScanResult(data);
        setValue("amount", String(data.total ?? ""));
        setValue("description", data.merchant ?? "");
        setValue("date", data.date ?? new Date().toISOString().split("T")[0]);
        setValue("category", data.category ?? "Shopping");
        setValue("type", "EXPENSE");
        toast.success("Receipt scanned successfully!");
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Failed to scan receipt. Please enter details manually.");
    } finally {
      setScanning(false);
    }
  }

  async function onSubmit(data: FormData) {
    try {
      await createTransaction({
  ...data,
  amount: parseFloat(data.amount),
  tags: [], // ✅ default empty tags
  status: "COMPLETED", // ✅ default status
});
      toast.success("Transaction added successfully!");
      reset();
      setScanResult(null);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error("Failed to add transaction. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Transaction
          </DialogTitle>
        </DialogHeader>

        {/* Receipt Scanner */}
        <div className="bg-muted/40 rounded-xl p-3 border border-dashed border-border">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReceiptScan}
          />
          <Button
            type="button"
            variant="ghost"
            className="w-full h-9 gap-2 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => fileRef.current?.click()}
            disabled={scanning}
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {scanning ? "Scanning with AI..." : "Scan Receipt with AI"}
            <Badge className="ml-1 h-4 px-1 text-[10px] bg-primary/20 text-primary border-0">
              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
              AI
            </Badge>
          </Button>
          {scanResult && (
            <div className="mt-2 text-xs text-emerald-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Receipt from {scanResult.merchant} detected • Confidence: {Math.round((scanResult.confidence ?? 0) * 100)}%
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Transaction Type</Label>
            <div className="flex gap-2">
              {(["EXPENSE", "INCOME", "TRANSFER"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("type", t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    type === t
                      ? t === "INCOME"
                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                        : t === "EXPENSE"
                        ? "bg-red-500/20 text-red-500 border border-red-500/30"
                        : "bg-blue-500/20 text-blue-500 border border-blue-500/30"
                      : "bg-muted text-muted-foreground border border-transparent"
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Amount</Label>
              <Input
                {...register("amount")}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Currency</Label>
              <Input {...register("currency")} className="h-9" maxLength={3} />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Description</Label>
            <Input {...register("description")} placeholder="What was this for?" className="h-9" />
          </div>

          {/* Category + Account */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
              <Select onValueChange={(v) => setValue("category", v)} defaultValue="Other">
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Account</Label>
              <Select onValueChange={(v) => setValue("accountId", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Date</Label>
            <Input {...register("date")} type="date" className="h-9" />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm">Recurring Transaction</Label>
              <p className="text-xs text-muted-foreground">Repeat automatically</p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={(v) => setValue("isRecurring", v)}
            />
          </div>

          {isRecurring && (
            <Select onValueChange={(v) => setValue("recurringInterval", v as any)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map((i) => (
                  <SelectItem key={i} value={i}>
                    {i.charAt(0) + i.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Add Transaction"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
