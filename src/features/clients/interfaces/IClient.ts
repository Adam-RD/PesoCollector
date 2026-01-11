export interface IClient {
  id: string;
  userId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
