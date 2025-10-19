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

export interface CepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}
