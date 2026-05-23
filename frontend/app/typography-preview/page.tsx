/**
 * /typography-preview — internal QA page for the Arabic typography system.
 *
 * REMOVE FOR PRODUCTION (or gate behind NODE_ENV !== 'production'):
 *   delete the folder  frontend/app/typography-preview
 */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SAMPLES = {
  hero: "خل رقم موترك دوم معاك",
  desc:  "ميدالية رقم السيارة بتفصيل أكريليك خاص، السعر 160 ريال شامل التوصيل، والتجهيز والتوصيل خلال 24–48 ساعة داخل قطر.",
  price: "160 ريال قطري شامل التوصيل",
  time:  "التجهيز والتوصيل خلال 24–48 ساعة داخل قطر",
  section: "حدد ستايل اللوحة",
  process: "كيف نشتغل؟",
  step1: "اختار ستايل اللوحة",
  step2: "ارسل الطلب",
  step3: "نجهزها لك",
  step4: "نوصلها لين عندك",
  cta:   "اكمل الطلب",
  cta2:  "ارسل الطلب",
  help:  "تحتاج مساعدة؟",
};

function Row({ token, children }: { token: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#EDEBE8] py-7">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted/80">
        {token}
      </div>
      {children}
    </div>
  );
}

export default function TypographyPreview() {
  return (
    <div className="container-page py-12">
      <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
        <p className="text-caption !text-amber-900">
          صفحة داخلية للمراجعة فقط — احذف{" "}
          <code className="font-mono text-[12px]">app/typography-preview</code>{" "}
          قبل النشر للإنتاج.
        </p>
      </div>

      <h1 className="text-hero mb-2">Typography preview</h1>
      <p className="text-hero-subtitle mb-10 max-w-[480px]">
        نظام كتابة عربي شامل مبني على خط Cairo (Google Fonts). كل العناصر
        التالية تستخدم نفس الـtokens المعرفة في{" "}
        <code className="font-mono text-[12px]">globals.css</code>.
      </p>

      <Row token=".text-hero">
        <h2 className="text-hero">{SAMPLES.hero}</h2>
      </Row>

      <Row token=".text-hero-subtitle">
        <p className="text-hero-subtitle max-w-[480px]">{SAMPLES.desc}</p>
      </Row>

      <Row token=".text-section-title">
        <h3 className="text-section-title">{SAMPLES.process}</h3>
      </Row>

      <Row token=".text-card-title (under icon)">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-[#EDEBE8] bg-white px-4 py-5 shadow-[0_1px_2px_rgba(23,23,23,0.04)]">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F6EBF0] ring-1 ring-maroon/20" />
          <p className="text-card-title">{SAMPLES.step1}</p>
        </div>
      </Row>

      <Row token=".text-card-body">
        <p className="text-card-body max-w-md">{SAMPLES.desc}</p>
      </Row>

      <Row token=".text-button (primary)">
        <div className="flex flex-wrap gap-3">
          <Button size="full" className="max-w-xs">
            {SAMPLES.cta2}
          </Button>
          <Button size="default" variant="outline">
            {SAMPLES.cta}
          </Button>
        </div>
      </Row>

      <Row token=".text-caption (info chip)">
        <div className="flex max-w-xs items-center justify-center gap-2 rounded-lg border border-[#EDEBE8] bg-white px-3 py-2.5">
          <span className="text-caption font-medium !text-charcoal">
            {SAMPLES.price}
          </span>
        </div>
      </Row>

      <Row token=".text-form-label  ·  .text-form-input">
        <div className="max-w-sm space-y-4">
          <div>
            <Label>الاسم</Label>
            <Input placeholder="محمد" defaultValue="محمد العتيبي" />
          </div>
          <div>
            <Label>رقم الجوال</Label>
            <Input placeholder="3xxxxxxx" defaultValue="33423421" dir="ltr" />
          </div>
        </div>
      </Row>

      <Row token="Checkout summary preview">
        <div className="max-w-sm rounded-xl border border-[#EDEBE8] bg-white p-5">
          <h4 className="text-section-title mb-3" style={{ fontSize: "1.0625rem" }}>
            ملخص الطلب
          </h4>
          <div className="flex justify-between text-card-body py-1">
            <span>عدد الميداليات</span>
            <span className="!text-charcoal font-medium">2</span>
          </div>
          <div className="flex justify-between text-card-body py-1">
            <span>الإجمالي</span>
            <span className="!text-charcoal font-medium">260 ريال</span>
          </div>
        </div>
      </Row>

      <Row token="Weight comparison @ 22px">
        <div className="space-y-1">
          <p style={{ fontSize: "22px", fontWeight: 300 }}>{SAMPLES.hero} · 300</p>
          <p style={{ fontSize: "22px", fontWeight: 400 }}>{SAMPLES.hero} · 400</p>
          <p style={{ fontSize: "22px", fontWeight: 500 }}>{SAMPLES.hero} · 500</p>
          <p style={{ fontSize: "22px", fontWeight: 600 }}>{SAMPLES.hero} · 600</p>
          <p style={{ fontSize: "22px", fontWeight: 700 }}>{SAMPLES.hero} · 700</p>
        </div>
      </Row>
    </div>
  );
}
