
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppTab, Order, Department, FurnitureItem, Customer, UserProfile, UserRole, UserStatus, Organization, Supervisor } from './types';
import { DEPARTMENT_ORDER, DEPARTMENT_COLORS, COMPANY_INFO } from './constants';
import { CalendarIcon, DownloadIcon, PrintIcon, PlusIcon, TrashIcon, MenuIcon, XMarkIcon } from './components/Icons';
import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, collection, doc, setDoc, onSnapshot, query, getDoc, updateDoc, runTransaction, deleteDoc, firebaseConfig, initializeApp, deleteApp, getAuth, addDoc } from './firebase';


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

// --- Add User Modal ---
interface AddUserModalProps {
    onClose: () => void;
    onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onUserAdded }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>(UserRole.Medewerker);
    const [department, setDepartment] = useState<Department | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // We use a secondary app instance to create the user so the admin doesn't get signed out
        let secondaryApp: any = null;
        
        try {
            secondaryApp = initializeApp(firebaseConfig, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "gebruikers", user.uid), {
                uid: user.uid,
                email: user.email,
                role: role,
                status: UserStatus.Active,
                department: department || undefined,
                createdAt: new Date().toISOString()
            });

            await signOut(secondaryAuth);
            onUserAdded();
            onClose();

        } catch (err: any) {
            console.error("Error adding user:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError('Dit e-mailadres is al in gebruik.');
            } else if (err.code === 'auth/weak-password') {
                setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
            } else {
                setError('Er is een fout opgetreden: ' + err.message);
            }
        } finally {
            if (secondaryApp) {
                await deleteApp(secondaryApp);
            }
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Nieuwe Medewerker</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Wachtwoord</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                        <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                            {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Afdeling (Optioneel)</label>
                        <select value={department} onChange={e => setDepartment(e.target.value as Department)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                            <option value="">Geen</option>
                            {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Bezig...' : 'Toevoegen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Edit User Modal ---
interface EditUserModalProps {
    user: UserProfile;
    organizations: Organization[];
    supervisors: Supervisor[];
    onClose: () => void;
    onSave: (uid: string, data: Partial<UserProfile>) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, organizations, supervisors, onClose, onSave }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [address, setAddress] = useState(user.address || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [role, setRole] = useState(user.role);
    const [department, setDepartment] = useState<Department | ''>(user.department || '');
    const [status, setStatus] = useState(user.status);
    const [organizationId, setOrganizationId] = useState(user.organizationId || '');
    const [supervisorId, setSupervisorId] = useState(user.supervisorId || '');

    // Filter supervisors based on selected organization
    const filteredSupervisors = useMemo(() => {
        if (!organizationId) return [];
        return supervisors.filter(s => s.organizationId === organizationId);
    }, [organizationId, supervisors]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(user.uid, {
            displayName,
            address,
            phone,
            role,
            department: department || undefined,
            status,
            organizationId: organizationId || undefined,
            supervisorId: supervisorId || undefined
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-2xl h-auto max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Medewerker Bewerken</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                             <input type="text" value={user.email} disabled className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-100 dark:bg-gray-600 p-2 text-gray-500" />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam Medewerker</label>
                            <input 
                                type="text" 
                                value={displayName} 
                                onChange={e => setDisplayName(e.target.value)} 
                                placeholder="Volledige naam"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoonnummer</label>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={e => setPhone(e.target.value)} 
                                placeholder="06 12345678"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adres</label>
                            <input 
                                type="text" 
                                value={address} 
                                onChange={e => setAddress(e.target.value)} 
                                placeholder="Straatnaam 123, 1234AB Plaats"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Afdeling</label>
                            <select value={department} onChange={e => setDepartment(e.target.value as Department)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                                <option value="">Geen</option>
                                {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as UserStatus)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                                <option value={UserStatus.Active}>Actief (Toegang)</option>
                                <option value={UserStatus.Inactive}>Inactief (Geen toegang)</option>
                                <option value={UserStatus.Pending}>In afwachting</option>
                            </select>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 col-span-1 md:col-span-2 pt-4 mt-2">
                             <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Organisatie & Begeleiding</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organisatie</label>
                                    <select value={organizationId} onChange={e => { setOrganizationId(e.target.value); setSupervisorId(''); }} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                                        <option value="">Geen Organisatie</option>
                                        {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Begeleider</label>
                                    <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} disabled={!organizationId} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2 disabled:bg-gray-100 dark:disabled:bg-gray-600">
                                        <option value="">Geen Begeleider</option>
                                        {filteredSupervisors.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
                                    </select>
                                </div>
                             </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Opslaan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Users View ---
interface UsersViewProps {
    users: UserProfile[];
    organizations: Organization[];
    supervisors: Supervisor[];
    onUpdateUser: (uid: string, data: Partial<UserProfile>) => void;
    currentUserEmail: string;
}

const UsersView: React.FC<UsersViewProps> = ({ users, organizations, supervisors, onUpdateUser, currentUserEmail }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    const handleDeleteUser = async (e: React.MouseEvent, uid: string) => {
        e.stopPropagation();
        if (window.confirm("Weet u zeker dat u deze gebruiker wilt verwijderen?")) {
            try {
                await deleteDoc(doc(db, "gebruikers", uid));
            } catch (error) {
                console.error("Fout bij verwijderen gebruiker:", error);
                alert("Kon gebruiker niet verwijderen.");
            }
        }
    };
    
    const getOrgName = (id?: string) => organizations.find(o => o.id === id)?.name || '-';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {isAddModalOpen && (
                <AddUserModal 
                    onClose={() => setIsAddModalOpen(false)} 
                    onUserAdded={() => {}} 
                />
            )}

            {editingUser && (
                <EditUserModal 
                    user={editingUser}
                    organizations={organizations}
                    supervisors={supervisors}
                    onClose={() => setEditingUser(null)}
                    onSave={onUpdateUser}
                />
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Medewerkersbeheer</h2>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    <PlusIcon className="w-5 h-5" />
                    Nieuwe Medewerker
                </button>
            </div>

            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam / Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisatie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map(user => {
                            const isCurrentUser = user.email === currentUserEmail;
                            return (
                                <tr 
                                    key={user.uid} 
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                    onClick={() => !isCurrentUser && setEditingUser(user)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.displayName || user.email}
                                            </span>
                                            {user.displayName && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{user.email}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {user.role} 
                                        {user.department && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.department}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                        {getOrgName(user.organizationId)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            user.status === UserStatus.Active ? 'bg-green-100 text-green-800' : 
                                            user.status === UserStatus.Inactive ? 'bg-red-100 text-red-800' : 
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {user.status === UserStatus.Active ? 'Actief' : user.status === UserStatus.Inactive ? 'Inactief' : 'In afwachting'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {!isCurrentUser ? (
                                            <div className="flex gap-4">
                                                <button className="text-blue-600 hover:text-blue-900 font-medium">Bewerken</button>
                                                <button 
                                                    onClick={(e) => handleDeleteUser(e, user.uid)}
                                                    className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                                    title="Verwijder gebruiker"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-gray-400"> (Uzelf) </span>
                                        )}
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

// --- Organizations View ---
const AddOrganizationModal = ({ onClose, onAdd, organizationToEdit }: { onClose: () => void, onAdd: (org: Organization) => void, organizationToEdit?: Organization }) => {
    const [name, setName] = useState(organizationToEdit?.name || '');
    const [address, setAddress] = useState(organizationToEdit?.address || '');
    const [phone, setPhone] = useState(organizationToEdit?.phone || '');
    const [logo, setLogo] = useState(organizationToEdit?.logo || '');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            id: organizationToEdit?.id || '', // ID handled by parent or Firestore
            name,
            address,
            phone,
            logo
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{organizationToEdit ? 'Organisatie Wijzigen' : 'Organisatie Toevoegen'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adres</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoonnummer</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                        {logo && <img src={logo} alt="Preview" className="mt-2 h-16 object-contain" />}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuleren</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Opslaan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OrganizationsView = ({ organizations }: { organizations: Organization[] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | undefined>(undefined);

    const handleSave = async (org: Organization) => {
        try {
            if (org.id) {
                 await updateDoc(doc(db, "organisaties", org.id), { ...org });
            } else {
                 await addDoc(collection(db, "organisaties"), org);
            }
        } catch (e) {
            console.error("Error saving organization", e);
            alert("Fout bij opslaan organisatie");
        }
    };
    
    const handleDelete = async (id: string) => {
        if(confirm("Weet u zeker dat u deze organisatie wilt verwijderen?")) {
            await deleteDoc(doc(db, "organisaties", id));
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
             {isModalOpen && (
                <AddOrganizationModal 
                    onClose={() => { setIsModalOpen(false); setEditingOrg(undefined); }}
                    onAdd={handleSave}
                    organizationToEdit={editingOrg}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organisaties</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5"/> Nieuwe Organisatie Toevoegen
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map(org => (
                    <div key={org.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                {org.logo ? <img src={org.logo} alt={org.name} className="h-12 w-auto object-contain" /> : <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">?</div>}
                                <div className="flex gap-2">
                                     <button onClick={() => { setEditingOrg(org); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800 text-sm">Wijzigen</button>
                                     <button onClick={() => handleDelete(org.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{org.name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{org.address || 'Geen adres'}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{org.phone || 'Geen telefoon'}</p>
                        </div>
                    </div>
                ))}
                {organizations.length === 0 && <p className="col-span-full text-center text-gray-500">Geen organisaties gevonden.</p>}
            </div>
        </div>
    );
};

// --- Supervisors View ---
const AddSupervisorModal = ({ onClose, onAdd, supervisorToEdit, organizations }: { onClose: () => void, onAdd: (sup: Supervisor) => void, supervisorToEdit?: Supervisor, organizations: Organization[] }) => {
    const [name, setName] = useState(supervisorToEdit?.name || '');
    const [email, setEmail] = useState(supervisorToEdit?.email || '');
    const [phone, setPhone] = useState(supervisorToEdit?.phone || '');
    const [organizationId, setOrganizationId] = useState(supervisorToEdit?.organizationId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd({
            id: supervisorToEdit?.id || '',
            name,
            email,
            phone,
            organizationId
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">{supervisorToEdit ? 'Begeleider Wijzigen' : 'Begeleider Toevoegen'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam</label>
                        <input required type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organisatie</label>
                         <select required value={organizationId} onChange={e => setOrganizationId(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600">
                            <option value="">Selecteer Organisatie</option>
                            {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Annuleren</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Opslaan</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SupervisorsView = ({ supervisors, organizations }: { supervisors: Supervisor[], organizations: Organization[] }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSup, setEditingSup] = useState<Supervisor | undefined>(undefined);

    const handleSave = async (sup: Supervisor) => {
        try {
            if (sup.id) {
                 await updateDoc(doc(db, "begeleiders", sup.id), { ...sup });
            } else {
                 await addDoc(collection(db, "begeleiders"), sup);
            }
        } catch (e) {
            console.error("Error saving supervisor", e);
            alert("Fout bij opslaan begeleider");
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Weet u zeker dat u deze begeleider wilt verwijderen?")) {
            await deleteDoc(doc(db, "begeleiders", id));
        }
    }

    const getOrgName = (id: string) => organizations.find(o => o.id === id)?.name || 'Onbekend';

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
             {isModalOpen && (
                <AddSupervisorModal 
                    onClose={() => { setIsModalOpen(false); setEditingSup(undefined); }}
                    onAdd={handleSave}
                    supervisorToEdit={editingSup}
                    organizations={organizations}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Begeleiders</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5"/> Nieuwe Begeleider
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefoon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisatie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {supervisors.map(sup => (
                            <tr key={sup.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sup.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sup.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{sup.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getOrgName(sup.organizationId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                     <div className="flex gap-4">
                                        <button onClick={() => { setEditingSup(sup); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-900 font-medium">Bewerken</button>
                                        <button onClick={() => handleDelete(sup.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5"/></button>
                                     </div>
                                </td>
                            </tr>
                        ))}
                         {supervisors.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">Geen begeleiders gevonden.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Missing Components and Helpers Implementation ---

const generateGoogleCalendarUrl = (date: Date, order: Order, titlePrefix: string) => {
    const startTime = date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(date.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, ""); // 1 hour duration
    const title = encodeURIComponent(`${titlePrefix}: ${order.title} (${order.customer.name})`);
    const details = encodeURIComponent(`Adres: ${order.customer.address}\nTel: ${order.customer.phone}\nOrder: ${order.orderNumber}`);
    const location = encodeURIComponent(order.customer.address);
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}&sf=true&output=xml`;
};

const Header = ({ activeTab, setActiveTab, userProfile }: { activeTab: AppTab, setActiveTab: (tab: AppTab) => void, userProfile: UserProfile }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const tabs: { id: AppTab; label: string; roles?: UserRole[] }[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'nieuwe-opdracht', label: 'Nieuwe Opdracht', roles: [UserRole.Beheerder, UserRole.Teamleider] },
        { id: 'klanten', label: 'Klanten', roles: [UserRole.Beheerder, UserRole.Teamleider] },
        { id: 'vervoer', label: 'Vervoer', roles: [UserRole.Beheerder, UserRole.Teamleider] },
        { id: 'gebruikers', label: 'Gebruikers', roles: [UserRole.Beheerder] },
        { id: 'organisaties', label: 'Organisaties', roles: [UserRole.Beheerder] },
        { id: 'begeleiders', label: 'Begeleiders', roles: [UserRole.Beheerder] },
        { id: 'mijn-account', label: 'Mijn Account' },
    ];

    const handleTabClick = (id: AppTab) => {
        setActiveTab(id);
        setIsMenuOpen(false);
    };

    return (
        <header className="bg-white dark:bg-gray-800 shadow relative z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nieuwe Nostalgie</h1>
                        </div>
                        <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {tabs.map(tab => {
                                if (tab.roles && !tab.roles.includes(userProfile.role)) return null;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-gray-900 dark:text-white'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                                        } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                     <div className="hidden sm:flex items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">{userProfile.email}</span>
                        <button onClick={() => signOut(auth)} className="text-sm text-red-600 hover:text-red-800">Uitloggen</button>
                    </div>
                    {/* Mobile menu button */}
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 dark:hover:bg-gray-700"
                        >
                            <span className="sr-only">Open hoofdmenu</span>
                            {isMenuOpen ? (
                                <XMarkIcon className="block h-6 w-6" />
                            ) : (
                                <MenuIcon className="block h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
            {/* Mobile menu, show/hide based on menu state */}
            {isMenuOpen && (
                 <div className="sm:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg">
                    <div className="pt-2 pb-3 space-y-1">
                        {tabs.map(tab => {
                            if (tab.roles && !tab.roles.includes(userProfile.role)) return null;
                             return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabClick(tab.id)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-gray-700 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="pt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center px-4">
                            <div className="ml-3">
                                <div className="text-base font-medium text-gray-800 dark:text-white">{userProfile.email}</div>
                                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{userProfile.role}</div>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            <button
                                onClick={() => signOut(auth)}
                                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 w-full text-left"
                            >
                                Uitloggen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

const Dashboard = ({ orders, onUpdateFurnitureDepartment, userProfile, onUpdateFurniturePriority }: { 
    orders: Order[], 
    onUpdateFurnitureDepartment: (orderId: string, furnitureId: string, dept: Department) => void,
    userProfile: UserProfile,
    onUpdateFurniturePriority: (orderId: string, furnitureId: string, priority: number) => void
}) => {
    const filteredOrders = useMemo(() => {
        if (userProfile.role === UserRole.Beheerder || userProfile.role === UserRole.Teamleider) {
            return orders;
        }
        if (userProfile.department) {
             return orders.filter(o => o.furniture.some(f => f.department === userProfile.department));
        }
        return orders;
    }, [orders, userProfile]);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Opdrachten Dashboard</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map(order => (
                    <div key={order.orderNumber} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">#{order.orderNumber} {order.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer.name}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'Actief' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {order.status}
                            </span>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 dark:text-gray-300">Deadline: {new Date(order.deadline).toLocaleDateString()}</p>
                            <div className="border-t pt-2 mt-2">
                                <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">Meubels:</h4>
                                <ul className="space-y-2">
                                    {order.furniture.map(item => {
                                        if (userProfile.role === UserRole.Medewerker && userProfile.department && item.department !== userProfile.department) {
                                            return null;
                                        }

                                        return (
                                            <li key={item.id} className="text-sm border p-2 rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                                                <div className="flex justify-between">
                                                    <span className="font-medium text-gray-900 dark:text-white">{item.type}</span>
                                                    <span className={`text-xs px-1 rounded ${DEPARTMENT_COLORS[item.department]}`}>{item.department}</span>
                                                </div>
                                                 <div className="mt-2 flex gap-1 flex-wrap">
                                                     <select 
                                                        value={item.department} 
                                                        onChange={(e) => onUpdateFurnitureDepartment(order.orderNumber, item.id, e.target.value as Department)}
                                                        className="block w-full text-xs rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                                                     >
                                                         {DEPARTMENT_ORDER.map(dept => (
                                                             <option key={dept} value={dept}>{dept}</option>
                                                         ))}
                                                     </select>
                                                 </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredOrders.length === 0 && <p className="col-span-full text-center text-gray-500">Geen opdrachten gevonden.</p>}
            </div>
        </div>
    );
};

const NewOrderForm = ({ addOrder, setActiveTab }: { addOrder: (order: Order) => void, setActiveTab: (tab: AppTab) => void }) => {
    const [title, setTitle] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [deadline, setDeadline] = useState('');
    const [pickupDate, setPickupDate] = useState('');
    const [furnitureItems, setFurnitureItems] = useState<FurnitureItem[]>([]);
    
    const [furnType, setFurnType] = useState('');
    const [furnPrice, setFurnPrice] = useState(0);
    const [furnTreatment, setFurnTreatment] = useState('');

    const handleAddFurniture = () => {
        if (!furnType) return;
        const newItem: FurnitureItem = {
            id: Date.now().toString(),
            type: furnType,
            price: furnPrice,
            image: '',
            treatment: furnTreatment,
            department: Department.Ophalen, 
            priority: 0
        };
        setFurnitureItems([...furnitureItems, newItem]);
        setFurnType('');
        setFurnPrice(0);
        setFurnTreatment('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newOrder: Order = {
            orderNumber: Date.now().toString().slice(-6), 
            title,
            customer: {
                customerNumber: Date.now().toString().slice(-4),
                name: customerName,
                address: customerAddress,
                phone: customerPhone,
                email: customerEmail
            },
            furniture: furnitureItems,
            pickupDate: pickupDate || new Date().toISOString(),
            deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            deliveryCost: 0,
            status: 'Actief'
        };
        addOrder(newOrder);
        setActiveTab('dashboard');
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Nieuwe Opdracht</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input required placeholder="Opdracht Titel" value={title} onChange={e => setTitle(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input required placeholder="Klant Naam" value={customerName} onChange={e => setCustomerName(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input required placeholder="E-mail" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input required placeholder="Telefoon" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    <input required placeholder="Adres" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 md:col-span-2" />
                    
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ophaaldatum</label>
                            <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline</label>
                            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="mt-1 block w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">Meubels toevoegen</h3>
                    <div className="flex gap-2 mb-4">
                        <input placeholder="Type (bijv. Kast)" value={furnType} onChange={e => setFurnType(e.target.value)} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        <input placeholder="Prijs" type="number" value={furnPrice} onChange={e => setFurnPrice(Number(e.target.value))} className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        <input placeholder="Behandeling" value={furnTreatment} onChange={e => setFurnTreatment(e.target.value)} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        <button type="button" onClick={handleAddFurniture} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            <PlusIcon className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <ul className="space-y-2">
                        {furnitureItems.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <span className="text-gray-900 dark:text-white">{item.type} - €{item.price} - {item.treatment}</span>
                                <button type="button" onClick={() => setFurnitureItems(furnitureItems.filter((_, i) => i !== idx))} className="text-red-500">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex justify-end">
                    <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium">
                        Opdracht Aanmaken
                    </button>
                </div>
            </form>
        </div>
    );
};

const CustomersView = ({ orders }: { orders: Order[], onUpdateOrder: any }) => {
    const customers = useMemo(() => {
        const map = new Map();
        orders.forEach(o => {
            if (!map.has(o.customer.email)) {
                map.set(o.customer.email, o.customer);
            }
        });
        return Array.from(map.values());
    }, [orders]);

    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Klantenbestand</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Telefoon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adres</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {customers.map((c, idx) => (
                            <tr key={idx}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{c.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.phone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{c.address}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TransportView = ({ orders, updateOrder }: { orders: Order[], updateOrder: (o: Order) => void }) => {
    const pickupOrders = orders.filter(o => o.furniture.some(f => f.department === Department.Ophalen));
    const deliveryOrders = orders.filter(o => o.furniture.every(f => f.department === Department.Bezorgen) && o.status !== 'Voltooid');

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Op te halen</h2>
                <ul>
                    {pickupOrders.map(o => (
                        <li key={o.orderNumber} className="border-b py-2 flex justify-between items-center dark:border-gray-700">
                             <div>
                                <span className="font-medium text-gray-900 dark:text-white">{o.customer.name}</span>
                                <span className="ml-2 text-sm text-gray-500">{o.customer.address}</span>
                                <div className="text-xs text-gray-400">Datum: {o.pickupDate}</div>
                             </div>
                             <button className="text-blue-600 hover:text-blue-800" onClick={() => window.open(generateGoogleCalendarUrl(new Date(o.pickupDate), o, 'Ophalen'), '_blank')}>
                                 <CalendarIcon className="w-5 h-5"/>
                             </button>
                        </li>
                    ))}
                    {pickupOrders.length === 0 && <li className="text-gray-500">Geen ophaalopdrachten.</li>}
                </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Te bezorgen</h2>
                <ul>
                    {deliveryOrders.map(o => (
                        <li key={o.orderNumber} className="border-b py-2 flex justify-between items-center dark:border-gray-700">
                             <div>
                                <span className="font-medium text-gray-900 dark:text-white">{o.customer.name}</span>
                                <span className="ml-2 text-sm text-gray-500">{o.customer.address}</span>
                                <div className="text-xs text-gray-400">Deadline: {o.deadline}</div>
                                {o.deliveryDate && <div className="text-xs text-green-600">Gepland: {new Date(o.deliveryDate).toLocaleString()}</div>}
                             </div>
                             <div className="flex gap-2">
                                <button className="text-green-600 hover:text-green-800" onClick={() => updateOrder({...o, status: 'Voltooid'})}>
                                    Voltooien
                                </button>
                             </div>
                        </li>
                    ))}
                    {deliveryOrders.length === 0 && <li className="text-gray-500">Geen bezorgopdrachten.</li>}
                </ul>
            </div>
        </div>
    );
};

const MyAccountView = ({ userProfile }: { userProfile: UserProfile }) => {
    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mijn Account</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{userProfile.email}</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Rol</label>
                    <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{userProfile.role}</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Afdeling</label>
                    <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">{userProfile.department || 'Geen'}</p>
                </div>
                 {userProfile.supervisorId && (
                     <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Begeleider</label>
                        <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                             {/* Note: We don't have supervisor names here directly, usually you'd lookup. 
                                For now just showing ID or simple text to indicate connection */}
                             (Gekoppeld aan begeleider)
                        </p>
                    </div>
                 )}
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${userProfile.status === UserStatus.Active ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {userProfile.status}
                    </span>
                </div>
            </div>
        </div>
    );
};

const ScheduleDeliveryModal = ({ order, onClose, onSchedule }: { order: Order, onClose: () => void, onSchedule: (order: Order, date: string, time: string) => void }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Bezorging Inplannen</h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                    Order #{order.orderNumber} voor {order.customer.name} is klaar om bezorgd te worden.
                </p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Datum</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tijd</label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 block w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Later</button>
                    <button onClick={() => onSchedule(order, date, time)} disabled={!date || !time} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">Inplannen</button>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
const PlannerApp = ({ userProfile, allUsers, organizations, supervisors, onUpdateUser }: { 
    userProfile: UserProfile, 
    allUsers: UserProfile[], 
    organizations: Organization[],
    supervisors: Supervisor[],
    onUpdateUser: (uid: string, data: Partial<UserProfile>) => void 
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [deliveryScheduleInfo, setDeliveryScheduleInfo] = useState<Order | null>(null);

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
        return <UsersView users={allUsers} organizations={organizations} supervisors={supervisors} onUpdateUser={onUpdateUser} currentUserEmail={userProfile.email} />;
      case 'organisaties':
        return <OrganizationsView organizations={organizations} />;
      case 'begeleiders':
        return <SupervisorsView supervisors={supervisors} organizations={organizations} />;
      case 'mijn-account':
          return <MyAccountView userProfile={userProfile} />;
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
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                setUser(currentUser);
                if (currentUser) {
                    const userDocRef = doc(db, "gebruikers", currentUser.uid);
                    let docSnap = await getDoc(userDocRef);

                    if (!docSnap.exists()) {
                         await new Promise(resolve => setTimeout(resolve, 500));
                         docSnap = await getDoc(userDocRef);
                    }

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
            } catch (error) {
                console.error("Fout tijdens authenticatie controle:", error);
                setUser(null);
                setUserProfile(null);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);
    
    useEffect(() => {
        if (userProfile && userProfile.role === UserRole.Beheerder) {
            const usersQuery = query(collection(db, "gebruikers"));
            const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
                const usersData: UserProfile[] = [];
                snapshot.forEach(doc => usersData.push(doc.data() as UserProfile));
                setAllUsers(usersData.sort((a, b) => {
                     const emailA = a.email || "";
                     const emailB = b.email || "";
                     return emailA.localeCompare(emailB);
                }));
            });

            const orgsQuery = query(collection(db, "organisaties"));
            const unsubscribeOrgs = onSnapshot(orgsQuery, (snapshot) => {
                const orgsData: Organization[] = [];
                snapshot.forEach(doc => orgsData.push({ id: doc.id, ...doc.data() } as Organization));
                setOrganizations(orgsData);
            });

            const supsQuery = query(collection(db, "begeleiders"));
            const unsubscribeSups = onSnapshot(supsQuery, (snapshot) => {
                const supsData: Supervisor[] = [];
                snapshot.forEach(doc => supsData.push({ id: doc.id, ...doc.data() } as Supervisor));
                setSupervisors(supsData);
            });

            return () => {
                unsubscribeUsers();
                unsubscribeOrgs();
                unsubscribeSups();
            };
        } else {
            setAllUsers([]);
            setOrganizations([]);
            setSupervisors([]);
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

    return <PlannerApp userProfile={userProfile} allUsers={allUsers} organizations={organizations} supervisors={supervisors} onUpdateUser={handleUpdateUser} />;
}
