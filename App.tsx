
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppTab, Order, Department, FurnitureItem, Customer, UserProfile, UserRole, UserStatus, Organization, Supervisor } from './types';
import { DEPARTMENT_ORDER, DEPARTMENT_COLORS, COMPANY_INFO } from './constants';
import { CalendarIcon, DownloadIcon, PrintIcon, PlusIcon, TrashIcon } from './components/Icons';
import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, collection, doc, setDoc, onSnapshot, query, getDoc, updateDoc, runTransaction, addDoc, deleteDoc } from './firebase';


// Use jsPDF from window object
declare const jspdf: any;
declare const html2canvas: any;

const ADMIN_EMAIL = 'info@nieuwe-nostalgie.nl';

// --- Login Screen Component ---
const LoginScreen = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError('Ongeldige e-mail of wachtwoord.');
            } else {
                setError('Er is een onbekende fout opgetreden.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Wachtwoorden komen niet overeen.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, "gebruikers", user.uid), {
                uid: user.uid,
                email: user.email,
                role: UserRole.Medewerker,
                status: UserStatus.Pending,
                createdAt: new Date().toISOString()
            });
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Dit e-mailadres is al in gebruik.');
            } else if (err.code === 'auth/weak-password') {
                setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
            } else {
                setError('Er is een onbekende fout opgetreden bij het registreren.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        <span className="text-blue-600 dark:text-blue-400">Nieuwe Nostalgie</span> Planner
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {mode === 'login' ? 'Log in om door te gaan' : 'Maak een nieuw account aan'}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="E-mailadres"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 ${mode === 'login' ? 'rounded-b-md' : ''} focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                placeholder="Wachtwoord"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                         {mode === 'register' && (
                            <div>
                                <input
                                    id="confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Bevestig Wachtwoord"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                             {loading ? (mode === 'login' ? 'Inloggen...' : 'Registreren...') : (mode === 'login' ? 'Log in' : 'Registreer')}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button 
                        type="button" 
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); clearForm(); }} 
                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        {mode === 'login' ? 'Nog geen account? Registreer hier.' : 'Al een account? Log hier in.'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PendingApprovalScreen = () => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Account in afwachting</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Uw account is succesvol aangemaakt, maar moet nog worden goedgekeurd door een beheerder. U krijgt toegang zodra een afdeling is toegewezen.</p>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                    Uitloggen
                </button>
            </div>
        </div>
    );
};

const InactiveAccountScreen = () => {
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Account Gedeactiveerd</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Uw account is momenteel niet actief. Neem contact op met de beheerder voor meer informatie.</p>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                    Uitloggen
                </button>
            </div>
        </div>
    );
};

// --- Add/Edit Organization Modal ---
interface AddEditOrganizationModalProps {
    organization: Organization | null;
    onClose: () => void;
    onSave: (orgData: Omit<Organization, 'id'>) => Promise<string | void>;
}

