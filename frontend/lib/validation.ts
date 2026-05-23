import { z } from "zod";

export const plateLetterSchema = z.enum(["Q", "T", "R"]);

export const plateStyleSchema = z.enum([
  "new_2026",
  "private",
  "classic",
  "motorcycle",
  "qatar_side_flag",
  "custom_choice",
]);

export const paymentMethodSchema = z.enum(["cash", "fawran_transfer"]);

/**
 * Single plate-selection form (Step 2). Plate number is required unless custom_choice.
 */
export const plateSelectionSchema = z
  .object({
    plateStyle: plateStyleSchema,
    plateLetter: plateLetterSchema.optional(),
    plateNumber: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.plateStyle !== "custom_choice") {
      if (!data.plateNumber || data.plateNumber.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["plateNumber"],
          message: "اكتب رقم اللوحة",
        });
      }
    }
    if (data.plateStyle === "new_2026" && !data.plateLetter) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["plateLetter"],
        message: "اختار حرف اللوحة",
      });
    }
  });

export type PlateSelectionInput = z.infer<typeof plateSelectionSchema>;

/**
 * Checkout form (Step 4). General required fields per spec; phone is not Qatar-restricted.
 */
export const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, "اكتب اسمك"),
  phone: z.string().trim().min(1, "اكتب رقم جوالك"),
  address: z.string().trim().min(1, "اكتب عنوانك"),
  paymentMethod: paymentMethodSchema,
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
