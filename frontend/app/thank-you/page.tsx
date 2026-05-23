"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFunnelStore } from "@/store/funnelStore";
import { ThankYouContent } from "@/components/funnel/ThankYouContent";

export default function ThankYouPage() {
  const submitted = useFunnelStore((s) => s.submitted);
  const router = useRouter();

  useEffect(() => {
    // If a customer lands here without a completed order, send them home.
    if (!submitted) {
      router.replace("/");
    }
  }, [submitted, router]);

  if (!submitted) {
    return (
      <div className="container-page py-16 text-center text-muted">
        جاري التحويل...
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <ThankYouContent order={submitted} />
    </div>
  );
}