const AddEditOrganizationModal: React.FC<AddEditOrganizationModalProps> = ({ organization, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [logo, setLogo] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (organization) {
            setName(organization.name);
            setAddress(organization.address || '');
            setPhone(organization.phone || '');
            setLogo(organization.logo || null);
        }
    }, [organization]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await onSave({ name, address, phone, logo: logo || '' });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">{organization ? 'Organisatie Bewerken' : 'Nieuwe Organisatie'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Naam" value={name} onChange={e => setName(e.target.value)} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="text" placeholder="Adres" value={address} onChange={e => setAddress(e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="tel" placeholder="Telefoon" value={phone} onChange={e => setPhone(e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        {logo && <img src={logo} alt="logo preview" className="mt-4 h-24 w-auto object-contain rounded bg-gray-100 dark:bg-gray-700 p-2"/>}
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {isSaving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Organizations View ---
interface OrganizationsViewProps {
    organizations: Organization[];
    onAddOrganization: (orgData: Omit<Organization, 'id'>) => Promise<string | void>;
    onUpdateOrganization: (org: Organization) => Promise<void>;
}

const OrganizationsView: React.FC<OrganizationsViewProps> = ({ organizations, onAddOrganization, onUpdateOrganization }) => {
    const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

    const handleOpenAdd = () => {
        setSelectedOrg(null);
        setIsAddEditModalOpen(true);
    };

    const handleOpenEdit = (org: Organization) => {
        setSelectedOrg(org);
        setIsAddEditModalOpen(true);
    };
    
    const handleSaveOrganization = async (orgData: Omit<Organization, 'id'>) => {
        if (selectedOrg) { // Editing
            await onUpdateOrganization({ ...selectedOrg, ...orgData });
        } else { // Adding
            await onAddOrganization(orgData);
        }
        setIsAddEditModalOpen(false);
        setSelectedOrg(null);
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {isAddEditModalOpen && (
                <AddEditOrganizationModal
                    organization={selectedOrg}
                    onClose={() => {
                        setIsAddEditModalOpen(false);
                        setSelectedOrg(null);
                    }}
                    onSave={handleSaveOrganization}
                />
            )}
           
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Organisaties</h2>
                 <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                     <PlusIcon className="w-5 h-5"/> Nieuwe Organisatie Toevoegen
                 </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map(org => (
                    <div key={org.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 border dark:border-gray-600 rounded-lg shadow-sm flex flex-col justify-between">
                        <div className="flex-grow">
                             {org.logo ? (
                                <img src={org.logo} alt={`${org.name} logo`} className="h-16 w-auto object-contain mb-4 rounded"/>
                             ) : (
                                <div className="h-16 w-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center rounded mb-4">
                                    <span className="text-gray-400 dark:text-gray-500 text-sm">Geen logo</span>
                                </div>
                             )}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">{org.name}</h3>
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {org.address && <p>{org.address}</p>}
                                {org.phone && <p>{org.phone}</p>}
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-gray-600 flex flex-col sm:flex-row gap-2">
                             <button onClick={() => handleOpenEdit(org)} className="w-full px-3 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700">Wijzigen</button>
                        </div>
                    </div>
                ))}
                 {organizations.length === 0 && <p className="text-gray-500 dark:text-gray-400 md:col-span-2 lg:col-span-3">Er zijn nog geen organisaties toegevoegd.</p>}
            </div>
        </div>
    );
};

// --- Users View ---
interface UsersViewProps {
    users: UserProfile[];
    onUpdateUser: (uid: string, data: Partial<UserProfile>) => void;
    currentUserEmail: string;
    organizations: Organization[];
    supervisors: Supervisor[];
}

const UsersView: React.FC<UsersViewProps> = ({ users, onUpdateUser, currentUserEmail, organizations, supervisors }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Medewerkers</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-mail</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Afdeling</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisatie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Begeleider</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => {
                            const isCurrentUser = user.email === currentUserEmail;
                            const supervisorsForOrg = supervisors.filter(s => s.organizationId === user.organizationId);
                            return (
                                <tr key={user.uid}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={user.role}
                                            onChange={(e) => onUpdateUser(user.uid, { role: e.target.value as UserRole })}
                                            disabled={isCurrentUser}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                                        >
                                            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={user.department || ''}
                                            onChange={(e) => onUpdateUser(user.uid, { department: e.target.value as Department })}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"
                                        >
                                            <option value="">Geen</option>
                                            {Object.values(Department).map(dept => <option key={dept} value={dept}>{dept}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={user.organizationId || ''}
                                            onChange={(e) => onUpdateUser(user.uid, { organizationId: e.target.value, supervisorId: '' })}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"
                                        >
                                            <option value="">Geen</option>
                                            {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                        </select>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={user.supervisorId || ''}
                                            onChange={(e) => onUpdateUser(user.uid, { supervisorId: e.target.value })}
                                            disabled={!user.organizationId || supervisorsForOrg.length === 0}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                                        >
                                            <option value="">Geen</option>
                                            {supervisorsForOrg.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={user.status}
                                            onChange={(e) => onUpdateUser(user.uid, { status: e.target.value as UserStatus })}
                                            disabled={isCurrentUser}
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600"
                                        >
                                            {Object.values(UserStatus).map(status => <option key={status} value={status}>{status}</option>)}
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


// --- Supervisors View ---
interface SupervisorsViewProps {
    supervisors: Supervisor[];
    organizations: Organization[];
    onAddSupervisor: (data: Omit<Supervisor, 'id'>) => Promise<void>;
    onUpdateSupervisor: (supervisor: Supervisor) => Promise<void>;
    onDeleteSupervisor: (id: string) => Promise<void>;
    onAddOrganization: (orgData: Omit<Organization, 'id'>) => Promise<string | void>;
}

const SupervisorsView: React.FC<SupervisorsViewProps> = ({ supervisors, organizations, onAddSupervisor, onUpdateSupervisor, onDeleteSupervisor, onAddOrganization }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupervisor, setSelectedSupervisor] = useState<Supervisor | null>(null);

    const handleOpenAdd = () => {
        setSelectedSupervisor(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (supervisor: Supervisor) => {
        setSelectedSupervisor(supervisor);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<Supervisor, 'id'>) => {
        if (selectedSupervisor) {
            await onUpdateSupervisor({ ...data, id: selectedSupervisor.id });
        } else {
            await onAddSupervisor(data);
        }
        setIsModalOpen(false);
    };
    
    const organizationMap = useMemo(() => 
        organizations.reduce((acc, org) => {
            acc[org.id] = org.name;
            return acc;
        }, {} as Record<string, string>), 
    [organizations]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
             {isModalOpen && (
                <AddEditSupervisorModal
                    supervisor={selectedSupervisor}
                    organizations={organizations}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    onAddOrganization={onAddOrganization}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Begeleiders</h2>
                 <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                     <PlusIcon className="w-5 h-5"/> Nieuwe Begeleider
                 </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">E-mail</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefoon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisatie</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {supervisors.map(s => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{s.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{s.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{s.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{organizationMap[s.organizationId] || 'Onbekend'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                                    <button onClick={() => handleOpenEdit(s)} className="text-blue-600 hover:text-blue-900">Wijzigen</button>
                                    <button onClick={() => onDeleteSupervisor(s.id)} className="text-red-600 hover:text-red-900">Verwijderen</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Add/Edit Supervisor Modal ---
interface AddEditSupervisorModalProps {
    supervisor: Supervisor | null;
    organizations: Organization[];
    onClose: () => void;
    onSave: (data: Omit<Supervisor, 'id'>) => Promise<void>;
    onAddOrganization: (orgData: Omit<Organization, 'id'>) => Promise<string | void>;
}

const AddEditSupervisorModal: React.FC<AddEditSupervisorModalProps> = ({ supervisor, organizations, onClose, onSave, onAddOrganization }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [organizationId, setOrganizationId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isAddingOrg, setIsAddingOrg] = useState(false);

    useEffect(() => {
        if (supervisor) {
            setName(supervisor.name);
            setEmail(supervisor.email);
            setPhone(supervisor.phone);
            setOrganizationId(supervisor.organizationId);
        }
    }, [supervisor]);

    const handleSaveNewOrg = async (orgData: Omit<Organization, 'id'>) => {
        const newOrgId = await onAddOrganization(orgData);
        if (newOrgId) {
            setOrganizationId(newOrgId);
        }
        setIsAddingOrg(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organizationId) {
            alert("Selecteer een organisatie.");
            return;
        }
        setIsSaving(true);
        await onSave({ name, email, phone, organizationId });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {isAddingOrg && (
                <AddEditOrganizationModal 
                    organization={null} 
                    onClose={() => setIsAddingOrg(false)}
                    onSave={handleSaveNewOrg}
                />
            )}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl">
                <h2 className="text-2xl font-bold mb-6">{supervisor ? 'Begeleider Bewerken' : 'Nieuwe Begeleider'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Naam" value={name} onChange={e => setName(e.target.value)} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="tel" placeholder="Telefoon" value={phone} onChange={e => setPhone(e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    
                    <div>
                        <label className="block text-sm font-medium">Organisatie</label>
                        <div className="flex items-center gap-2 mt-1">
                            <select value={organizationId} onChange={e => setOrganizationId(e.target.value)} required className="flex-grow block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700">
                                <option value="">Selecteer een organisatie...</option>
                                {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIsAddingOrg(true)} className="px-3 py-2 text-sm rounded-md border text-blue-600 border-blue-600 hover:bg-blue-50">Nieuw</button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {isSaving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- User Management View ---
interface UserManagementViewProps {
    users: UserProfile[];
    onUpdateUser: (uid: string, data: Partial<UserProfile>) => void;
    currentUserEmail: string;
    organizations: Organization[];
    supervisors: Supervisor[];
    onAddOrganization: (orgData: Omit<Organization, 'id'>) => Promise<string | void>;
    onUpdateOrganization: (org: Organization) => Promise<void>;
    onAddSupervisor: (data: Omit<Supervisor, 'id'>) => Promise<void>;
    onUpdateSupervisor: (supervisor: Supervisor) => Promise<void>;
    onDeleteSupervisor: (id: string) => Promise<void>;
}

const UserManagementView: React.FC<UserManagementViewProps> = (props) => {
    const [activeSubTab, setActiveSubTab] = useState<'medewerkers' | 'organisaties' | 'begeleiders'>('medewerkers');

    return (
        <div>
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveSubTab('medewerkers')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'medewerkers' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Medewerkers
                    </button>
                    <button
                        onClick={() => setActiveSubTab('organisaties')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'organisaties' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Organisaties
                    </button>
                     <button
                        onClick={() => setActiveSubTab('begeleiders')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSubTab === 'begeleiders' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Begeleiders
                    </button>
                </nav>
            </div>
            {activeSubTab === 'medewerkers' ? (
                <UsersView 
                    users={props.users} 
                    onUpdateUser={props.onUpdateUser} 
                    currentUserEmail={props.currentUserEmail}
                    organizations={props.organizations} 
                    supervisors={props.supervisors}
                />
            ) : activeSubTab === 'organisaties' ? (
                <OrganizationsView 
                    organizations={props.organizations}
                    onAddOrganization={props.onAddOrganization}
                    onUpdateOrganization={props.onUpdateOrganization}
                />
            ) : (
                <SupervisorsView 
                    supervisors={props.supervisors}
                    organizations={props.organizations}
                    onAddSupervisor={props.onAddSupervisor}
                    onUpdateSupervisor={props.onUpdateSupervisor}
                    onDeleteSupervisor={props.onDeleteSupervisor}
                    onAddOrganization={props.onAddOrganization}
                />
            )}
        </div>
    );
};


// --- Main App Component ---
const PlannerApp = ({ userProfile, allUsers, onUpdateUser }: { userProfile: UserProfile, allUsers: UserProfile[], onUpdateUser: (uid: string, data: Partial<UserProfile>) => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [deliveryScheduleInfo, setDeliveryScheduleInfo] = useState<Order | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  useEffect(() => {
    setLoadingOrders(true);
    const q = query(collection(db, "opdrachten"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
            ordersData.push({ ...doc.data(), orderNumber: doc.id } as Order);
        });
        setOrders(ordersData.sort((a, b) => parseInt(b.orderNumber) - parseInt(a.orderNumber)));
        setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const q = query(collection(db, "organisaties"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const orgsData: Organization[] = [];
        querySnapshot.forEach((doc) => {
            orgsData.push({ ...doc.data(), id: doc.id } as Organization);
        });
        setOrganizations(orgsData.sort((a,b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
}, []);

 useEffect(() => {
    const q = query(collection(db, "begeleiders"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const supervisorsData: Supervisor[] = [];
        querySnapshot.forEach((doc) => {
            supervisorsData.push({ ...doc.data(), id: doc.id } as Supervisor);
        });
        setSupervisors(supervisorsData.sort((a,b) => a.name.localeCompare(b.name)));
    });
    return () => unsubscribe();
}, []);


  useEffect(() => {
    if (userProfile.role === UserRole.Medewerker) {
      const allowedTabs: AppTab[] = ['dashboard', 'mijn-account'];
      if (!allowedTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, userProfile.role]);

  const addOrder = async (order: Order) => {
    try {
        await setDoc(doc(db, "opdrachten", order.orderNumber), order);
        const customerDocRef = doc(db, "klanten", order.customer.phone);
        await setDoc(customerDocRef, {
            ...order.customer,
            lastOrderDate: order.pickupDate,
        }, { merge: true });
    } catch (error) {
        console.error("Error adding order to Firestore: ", error);
        alert("Kon de opdracht niet toevoegen. Probeer het opnieuw.");
    }
  };

  const updateOrder = async (updatedOrder: Order) => {
    try {
        const orderDocRef = doc(db, "opdrachten", updatedOrder.orderNumber);
        await setDoc(orderDocRef, updatedOrder, { merge: true });
    } catch (error) {
        console.error("Error updating order in Firestore: ", error);
        alert("Kon de opdracht niet bijwerken. Probeer het opnieuw.");
    }
  };
  
    const addOrganization = async (orgData: Omit<Organization, 'id'>) => {
        try {
            const newDocRef = await addDoc(collection(db, "organisaties"), orgData);
            return newDocRef.id;
        } catch (error) {
            console.error("Error adding organization: ", error);
            alert("Kon de organisatie niet toevoegen.");
        }
    };
    
    const updateOrganization = async (org: Organization) => {
        try {
            const { id, ...data } = org;
            const orgDocRef = doc(db, "organisaties", id);
            await setDoc(orgDocRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating organization: ", error);
            alert("Kon de organisatie niet bijwerken.");
        }
    };

    const addSupervisor = async (data: Omit<Supervisor, 'id'>) => {
        try {
            await addDoc(collection(db, "begeleiders"), data);
        } catch (error) {
             console.error("Error adding supervisor: ", error);
            alert("Kon de begeleider niet toevoegen.");
        }
    };

    const updateSupervisor = async (supervisor: Supervisor) => {
        try {
            const { id, ...data } = supervisor;
            await setDoc(doc(db, "begeleiders", id), data, { merge: true });
        } catch (error) {
            console.error("Error updating supervisor: ", error);
            alert("Kon de begeleider niet bijwerken.");
        }
    };

    const deleteSupervisor = async (id: string) => {
        if (window.confirm("Weet u zeker dat u deze begeleider wilt verwijderen?")) {
            try {
                await deleteDoc(doc(db, "begeleiders", id));
            } catch (error) {
                console.error("Error deleting supervisor: ", error);
                alert("Kon de begeleider niet verwijderen.");
            }
        }
    };

  const handleScheduleAndOpenCalendar = (order: Order, date: string, time: string) => {
    if (!date || !time) return;
    const fullDeliveryDate = new Date(`${date}T${time}`);
    const calendarUrl = generateGoogleCalendarUrl(fullDeliveryDate, order, 'Bezorgen');
    window.open(calendarUrl, '_blank');
    
    updateOrder({ ...order, deliveryDate: fullDeliveryDate.toISOString() });
    setDeliveryScheduleInfo(null);
  };
  
  const updateFurnitureDepartment = (orderNumber: string, furnitureId: string, newDepartment: Department) => {
      const orderToUpdate = orders.find(o => o.orderNumber === orderNumber);
      if (!orderToUpdate) return;
  
      const newFurniture = orderToUpdate.furniture.map(item =>
          item.id === furnitureId ? { ...item, department: newDepartment } : item
      );
      
      const updatedOrder = { ...orderToUpdate, furniture: newFurniture };
  
      updateOrder(updatedOrder);
      
      if (newDepartment === Department.Bezorgen) {
          const isOrderComplete = updatedOrder.furniture.every(f => f.department === Department.Bezorgen);
          if (isOrderComplete) {
              setDeliveryScheduleInfo(updatedOrder);
          }
      }
  };

  const updateFurniturePriority = async (orderNumber: string, furnitureId: string, newPriority: number) => {
    const orderToUpdate = orders.find(o => o.orderNumber === orderNumber);
    if (!orderToUpdate) return;

    const newFurniture = orderToUpdate.furniture.map(item =>
        item.id === furnitureId ? { ...item, priority: newPriority } : item
    );
    
    const updatedOrder = { ...orderToUpdate, furniture: newFurniture };
    updateOrder(updatedOrder);
  };

  const renderContent = () => {
    if (loadingOrders) {
        return <div className="text-center p-8">Opdrachten laden...</div>;
    }
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard orders={orders} onUpdateFurnitureDepartment={updateFurnitureDepartment} userProfile={userProfile} onUpdateFurniturePriority={updateFurniturePriority} />;
      case 'nieuwe-opdracht':
        return <NewOrderForm addOrder={addOrder} setActiveTab={setActiveTab} />;
      case 'klanten':
        return <CustomersView orders={orders} onUpdateOrder={updateOrder} />;
      case 'vervoer':
        return <TransportView orders={orders} updateOrder={updateOrder} />;
      case 'gebruikers':
        if (userProfile.role !== UserRole.Beheerder) return <p>Geen toegang</p>;
        return <UserManagementView 
                    users={allUsers} 
                    onUpdateUser={onUpdateUser} 
                    currentUserEmail={userProfile.email}
                    organizations={organizations}
                    supervisors={supervisors}
                    onAddOrganization={addOrganization}
                    onUpdateOrganization={updateOrganization}
                    onAddSupervisor={addSupervisor}
                    onUpdateSupervisor={updateSupervisor}
                    onDeleteSupervisor={deleteSupervisor}
                />;
      case 'mijn-account':
          return <MyAccountView userProfile={userProfile} organizations={organizations} supervisors={supervisors} />;
      default:
        return <Dashboard orders={orders} onUpdateFurnitureDepartment={updateFurnitureDepartment} userProfile={userProfile} onUpdateFurniturePriority={updateFurniturePriority}/>;
    }
  };

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200">
       <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              .printable-content, .printable-content * {
                visibility: visible;
              }
              .printable-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: auto;
                margin: 0;
                padding: 0;
                border: none !important;
                box-shadow: none !important;
              }
              body, html {
                background: white !important;
                color: black !important;
              }
            }
          `}</style>
       {deliveryScheduleInfo && (
            <ScheduleDeliveryModal 
                order={deliveryScheduleInfo}
                onClose={() => setDeliveryScheduleInfo(null)}
                onSchedule={handleScheduleAndOpenCalendar}
            />
        )}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, "gebruikers", currentUser.uid);
                const docSnap = await getDoc(userDocRef);

                if (docSnap.exists()) {
                    setUserProfile(docSnap.data() as UserProfile);
                } else {
                    const isBeheerder = currentUser.email === ADMIN_EMAIL;
                    const newProfile: UserProfile = {
                        uid: currentUser.uid,
                        email: currentUser.email!,
                        role: isBeheerder ? UserRole.Beheerder : UserRole.Medewerker,
                        status: isBeheerder ? UserStatus.Active : UserStatus.Pending,
                    };
                    await setDoc(userDocRef, newProfile);
                    setUserProfile(newProfile);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (userProfile && userProfile.role === UserRole.Beheerder) {
            const usersQuery = query(collection(db, "gebruikers"));
            const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
                const usersData: UserProfile[] = [];
                snapshot.forEach(doc => usersData.push(doc.data() as UserProfile));
                setAllUsers(usersData.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '')));
            });
            return () => unsubscribeUsers();
        } else {
            setAllUsers([]);
        }
    }, [userProfile]);

    const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
        const userDocRef = doc(db, "gebruikers", uid);
        try {
            await updateDoc(userDocRef, data);
        } catch (error) {
            console.error("Error updating user profile:", error);
            alert("Kon de gebruiker niet bijwerken.");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Authenticatie controleren...</div>;
    }

    if (!user) {
        return <LoginScreen />;
    }
    
    if (!userProfile) {
        return <div className="flex items-center justify-center min-h-screen">Gebruikersprofiel laden...</div>;
    }
    
    if (userProfile.status === UserStatus.Inactive) {
        return <InactiveAccountScreen />;
    }
    
    if (userProfile.status === UserStatus.Pending) {
        return <PendingApprovalScreen />;
    }

    return <PlannerApp userProfile={userProfile} allUsers={allUsers} onUpdateUser={handleUpdateUser} />;
}


// --- Helper Functions ---
const generateGoogleCalendarUrl = (startDateTime: Date, order: Order, type: 'Ophalen' | 'Bezorgen') => {
    const endTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); 
    const toISOStringWithoutDashesAndColons = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const gCalTitle = encodeURIComponent(`${type}: ${order.title} - ${order.customer.name}`);
    const gCalDates = `${toISOStringWithoutDashesAndColons(startDateTime)}/${toISOStringWithoutDashesAndColons(endTime)}`;
    const gCalDetails = encodeURIComponent(`Opdracht: ${order.title}\nKlant: ${order.customer.name}\nTelefoon: ${order.customer.phone}\n\nMeubels:\n${order.furniture.map(f => `- ${f.type}`).join('\n')}`);
    const gCalLocation = encodeURIComponent(order.customer.address);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${gCalTitle}&dates=${gCalDates}&details=${gCalDetails}&location=${gCalLocation}`;
};

// --- My Account View ---
const MyAccountView: React.FC<{ userProfile: UserProfile, organizations: Organization[], supervisors: Supervisor[] }> = ({ userProfile, organizations, supervisors }) => {
    const organizationName = useMemo(() => {
        if (!userProfile.organizationId) return 'Niet toegewezen';
        return organizations.find(org => org.id === userProfile.organizationId)?.name || 'Onbekende Organisatie';
    }, [userProfile, organizations]);

    const supervisorName = useMemo(() => {
        if (!userProfile.supervisorId) return 'Niet toegewezen';
        return supervisors.find(sup => sup.id === userProfile.supervisorId)?.name || 'Onbekende Begeleider';
    }, [userProfile, supervisors]);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white border-b pb-4">Mijn Account</h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">E-mailadres</p>
                    <p className="text-lg">{userProfile.email}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rol</p>
                    <p className="text-lg">{userProfile.role}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Afdeling</p>
                    <p className="text-lg">{userProfile.department || 'Niet toegewezen'}</p>
                </div>
                 <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organisatie</p>
                    <p className="text-lg">{organizationName}</p>
                </div>
                 <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Begeleider</p>
                    <p className="text-lg">{supervisorName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${userProfile.status === UserStatus.Active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {userProfile.status}
                    </span>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Neem contact op met de beheerder (<a href={`mailto:${ADMIN_EMAIL}`} className="text-blue-600 hover:underline">{ADMIN_EMAIL}</a>) om uw gegevens te wijzigen.
                </p>
            </div>
        </div>
    );
};


// --- Header Component ---
const Header: React.FC<{ activeTab: AppTab, setActiveTab: (tab: AppTab) => void, userProfile: UserProfile }> = ({ activeTab, setActiveTab, userProfile }) => {
  // FIX: Added explicit return type to ensure `tab.id` is inferred as `AppTab` instead of `string`.
  const getTabs = (): { id: AppTab; name: string }[] => {
    if (userProfile.role === UserRole.Medewerker) {
        return [
            { id: 'dashboard', name: 'Dashboard' },
            { id: 'mijn-account', name: 'Mijn Account' },
        ];
    }
    
    const allTabs: { id: AppTab; name: string }[] = [
        { id: 'dashboard', name: 'Dashboard' },
        { id: 'nieuwe-opdracht', name: 'Nieuwe Opdracht' },
        { id: 'klanten', name: 'Klanten' },
        { id: 'vervoer', name: 'Vervoer' },
    ];

    if (userProfile.role === UserRole.Beheerder) {
        allTabs.push({ id: 'gebruikers', name: 'Medewerkers' });
    }
    allTabs.push({ id: 'mijn-account', name: 'Mijn Account' });
    return allTabs;
  };
  const tabs = getTabs();
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md non-printable">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            <span className="text-blue-600 dark:text-blue-400">Nieuwe Nostalgie</span> Planner
          </h1>
          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex space-x-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
             <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
              >
                Uitloggen
              </button>
          </div>
        </div>
        <div className="md:hidden">
            <select
                // Fix: Correctly handle tab change to ensure type safety. The value from the event target is a string,
                // and we need to ensure it's a valid AppTab before setting the state.
                onChange={(e) => {
                    const selectedTab = tabs.find(tab => tab.id === e.target.value);
                    if (selectedTab) {
                        setActiveTab(selectedTab.id);
                    }
                }}
                value={activeTab}
                className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 mb-2"
            >
                {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.name}</option>)}
            </select>
        </div>
      </div>
    </header>
  );
};


// --- Dashboard/Kanban Component ---
interface DashboardProps {
  orders: Order[];
  onUpdateFurnitureDepartment: (orderNumber: string, furnitureId: string, newDepartment: Department) => void;
  userProfile: UserProfile;
  onUpdateFurniturePriority: (orderNumber: string, furnitureId: string, newPriority: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, onUpdateFurnitureDepartment, userProfile, onUpdateFurniturePriority }) => {
    const [isDragging, setIsDragging] = useState(false);
    
    const furnitureByDepartment = useMemo(() => {
        const grouped: { [key in Department]?: (FurnitureItem & { order: Order })[] } = {};
        orders.forEach(order => {
            if (order.status === 'Actief' && order.furniture) {
                order.furniture.forEach(item => {
                    if (!grouped[item.department]) {
                        grouped[item.department] = [];
                    }
                    grouped[item.department]!.push({ ...item, order });
                });
            }
        });

        for (const department in grouped) {
            if (grouped.hasOwnProperty(department)) {
                grouped[department as Department]!.sort((a, b) => (a.priority || 0) - (b.priority || 0));
            }
        }

        return grouped;
    }, [orders]);

    const departmentsToDisplay = useMemo(() => {
        if (userProfile.role === UserRole.Medewerker && userProfile.department) {
            return DEPARTMENT_ORDER.filter(dep => dep === userProfile.department);
        }
        return DEPARTMENT_ORDER;
    }, [userProfile]);


    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Workflow Dashboard</h2>
            <div className={`grid gap-6 ${departmentsToDisplay.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {departmentsToDisplay.map(department => (
                    <KanbanColumn
                        key={department}
                        department={department}
                        items={furnitureByDepartment[department] || []}
                        onUpdateFurnitureDepartment={onUpdateFurnitureDepartment}
                        userProfile={userProfile}
                        isDragging={isDragging}
                        setIsDragging={setIsDragging}
                        onUpdateFurniturePriority={onUpdateFurniturePriority}
                    />
                ))}
            </div>
        </div>
    );
};

interface DropZoneProps {
    onDrop: (e: React.DragEvent) => void;
    isVisible: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, isVisible }) => {
    const [show, setShow] = useState(false);

    if (!isVisible) return null;

    return (
        <div
            onDragEnter={(e) => { e.preventDefault(); setShow(true); }}
            onDragLeave={(e) => { e.preventDefault(); setShow(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); setShow(false); onDrop(e); }}
            className={`transition-all duration-200 ease-in-out ${show ? 'h-16 my-2 rounded-lg bg-blue-200 dark:bg-blue-800 bg-opacity-50' : 'h-2'}`}
        />
    );
};


interface KanbanColumnProps {
    department: Department;
    items: (FurnitureItem & { order: Order })[];
    onUpdateFurnitureDepartment: (orderNumber: string, furnitureId: string, newDepartment: Department) => void;
    userProfile: UserProfile;
    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;
    onUpdateFurniturePriority: (orderNumber: string, furnitureId: string, newPriority: number) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ department, items, onUpdateFurnitureDepartment, userProfile, isDragging, setIsDragging, onUpdateFurniturePriority }) => {
    const colorClasses = DEPARTMENT_COLORS[department] || 'bg-gray-200 text-gray-800';
    const canReorder = userProfile.role === UserRole.Beheerder;

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        const { furnitureId, orderNumber, sourceDepartment } = data;

        if (sourceDepartment !== department) {
            // This logic is for reordering, not for moving between departments
            return;
        }

        const itemsInColumn = items.filter(item => item.id !== furnitureId);
        
        const prevItem = itemsInColumn[dropIndex - 1];
        const nextItem = itemsInColumn[dropIndex];

        const prevPriority = prevItem ? (prevItem.priority || 0) : 0;
        
        let newPriority;
        if (nextItem) {
            newPriority = (prevPriority + (nextItem.priority || 0)) / 2;
        } else {
            newPriority = prevPriority + 1024;
        }

        onUpdateFurniturePriority(orderNumber, furnitureId, newPriority);
    };

    const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
        const currentItem = items[currentIndex];
        let newPriority: number;

        if (direction === 'up' && currentIndex > 0) {
            const prevItem = items[currentIndex - 1];
            const itemBeforePrev = items[currentIndex - 2];
            const prevPriority = prevItem.priority || 0;
            const beforePrevPriority = itemBeforePrev ? (itemBeforePrev.priority || 0) : 0;
            newPriority = (prevPriority + beforePrevPriority) / 2;
        } else if (direction === 'down' && currentIndex < items.length - 1) {
            const nextItem = items[currentIndex + 1];
            const itemAfterNext = items[currentIndex + 2];
            const nextPriority = nextItem.priority || 0;
            const afterNextPriority = itemAfterNext ? (itemAfterNext.priority || 0) : (nextPriority + 2048);
            newPriority = (nextPriority + afterNextPriority) / 2;
        } else {
            return; // Cannot move
        }

        onUpdateFurniturePriority(currentItem.order.orderNumber, currentItem.id, newPriority);
    };

    return (
        <div className={`rounded-lg p-4 ${colorClasses.split(' ')[0]} bg-opacity-40 min-h-[200px]`}>
            <h3 className={`font-bold text-lg mb-4 p-2 rounded-md ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]}`}>
                {department} ({items.length})
            </h3>
            <div className="space-y-6">
                {canReorder && <DropZone isVisible={isDragging} onDrop={(e) => handleDrop(e, 0)} />}
                {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <KanbanCard 
                            item={item} 
                            onUpdateFurnitureDepartment={onUpdateFurnitureDepartment} 
                            userProfile={userProfile}
                            isDraggable={canReorder}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/json', JSON.stringify({
                                    furnitureId: item.id,
                                    orderNumber: item.order.orderNumber,
                                    sourceDepartment: item.department
                                }));
                                e.dataTransfer.effectAllowed = 'move';
                                setIsDragging(true);
                            }}
                            onDragEnd={() => setIsDragging(false)}
                            onMoveUp={() => handleMove(index, 'up')}
                            onMoveDown={() => handleMove(index, 'down')}
                            isFirst={index === 0}
                            isLast={index === items.length - 1}
                        />
                        {canReorder && <DropZone isVisible={isDragging} onDrop={(e) => handleDrop(e, index + 1)} />}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

const getDeadlineColor = (pickupDate: string, deadline: string): string => {
    const now = new Date();
    const pickup = new Date(pickupDate);
    const dead = new Date(deadline);
    
    if (!pickupDate || !deadline) return 'border-gray-300';

    const threeDays = 3 * 24 * 60 * 60 * 1000;
    
    if (now.getTime() - pickup.getTime() <= threeDays) {
        return 'border-green-500'; // First 3 days
    } else if (dead.getTime() - now.getTime() <= threeDays) {
        return 'border-red-500'; // Last 3 days
    } else {
        return 'border-orange-500'; // Middle period
    }
};

interface KanbanCardProps {
    item: FurnitureItem & { order: Order };
    onUpdateFurnitureDepartment: (orderNumber: string, furnitureId: string, newDepartment: Department) => void;
    userProfile: UserProfile;
    isDraggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}

const KanbanCard: React.FC<KanbanCardProps> = ({ item, onUpdateFurnitureDepartment, userProfile, isDraggable, onDragStart, onDragEnd, onMoveUp, onMoveDown, isFirst, isLast }) => {
    const deadlineColor = getDeadlineColor(item.order.pickupDate, item.order.deadline);

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdateFurnitureDepartment(item.order.orderNumber, item.id, e.target.value as Department);
    };

    const canMoveTask = userProfile.role !== UserRole.Medewerker;
    const canReorder = userProfile.role === UserRole.Beheerder;

    return (
        <div 
            draggable={isDraggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-l-4 ${deadlineColor} ${isDraggable ? 'cursor-grab' : ''}`}
        >
            {item.image && (
                <img src={item.image} alt={item.type} className="w-full h-32 object-cover rounded-md mb-4" />
            )}
            <p className="font-bold text-gray-900 dark:text-white">{item.type}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{item.treatment}"</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Opdracht: #{item.order.orderNumber}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Klant: {item.order.customer.name} {item.order.customer.customerNumber && `(#${item.order.customer.customerNumber})`}</p>
            
            <div className="mt-4 flex justify-between items-end">
                <div>
                    <label htmlFor={`dept-${item.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {canMoveTask ? 'Verplaats naar:' : 'Huidige afdeling:'}
                    </label>
                    <select
                        id={`dept-${item.id}`}
                        value={item.department}
                        onChange={handleDepartmentChange}
                        disabled={!canMoveTask}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600 disabled:text-gray-500"
                    >
                        {DEPARTMENT_ORDER.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                {canReorder && (
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={onMoveUp}
                            disabled={isFirst}
                            aria-label="Verplaats omhoog"
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                        </button>
                        <button
                            onClick={onMoveDown}
                            disabled={isLast}
                            aria-label="Verplaats omlaag"
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- New Order Form Component ---
interface NewOrderFormProps {
    addOrder: (order: Order) => void;
    setActiveTab: (tab: AppTab) => void;
}
const NewOrderForm: React.FC<NewOrderFormProps> = ({ addOrder, setActiveTab }) => {
    const [title, setTitle] = useState('');
    const [customer, setCustomer] = useState<Customer>({ name: '', address: '', phone: '', email: '', customerNumber: '' });
    const [pickupDate, setPickupDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [deliveryCost, setDeliveryCost] = useState(0);
    const [furniture, setFurniture] = useState<Omit<FurnitureItem, 'id' | 'department' | 'priority'>[]>([{ type: '', price: 0, image: '', treatment: '' }]);

    const handleAddFurniture = () => {
        setFurniture([...furniture, { type: '', price: 0, image: '', treatment: '' }]);
    };

    const handleRemoveFurniture = (index: number) => {
        setFurniture(furniture.filter((_, i) => i !== index));
    };

    const handleFurnitureChange = (index: number, field: keyof Omit<FurnitureItem, 'id' | 'department' | 'priority'>, value: string | number) => {
        const newFurniture = [...furniture];
        (newFurniture[index] as any)[field] = value;
        setFurniture(newFurniture);
    };

    const handleImageUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleFurnitureChange(index, 'image', reader.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!customer.phone || customer.phone.length < 5) {
            alert("Telefoonnummer is ongeldig of te kort.");
            return;
        }

        const customerNumber = customer.phone.slice(-5);
        const customerData: Customer = { ...customer, customerNumber };
        
        const counterRef = doc(db, "counters", "orderCounter");
        let newOrderNumberStr: string;

        try {
            const newOrderNumber = await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                let lastNumber = 20250074; // Start one below the first desired number
                if (counterDoc.exists()) {
                    lastNumber = counterDoc.data().lastOrderNumber;
                }
                const nextNumber = lastNumber + 1;
                transaction.set(counterRef, { lastOrderNumber: nextNumber });
                return nextNumber;
            });
            newOrderNumberStr = String(newOrderNumber);
        } catch (error) {
            console.error("Transaction for new order number failed: ", error);
            alert("Kon geen uniek opdrachtnummer genereren. Probeer het later opnieuw.");
            return;
        }


        const fullPickupDate = new Date(`${pickupDate}T${pickupTime}`);
        const deadline = new Date(fullPickupDate.getTime() + 14 * 24 * 60 * 60 * 1000);

        const newOrder: Order = {
            orderNumber: newOrderNumberStr,
            title,
            customer: customerData,
            pickupDate: fullPickupDate.toISOString(),
            deadline: deadline.toISOString(),
            deliveryCost,
            furniture: furniture.map((f, index) => ({
                ...f,
                id: `${newOrderNumberStr}-${Math.random().toString(36).substr(2, 9)}`,
                department: Department.Ophalen,
                priority: (index + 1) * 1024,
            })),
            status: 'Actief',
        };

        await addOrder(newOrder);
        
        const calendarUrl = generateGoogleCalendarUrl(fullPickupDate, newOrder, 'Ophalen');
        window.open(calendarUrl, '_blank');
        
        setActiveTab('dashboard');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white border-b pb-4">Nieuwe Opdracht Aanmaken</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titel</label>
                    <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700"/>
                </div>
            </div>

            <fieldset className="border p-4 rounded-md">
                <legend className="text-xl font-semibold px-2">Klantgegevens</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <input type="text" placeholder="Naam" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="text" placeholder="Adres" value={customer.address} onChange={e => setCustomer({...customer, address: e.target.value})} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="tel" placeholder="Telefoonnummer" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    <input type="email" placeholder="E-mail" value={customer.email} onChange={e => setCustomer({...customer, email: e.target.value})} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                </div>
            </fieldset>

             <fieldset className="border p-4 rounded-md">
                <legend className="text-xl font-semibold px-2">Planning & Kosten</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div>
                        <label htmlFor="pickupDate" className="block text-sm font-medium">Ophaaldatum</label>
                        <input type="date" id="pickupDate" value={pickupDate} onChange={e => setPickupDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    </div>
                    <div>
                        <label htmlFor="pickupTime" className="block text-sm font-medium">Ophaaltijd</label>
                        <input type="time" id="pickupTime" value={pickupTime} onChange={e => setPickupTime(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                    </div>
                     <div>
                        <label htmlFor="deliveryCost" className="block text-sm font-medium">Bezorgkosten (€)</label>
                        <input type="number" id="deliveryCost" value={deliveryCost} onChange={e => setDeliveryCost(parseFloat(e.target.value) || 0)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" />
                    </div>
                </div>
             </fieldset>
            
            <div>
                <h3 className="text-xl font-semibold mb-4">Meubels</h3>
                {furniture.map((item, index) => (
                    <div key={index} className="border p-4 rounded-md mb-4 relative bg-gray-50 dark:bg-gray-700">
                        <button type="button" onClick={() => handleRemoveFurniture(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Soort meubel" value={item.type} onChange={e => handleFurnitureChange(index, 'type', e.target.value)} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800"/>
                            <input type="number" placeholder="Prijs" value={item.price} onChange={e => handleFurnitureChange(index, 'price', parseFloat(e.target.value) || 0)} required className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800"/>
                            <textarea placeholder="Behandeling" value={item.treatment} onChange={e => handleFurnitureChange(index, 'treatment', e.target.value)} required className="md:col-span-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800"/>
                            <div>
                                <label className="block text-sm font-medium">Afbeelding</label>
                                <input type="file" accept="image/*" onChange={e => handleImageUpload(index, e)} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                                {item.image && <img src={item.image} alt="preview" className="mt-2 h-20 w-20 object-cover rounded"/>}
                            </div>
                        </div>
                    </div>
                ))}
                <button type="button" onClick={handleAddFurniture} className="mt-2 flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                    <PlusIcon className="w-5 h-5"/> Meubel Toevoegen
                </button>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Opdracht Aanmaken & Ophalen Inplannen
                </button>
            </div>
        </form>
    );
};

// --- Customers View ---
interface CustomersViewProps {
    orders: Order[];
    onUpdateOrder: (order: Order) => void;
}

const CustomersView: React.FC<CustomersViewProps> = ({ orders, onUpdateOrder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return orders;
        const lowercasedFilter = searchTerm.toLowerCase();
        return orders.filter(order =>
            order.customer.name.toLowerCase().includes(lowercasedFilter) ||
            order.orderNumber.includes(lowercasedFilter) ||
            order.customer.address.toLowerCase().includes(lowercasedFilter) ||
            order.customer.phone.replace(/\s/g, '').includes(lowercasedFilter.replace(/\s/g, ''))
        );
    }, [orders, searchTerm]);

    const exportToCsv = (ordersToExport: Order[]) => {
        const headers = [
            'Opdrachtnummer',
            'Klantnummer',
            'Klantnaam',
            'Adres',
            'Telefoon',
            'Email',
            'Ophaaldatum',
            'Meubel Soort',
            'Behandeling',
            'Prijs Meubel',
            'Status Opdracht'
        ];

        const escapeCsvField = (field: any): string => {
            const str = String(field ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        const rows = ordersToExport.flatMap(order => 
            order.furniture.map(item => [
                order.orderNumber,
                order.customer.customerNumber,
                order.customer.name,
                order.customer.address,
                order.customer.phone,
                order.customer.email,
                new Date(order.pickupDate).toLocaleDateString('nl-NL'),
                item.type,
                item.treatment,
                item.price.toFixed(2),
                order.status
            ].map(escapeCsvField))
        );

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'klantgegevens_nieuwe_nostalgie.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    if (selectedOrder) {
        return <CustomerDetails order={selectedOrder} onBack={() => setSelectedOrder(null)} onUpdateOrder={onUpdateOrder} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Klantenoverzicht</h2>
                <button 
                    onClick={() => exportToCsv(orders)} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                    <DownloadIcon className="w-5 h-5" />
                    Exporteer Klantgegevens
                </button>
            </div>

            <input
                type="text"
                placeholder="Zoek op naam, adres, tel. of opdrachtnummer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-3 mb-6 border rounded-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            />
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Opdrachtnr.</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Klantnaam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefoon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredOrders.map(order => (
                            <tr key={order.orderNumber} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.orderNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{order.customer.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Actief' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Customer Details ---
interface CustomerDetailsProps {
    order: Order;
    onBack: () => void;
    onUpdateOrder: (order: Order) => void;
}
const CustomerDetails: React.FC<CustomerDetailsProps> = ({ order, onBack, onUpdateOrder }) => {
    const tasksReady = order.furniture.filter(f => f.department === Department.Bezorgen).length;
    const totalTasks = order.furniture.length;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <button onClick={onBack} className="mb-4 text-blue-600 dark:text-blue-400 hover:underline non-printable">&larr; Terug naar overzicht</button>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{order.customer.name}</h2>
                    <p className="text-gray-500 dark:text-gray-400">Opdracht #{order.orderNumber} - {order.title}</p>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-lg">{`${tasksReady} / ${totalTasks}`}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">taken klaar voor bezorging</p>
                </div>
            </div>
            <div className="mt-6 border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Meubels in Opdracht</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {order.furniture.map(item => (
                        <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm">
                            <img src={item.image} alt={item.type} className="w-full h-48 object-cover" />
                            <div className="p-4">
                                <h4 className="font-bold">{item.type}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{item.treatment}</p>
                                <p className="font-semibold mt-2">€{item.price.toFixed(2)}</p>
                                <p className={`mt-2 text-sm font-medium p-1 rounded-md inline-block ${DEPARTMENT_COLORS[item.department]}`}>
                                    {item.department}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// --- Transport View ---
const TransportView: React.FC<{ orders: Order[], updateOrder: (order: Order) => void }> = ({ orders, updateOrder }) => {
    const [transportTab, setTransportTab] = useState<'planning' | 'facturen'>('planning');
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const ordersReadyForDelivery = orders.filter(o => 
        o.furniture.every(f => f.department === Department.Bezorgen) && o.status === 'Actief'
    );

    const renderPlanningContent = () => {
        if (selectedDate) {
            return <TransportDayPlanner 
                        date={selectedDate} 
                        orders={orders} 
                        onBack={() => setSelectedDate(null)} 
                    />;
        }
        return <TransportKanbanView orders={orders} onSelectDate={setSelectedDate} />;
    };

    return (
        <div>
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 non-printable">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setTransportTab('planning')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${transportTab === 'planning' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Routeplanning
                    </button>
                    <button
                        onClick={() => setTransportTab('facturen')}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${transportTab === 'facturen' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                        Facturen ({ordersReadyForDelivery.length})
                    </button>
                </nav>
            </div>
            {transportTab === 'planning' ? renderPlanningContent() : <InvoiceList orders={ordersReadyForDelivery} updateOrder={updateOrder} />}
        </div>
    );
};


// --- Transport Kanban View ---
const TransportKanbanView: React.FC<{orders: Order[], onSelectDate: (date: string) => void}> = ({ orders, onSelectDate }) => {
    const transportDays = useMemo(() => {
        const dates = new Map<string, { pickups: number, deliveries: number }>();
        
        orders.forEach(order => {
            if (order.status !== 'Actief') return;

            const pickupDate = new Date(order.pickupDate).toISOString().split('T')[0];
            if (!dates.has(pickupDate)) dates.set(pickupDate, { pickups: 0, deliveries: 0 });
            dates.get(pickupDate)!.pickups += 1;

            if (order.deliveryDate) {
                const deliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
                if (!dates.has(deliveryDate)) dates.set(deliveryDate, { pickups: 0, deliveries: 0 });
                dates.get(deliveryDate)!.deliveries += 1;
            }
        });

        return Array.from(dates.entries())
            .map(([date, counts]) => ({ date, ...counts }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    }, [orders]);

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Transport Dagen</h2>
            <div className="flex flex-col space-y-4">
                {transportDays.map(({ date, pickups, deliveries }) => (
                    <div 
                        key={date} 
                        onClick={() => onSelectDate(date)}
                        className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-xl transition-shadow"
                    >
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            {new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <div className="mt-4 space-y-2">
                            {pickups > 0 && <p className="text-sm"><span className="font-semibold text-purple-600 dark:text-purple-400">{pickups}</span> Ophaalmoment(en)</p>}
                            {deliveries > 0 && <p className="text-sm"><span className="font-semibold text-green-600 dark:text-green-400">{deliveries}</span> Bezorging(en)</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Transport Day Planner ---
interface RouteStop {
    id: string; // combination of orderNumber and type
    type: 'Ophalen' | 'Bezorgen';
    order: Order;
    notes: string;
}

const TransportDayPlanner: React.FC<{ date: string; orders: Order[]; onBack: () => void; }> = ({ date, orders, onBack }) => {
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [view, setView] = useState<'planning' | 'overview'>('planning');

    useEffect(() => {
        const isSameDay = (d1Str: string, d2Str: string) => new Date(d1Str).toISOString().split('T')[0] === new Date(d2Str).toISOString().split('T')[0];

        const pickupsForDate = orders
            .filter(o => o.status === 'Actief' && isSameDay(o.pickupDate, date))
            .map(o => ({ id: `${o.orderNumber}-pickup`, type: 'Ophalen' as const, order: o, notes: '' }));
    
        const deliveriesForDate = orders
            .filter(o => o.deliveryDate && isSameDay(o.deliveryDate, date))
            .map(o => ({ id: `${o.orderNumber}-delivery`, type: 'Bezorgen' as const, order: o, notes: '' }));

        setStops([...pickupsForDate, ...deliveriesForDate]);
    }, [date, orders]);

    const moveStop = (index: number, direction: 'up' | 'down') => {
        const newStops = [...stops];
        if (direction === 'up' && index > 0) {
            [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
        }
        if (direction === 'down' && index < stops.length - 1) {
            [newStops[index + 1], newStops[index]] = [newStops[index], newStops[index + 1]];
        }
        setStops(newStops);
    };
    
    const handleNoteChange = (index: number, newNote: string) => {
        const newStops = [...stops];
        newStops[index].notes = newNote;
        setStops(newStops);
    };

    const loadingList = useMemo(() => stops
      .filter(s => s.type === 'Bezorgen')
      .flatMap(s => s.order.furniture.map(f => ({...f, customerName: s.order.customer.name})))
    , [stops]);


    if (view === 'overview') {
        return (
            <div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg mb-6 flex justify-between items-center non-printable">
                    <button onClick={() => setView('planning')} className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Wijzig Planning</button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700">
                        <PrintIcon className="w-5 h-5"/> Print Lijst
                    </button>
                </div>
                <div id="printable-list" className="printable-content bg-white p-8 text-black">
                     <h1 className="text-3xl font-bold mb-4">Daglijst Vervoer - {new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
                
                     <div className="mb-8 no-break">
                         <h2 className="text-2xl font-bold mb-4 border-b pb-2">Laadlijst (Bezorgingen)</h2>
                         {loadingList.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {loadingList.map(item => (
                                    <div key={item.id} className="border rounded-lg p-2 text-center">
                                        <img src={item.image} alt={item.type} className="w-full h-24 object-cover mb-2 rounded-md" />
                                        <p className="font-semibold text-sm">{item.type}</p>
                                        <p className="text-xs italic">Voor: {item.customerName}</p>
                                    </div>
                                ))}
                            </div>
                         ) : <p>Geen meubels om te laden voor bezorging vandaag.</p>}
                     </div>

                     <div className="page-break"></div>

                     <h2 className="text-2xl font-bold mb-4 border-b pb-2">Route</h2>
                      {stops.map((stop, index) => (
                        <div key={stop.id} className="mb-6 pb-4 border-b last:border-b-0 no-break">
                            <h3 className="text-xl font-bold mb-2">Stop {index + 1}: {stop.type}</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p><span className="font-semibold">Klant:</span> {stop.order.customer.name}</p>
                                    <p><span className="font-semibold">Adres:</span> {stop.order.customer.address}</p>
                                    <p><span className="font-semibold">Telefoon:</span> {stop.order.customer.phone}</p>
                                </div>
                                <div>
                                    {stop.type === 'Bezorgen' && (
                                        <div className="p-2 bg-yellow-100 border border-yellow-300 font-bold text-lg text-yellow-900">
                                            Te innen: €{(stop.order.furniture.reduce((sum, item) => sum + item.price, 0) + stop.order.deliveryCost).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2">
                                <p className="font-semibold">Betreft meubels:</p>
                                <ul className="list-disc list-inside ml-4">
                                    {stop.order.furniture.map(item => <li key={item.id}>{item.type}</li>)}
                                </ul>
                            </div>
                            {stop.notes && (
                                <div className="mt-2 p-2 bg-gray-100 border">
                                    <p className="font-semibold">Notities:</p>
                                    <p className="whitespace-pre-wrap">{stop.notes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
               <div>
                   <button onClick={onBack} className="text-blue-600 dark:text-blue-400 hover:underline mb-2">&larr; Terug naar overzicht</button>
                   <h2 className="text-2xl font-bold">Planning voor {new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
               </div>
               <button onClick={() => setView('overview')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                   Keur planning goed & Bekijk Overzicht &rarr;
               </button>
            </div>
            
            <div className="space-y-4">
                {stops.map((stop, index) => (
                    <div key={stop.id} className="flex items-start gap-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                        <div className="flex flex-col items-center">
                            <button onClick={() => moveStop(index, 'up')} disabled={index === 0} className="disabled:opacity-20 text-gray-500 hover:text-black dark:hover:text-white">▲</button>
                            <span className="font-bold text-lg">{index + 1}</span>
                            <button onClick={() => moveStop(index, 'down')} disabled={index === stops.length - 1} className="disabled:opacity-20 text-gray-500 hover:text-black dark:hover:text-white">▼</button>
                        </div>
                        <div className="flex-grow">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stop.type === 'Ophalen' ? 'bg-purple-200 text-purple-800' : 'bg-green-200 text-green-800'}`}>
                                {stop.type}
                            </span>
                            <p className="font-bold text-lg mt-1">{stop.order.customer.name}</p>
                            <p className="text-gray-600 dark:text-gray-300">{stop.order.customer.address}</p>
                            <div className="mt-2">
                                <h4 className="font-semibold text-sm">Meubels:</h4>
                                <ul className="list-disc list-inside text-sm">
                                    {stop.order.furniture.map(item => <li key={item.id}>{item.type}</li>)}
                                </ul>
                            </div>
                            {stop.type === 'Bezorgen' && (
                                <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md border border-yellow-300">
                                    <p className="font-bold text-yellow-800 dark:text-yellow-200">
                                        Af te rekenen: €{(stop.order.furniture.reduce((sum, item) => sum + item.price, 0) + stop.order.deliveryCost).toFixed(2)}
                                    </p>
                                </div>
                            )}
                            <div className="mt-2">
                                <label className="block text-sm font-medium">Notities voor bezorger:</label>
                                <textarea 
                                    value={stop.notes}
                                    onChange={(e) => handleNoteChange(index, e.target.value)}
                                    rows={2}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800"
                                    placeholder="Bijv. bellen bij aankomst, code portiek is 1234..."
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Invoice List ---
const InvoiceList: React.FC<{ orders: Order[], updateOrder: (order: Order) => void }> = ({ orders, updateOrder }) => {
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

    if (selectedOrderForInvoice) {
        return <Invoice order={selectedOrderForInvoice} onBack={() => setSelectedOrderForInvoice(null)} updateOrder={updateOrder} />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Facturen Klaar voor Verzending</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">Deze opdrachten zijn volledig afgerond en klaar voor bezorging.</p>
            <ul className="space-y-3">
                {orders.map(order => (
                    <li key={order.orderNumber} onClick={() => setSelectedOrderForInvoice(order)}
                        className="p-4 border rounded-md flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div>
                            <p className="font-semibold">#{order.orderNumber} - {order.customer.name}</p>
                            <p className="text-sm text-gray-500">{order.title}</p>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">Bekijk Factuur &rarr;</span>
                    </li>
                ))}
                {orders.length === 0 && <p>Geen facturen beschikbaar.</p>}
            </ul>
        </div>
    );
};


// --- Invoice Component ---
const Invoice: React.FC<{ order: Order, onBack: () => void, updateOrder: (order: Order) => void }> = ({ order, onBack, updateOrder }) => {
    const invoiceRef = React.useRef<HTMLDivElement>(null);
    const subtotal = order.furniture.reduce((acc, item) => acc + item.price, 0);
    const total = subtotal + order.deliveryCost;

    const downloadPdf = async () => {
        const { jsPDF } = jspdf;
        if (!invoiceRef.current) return;
        const canvas = await html2canvas(invoiceRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`factuur-${order.orderNumber}.pdf`);
        updateOrder({...order, status: 'Voltooid' });
    };
    
    const printInvoice = () => {
        window.print();
        setTimeout(() => {
           updateOrder({...order, status: 'Voltooid' });
        }, 1000); 
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-4 non-printable">
                <button onClick={onBack} className="text-blue-600 dark:text-blue-400 hover:underline">&larr; Terug naar lijst</button>
                 <button onClick={downloadPdf} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                    <DownloadIcon className="w-5 h-5"/> Download als PDF
                </button>
                <button onClick={printInvoice} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700">
                    <PrintIcon className="w-5 h-5"/> Print Factuur
                </button>
            </div>
            <div id="invoice-printable" ref={invoiceRef} className="printable-content p-12 bg-white text-black mx-auto border shadow-lg" style={{width: '210mm', minHeight: '297mm'}}>
                <header className="flex justify-between items-start pb-6 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{COMPANY_INFO.name}</h1>
                        <p>{COMPANY_INFO.address}</p>
                    </div>
                    <h2 className="text-4xl font-light text-gray-600">FACTUUR</h2>
                </header>
                <section className="flex justify-between my-8">
                    <div>
                        <h3 className="font-semibold mb-2">Factuur aan:</h3>
                        <p className="font-bold">{order.customer.name}</p>
                        <p>{order.customer.address}</p>
                        <p>{order.customer.phone}</p>
                        <p>{order.customer.email}</p>
                    </div>
                    <div className="text-right">
                        <p><span className="font-semibold">Factuurnummer:</span> {order.orderNumber}</p>
                        <p><span className="font-semibold">Factuurdatum:</span> {new Date().toLocaleDateString('nl-NL')}</p>
                        <p><span className="font-semibold">Ophaaldatum:</span> {new Date(order.pickupDate).toLocaleDateString('nl-NL')}</p>
                    </div>
                </section>
                <section>
                    <table className="w-full text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 font-semibold">Omschrijving</th>
                                <th className="p-3 font-semibold text-right">Prijs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.furniture.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">
                                        <p className="font-medium">{item.type}</p>
                                        <p className="text-sm text-gray-600">{item.treatment}</p>
                                    </td>
                                    <td className="p-3 text-right">€{item.price.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
                <section className="flex justify-end mt-8">
                    <div className="w-full md:w-1/3">
                        <div className="flex justify-between">
                            <span>Subtotaal:</span>
                            <span>€{subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Bezorgkosten:</span>
                            <span>€{order.deliveryCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-xl mt-4 border-t pt-2">
                            <span>Totaal:</span>
                            <span>€{total.toFixed(2)}</span>
                        </div>
                    </div>
                </section>
                <footer className="mt-16 border-t pt-6 text-sm text-gray-600 text-center">
                    <p>Bedankt voor uw opdracht!</p>
                    <p>Graag het totaalbedrag overmaken op {COMPANY_INFO.iban} t.n.v. {COMPANY_INFO.name} o.v.v. factuurnummer {order.orderNumber}</p>
                    <p className="mt-2 text-xs">{COMPANY_INFO.name} | KVK: {COMPANY_INFO.kvk} | BTW: {COMPANY_INFO.btw}</p>
                </footer>
            </div>
        </div>
    );
};

// --- Schedule Delivery Modal ---
interface ScheduleDeliveryModalProps {
    order: Order;
    onClose: () => void;
    onSchedule: (order: Order, date: string, time: string) => void;
}
const ScheduleDeliveryModal: React.FC<ScheduleDeliveryModalProps> = ({ order, onClose, onSchedule }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (date && time) {
            onSchedule(order, date, time);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 non-printable">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Bezorging Inplannen</h2>
                <p className="mb-6">Alle meubels voor opdracht <strong>#{order.orderNumber} ({order.customer.name})</strong> zijn klaar. Plan nu de bezorging in.</p>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label htmlFor="deliveryDate" className="block text-sm font-medium">Bezorgdatum</label>
                            <input type="date" id="deliveryDate" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                        </div>
                        <div>
                            <label htmlFor="deliveryTime" className="block text-sm font-medium">Bezorgtijd</label>
                            <input type="time" id="deliveryTime" value={time} onChange={e => setTime(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5"/> Inplannen in Agenda
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};