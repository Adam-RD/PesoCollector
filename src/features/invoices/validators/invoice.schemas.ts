import { z } from "zod";

export const invoiceSchema = z.object({
  clientId: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  paidAmount: z.number().min(0).optional(),
  status: z.enum(["PENDING", "PAID"]).default("PENDING"),
  dueDate: z.coerce.date(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
