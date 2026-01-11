export interface IPayment {
  id: string;
  userId: string;
  invoiceId: string;
  amount: number;
  method: string;
  paidAt: Date;
  createdAt: Date;
}
