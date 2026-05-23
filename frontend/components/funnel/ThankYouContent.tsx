"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { copy } from "@/data/copy";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils";
import type { SubmittedOrder } from "@/store/funnelStore";

export function ThankYouContent({ order }: { order: SubmittedOrder }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto max-w-md space-y-6 text-center"
    >
      <div className="flex justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-9 w-9 text-success" />
        </span>
      </div>

      <h1 className="text-2xl font-extrabold text-charcoal">
        {copy.thankYou.title}
      </h1>

      <div className="space-y-3 rounded-lg border border-warmgray bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">
            {copy.thankYou.orderNumberLabel}
          </span>
          <span dir="ltr" className="font-extrabold text-charcoal">
            {order.orderNumber}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-warmgray/60 pt-3">
          <span className="text-sm text-muted">{copy.thankYou.totalLabel}</span>
          <span className="font-extrabold text-maroon">
            {formatAmount(order.total)} {copy.common.currencyShort}
          </span>
        </div>
      </div>

      <p className="text-base leading-8 text-muted">{copy.thankYou.note}</p>

      <div className="space-y-3">
        {order.whatsappUrl ? (
          <a
            href={order.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button size="full" className="bg-success hover:bg-success/90">
              <MessageCircle className="h-5 w-5" />
              {copy.thankYou.whatsappButton}
            </Button>
          </a>
        ) : null}

        <Link href="/" className="block">
          <Button size="full" variant="outline">
            {copy.thankYou.backHome}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
