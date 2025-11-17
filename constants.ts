
import { Department } from './types';

export const COMPANY_INFO = {
    name: "Nieuwe Nostalgie",
    address: "Rooijakkerstraat 14-6, 5652BB Eindhoven",
    kvk: "17282117",
    btw: "NL001688731B36",
    iban: "NL28 RABO 0147 2504 98"
};

export const DEPARTMENT_COLORS: { [key in Department]: string } = {
    [Department.Ophalen]: "bg-purple-200 text-purple-800 border-purple-400",
    [Department.Demonteren]: "bg-red-200 text-red-800 border-red-400",
    [Department.ZandstralenM1]: "bg-green-200 text-green-800 border-green-400",
    [Department.ZandstralenM2]: "bg-green-400 text-green-900 border-green-600",
    [Department.SchurenM1]: "bg-blue-200 text-blue-800 border-blue-400",
    [Department.SchurenM2]: "bg-blue-400 text-blue-900 border-blue-600",
    [Department.Spuiten]: "bg-yellow-200 text-yellow-800 border-yellow-400",
    [Department.Monteren]: "bg-red-400 text-red-900 border-red-600",
    [Department.Bezorgen]: "bg-purple-400 text-purple-900 border-purple-600",
};

export const DEPARTMENT_ORDER = [
    Department.Ophalen,
    Department.Demonteren,
    Department.ZandstralenM1,
    Department.ZandstralenM2,
    Department.SchurenM1,
    Department.SchurenM2,
    Department.Spuiten,
    Department.Monteren,
    Department.Bezorgen
];
