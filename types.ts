export enum UserRole {
  Beheerder = "Beheerder",
  Teamleider = "Teamleider",
  Medewerker = "Medewerker",
}

export enum UserStatus {
    Pending = "Pending",
    Active = "Active",
    Inactive = "Inactive",
}

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    department?: Department;
    createdAt?: string;
}

export enum Department {
  Ophalen = "Ophalen",
  Demonteren = "Demonteren",
  ZandstralenM1 = "Zandstralen M1",
  ZandstralenM2 = "Zandstralen M2",
  SchurenM1 = "Schuren M1",
  SchurenM2 = "Schuren M2",
  Spuiten = "Spuiten",
  Monteren = "Monteren",
  Bezorgen = "Bezorgen",
}

export interface FurnitureItem {
  id: string;
  type: string;
  price: number;
  image: string; // base64 string
  treatment: string;
  department: Department;
  priority: number;
}

export interface Customer {
  customerNumber: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Order {
  orderNumber: string; // Oplopend nummer
  title: string;
  customer: Customer;
  furniture: FurnitureItem[];
  pickupDate: string; // ISO string
  deadline: string; // ISO string
  deliveryCost: number;
  deliveryDate?: string; // ISO string for delivery
  status: 'Actief' | 'Voltooid';
}

export type AppTab = 'dashboard' | 'nieuwe-opdracht' | 'klanten' | 'vervoer' | 'gebruikers' | 'mijn-account';