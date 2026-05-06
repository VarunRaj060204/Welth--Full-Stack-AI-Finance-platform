"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { createBudget } from "@/actions/budgets";
import { TRANSACTION_CATEGORIES } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1).max(50),
  amount: z.string().min(1),
  category: z.string(),
  period: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  startDate: z.string(),
  endDate: z.string(),
  alertAt: z.string().default("80"),
});

type FormData = z.infer<typeof schema>;

export function CreateBudgetDialog({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
      period: "MONTHLY",
      alertAt: "80",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        .toISOString()
        .split("T")[0],
    },
  });

  const period = watch("period");

  // Auto-set end date based on period
  function handlePeriodChange(p: string) {
    setValue("period", p as any);
    const start = new Date();
    let end: Date;
    switch (p) {
      case "WEEKLY":
        end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "QUARTERLY":
        end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
        break;
      case "YEARLY":
        end = new Date(start.getFullYear(), 11, 31);
        break;
      default:
        end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    }
    setValue("endDate", end.toISOString().split("T")[0]);
  }

  async function onSubmit(data: FormData) {
    try {
      await createBudget({
  ...data,
  color: "#6366f1", // ✅ default color (indigo)
  amount: parseFloat(data.amount),
  alertAt: parseInt(data.alertAt),
});
      toast.success("Budget created!");
      reset();
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Failed to create budget");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Budget
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground mb-1.5 block">Budget Name</Label>
              <Input {...register("name")} placeholder="e.g. Monthly Groceries" className="h-9" />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Amount ({currency})</Label>
              <Input
                {...register("amount")}
                type="number"
                step="0.01"
                placeholder="500.00"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Alert at (%)</Label>
              <Input
                {...register("alertAt")}
                type="number"
                min="1"
                max="100"
                placeholder="80"
                className="h-9"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Category</Label>
              <Select onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Period</Label>
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Start Date</Label>
              <Input {...register("startDate")} type="date" className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">End Date</Label>
              <Input {...register("endDate")} type="date" className="h-9" />
            </div>
          </div>

          <Button type="submit" className="w-full h-10" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Budget"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
