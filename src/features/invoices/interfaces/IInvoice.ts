import { InvoiceStatus } from "@prisma/client";
import { IClient } from "@/features/clients/interfaces/IClient";
import { IPayment } from "./IPayment";

export interface IInvoice {
  id: string;
  clientId: string;
  userId: string;
  description?: string | null;
  amount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  client?: IClient;
  payments?: IPayment[];
  createdAt: Date;
  updatedAt: Date;
}
