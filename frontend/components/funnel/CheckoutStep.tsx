"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { copy } from "@/data/copy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPlateStyleLabel } from "@/data/plateStyles";
import { useFunnelStore } from "@/store/funnelStore";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import { formatAmount } from "@/lib/utils";
import { createOrder, type CreateOrderPayload } from "@/lib/api";
import {
  buildTrackingContext,
  newEventId,
  trackEvent,
} from "@/lib/tracking";

export function CheckoutStep() {
  const items = useFunnelStore((s) => s.items);
  const total = useFunnelStore((s) => s.total());
  const setSubmitted = useFunnelStore((s) => s.setSubmitted);

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      // payment intentionally has NO default
      paymentMethod: undefined as unknown as CheckoutInput["paymentMethod"],
    },
  });

  const paymentMethod = watch("paymentMethod");

  const onSubmit = async (values: CheckoutInput) => {
    setServerError(null);

    const eventId = newEventId();
    trackEvent("SubmitOrder", { stepName: "checkout", eventId });

    const ctx = buildTrackingContext();
    const payload: CreateOrderPayload = {
      customer_name: values.customerName.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      payment_method: values.paymentMethod,
      items: items.map((it) => ({
        plate_style: it.plateStyle,
        ...(it.plateLetter ? { plate_letter: it.plateLetter } : {}),
        ...(it.plateNumber ? { plate_number: it.plateNumber } : {}),
      })),
      tracking: { event_id: eventId, ...ctx },
    };

    try {
      const res = await createOrder(payload);

      // Purchase event (same dedupe id family); never blocks the redirect.
      trackEvent("Purchase", {
        stepName: "thank_you",
        extra: { order_number: res.order_number, value: res.total },
      });

      setSubmitted({
        orderNumber: res.order_number,
        total: res.total,
        currency: res.currency,
        quantity: res.quantity,
        whatsappUrl: res.whatsapp_url,
      });

      // Open WhatsApp with the short prefilled message returned by the server.
      if (typeof window !== "undefined" && res.whatsapp_url) {
        window.open(res.whatsapp_url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setServerError(copy.checkout.errors.generic);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-center text-2xl font-extrabold text-charcoal">
        {copy.checkout.title}
      </h2>

      {/* Selected items review */}
      <div className="rounded-lg border border-warmgray bg-white p-5 shadow-soft">
        <h3 className="mb-3 text-sm font-bold text-charcoal">
          {copy.checkout.itemsTitle}
        </h3>
        <ul className="space-y-2">
          {items.map((item, idx) => {
            const isCustom = item.plateStyle === "custom_choice";
            return (
              <li
                key={item.id}
                className="flex items-center justify-between border-b border-warmgray/60 pb-2 text-sm last:border-0 last:pb-0"
              >
                <span className="font-semibold text-charcoal">
                  {idx + 1}. {getPlateStyleLabel(item.plateStyle)}
                </span>
                <span className="text-muted">
                  {isCustom ? (
                    copy.checkout.customItemNote
                  ) : (
                    <span dir="ltr">
                      {item.plateLetter ? `${item.plateLetter} ` : ""}
                      {item.plateNumber}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="customerName">{copy.checkout.nameLabel}</Label>
          <Input
            id="customerName"
            placeholder={copy.checkout.namePlaceholder}
            {...register("customerName")}
          />
          {errors.customerName ? (
            <p className="field-error">{copy.checkout.errors.name}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="phone">{copy.checkout.phoneLabel}</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            placeholder={copy.checkout.phonePlaceholder}
            {...register("phone")}
          />
          {errors.phone ? (
            <p className="field-error">{copy.checkout.errors.phone}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="address">{copy.checkout.addressLabel}</Label>
          <Textarea
            id="address"
            placeholder={copy.checkout.addressPlaceholder}
            {...register("address")}
          />
          {errors.address ? (
            <p className="field-error">{copy.checkout.errors.address}</p>
          ) : null}
        </div>

        <div>
          <Label>{copy.checkout.paymentLabel}</Label>
          <div className="grid grid-cols-2 gap-3">
            <PaymentOption
              label={copy.checkout.paymentCash}
              value="cash"
              selected={paymentMethod === "cash"}
              onSelect={() =>
                setValue("paymentMethod", "cash", { shouldValidate: true })
              }
            />
            <PaymentOption
              label={copy.checkout.paymentTransfer}
              value="fawran_transfer"
              selected={paymentMethod === "fawran_transfer"}
              onSelect={() =>
                setValue("paymentMethod", "fawran_transfer", {
                  shouldValidate: true,
                })
              }
            />
          </div>
          {errors.paymentMethod ? (
            <p className="field-error">{copy.checkout.errors.payment}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-maroon/20 bg-maroon/5 px-4 py-3">
          <span className="font-bold text-charcoal">
            {copy.summary.totalLabel}
          </span>
          <span className="text-lg font-extrabold text-maroon">
            {formatAmount(total)} {copy.common.currency}
          </span>
        </div>

        {serverError ? (
          <p className="field-error text-center">{serverError}</p>
        ) : null}

        <Button
          type="submit"
          size="full"
          disabled={isSubmitting}
          className="text-lg"
        >
          {isSubmitting ? copy.checkout.submitting : copy.checkout.submit}
        </Button>
      </form>
    </div>
  );
}

function PaymentOption({
  label,
  value,
  selected,
  onSelect,
}: {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-value={value}
      className={cn(
        "flex h-12 items-center justify-center rounded-md border text-base font-bold transition-all",
        selected
          ? "border-maroon bg-maroon text-white"
          : "border-warmgray bg-white text-charcoal hover:border-maroon/50"
      )}
    >
      {label}
    </button>
  );
}
