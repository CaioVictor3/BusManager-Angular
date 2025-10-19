export interface Student {
  id: number;
  name: string;
  phone: string;
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  returnAddress?: string;
  going: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StudentFormData {
  name: string;
  phone: string;
  cep: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  returnAddress?: string;
}
