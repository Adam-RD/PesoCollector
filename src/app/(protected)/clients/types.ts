export type ClientDto = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type ClientWithStats = ClientDto & {
  pending: number;
  paid: number;
};

export type ClientForm = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};
