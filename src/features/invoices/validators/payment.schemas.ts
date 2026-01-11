import { z } from "zod";

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  method: z.string().min(2),
  paidAt: z.coerce.date().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
