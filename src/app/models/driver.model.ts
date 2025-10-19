export interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  password: string;
  vehicle: string;
  createdAt: string;
}

export interface DriverLoginRequest {
  email: string;
  password: string;
}

export interface DriverRegisterRequest {
  name: string;
  phone: string;
  email: string;
  password: string;
  vehicle: string;
}
