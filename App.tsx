import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AppTab, Order, Department, FurnitureItem, Customer, UserProfile, UserRole, UserStatus, Organization, Supervisor } from './types';
import { DEPARTMENT_ORDER, DEPARTMENT_COLORS, COMPANY_INFO } from './constants';
import { CalendarIcon, DownloadIcon, PrintIcon, PlusIcon, TrashIcon, MenuIcon, XMarkIcon, MagnifyingGlassIcon, PencilIcon } from './components/Icons';
import { auth, db, signInWithEmailAndPassword, onAuthStateChanged, signOut, User, createUserWithEmailAndPassword, collection, doc, setDoc, onSnapshot, query, getDoc, updateDoc, runTransaction, deleteDoc, firebaseConfig, initializeApp, deleteApp, getAuth, addDoc } from './firebase';


// Use jsPDF from window object
declare const jspdf: any;
declare const html2canvas: any;

const ADMIN_EMAIL = 'info@nieuwe-nostalgie.nl';

// --- Utility: Image Resizer ---
const resizeImage = (file: File, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    // Export as JPEG with reduced quality
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                } else {
                    reject(new Error("Canvas context not available"));
                }
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

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

// --- Organization & Supervisor Modals ---

const AddOrganizationModal = ({ onClose, onSave, editingOrg }: { onClose: () => void, onSave: (org: Organization) => Promise<void>, editingOrg?: Organization | null }) => {
    const [name, setName] = useState(editingOrg?.name || '');
    const [address, setAddress] = useState(editingOrg?.address || '');
    const [email, setEmail] = useState(editingOrg?.email || '');
    const [phone, setPhone] = useState(editingOrg?.phone || '');
    const [logo, setLogo] = useState(editingOrg?.logo || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processingImage, setProcessingImage] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProcessingImage(true);
            try {
                const resizedImage = await resizeImage(file);
                setLogo(resizedImage);
                setError(null);
            } catch (err) {
                console.error("Fout bij verwerken afbeelding:", err);
                setError("Kon afbeelding niet verwerken.");
            } finally {
                setProcessingImage(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const orgData: Organization = {
                id: editingOrg?.id || '',
                name,
                address: address || null,
                email: email || null,
                phone: phone || null,
                logo: logo || null
            };
            await onSave(orgData);
            onClose();
        } catch (err: any) {
            console.error("Error saving organization:", err);
            setError(err.message || "Er is een fout opgetreden bij het opslaan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{editingOrg ? 'Organisatie Bewerken' : 'Nieuwe Organisatie'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adres</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                        <div className="mt-1 flex items-center space-x-4">
                            <label className="cursor-pointer bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 font-medium text-sm">
                                <span>{processingImage ? 'Verwerken...' : 'Bestand kiezen'}</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={processingImage} />
                            </label>
                            <span className="text-sm text-gray-500 truncate max-w-[150px]">{logo ? 'Afbeelding geselecteerd' : 'Geen bestand gekozen'}</span>
                        </div>
                        {logo && (
                            <div className="mt-2">
                                <img src={logo} alt="Preview" className="h-16 object-contain" />
                                <button type="button" onClick={() => setLogo('')} className="text-xs text-red-500 mt-1">Verwijder</button>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={loading || processingImage} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AddSupervisorModal = ({ onClose, onSave, organizations, editingSup }: { onClose: () => void, onSave: (sup: Supervisor) => Promise<void>, organizations: Organization[], editingSup?: Supervisor | null }) => {
    const [name, setName] = useState(editingSup?.name || '');
    const [email, setEmail] = useState(editingSup?.email || '');
    const [phone, setPhone] = useState(editingSup?.phone || '');
    const [organizationId, setOrganizationId] = useState(editingSup?.organizationId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!organizationId) {
            setError("Selecteer een organisatie.");
            setLoading(false);
            return;
        }

        try {
            const supData: Supervisor = {
                id: editingSup?.id || '',
                name,
                organizationId,
                email: email || null,
                phone: phone || null,
            };
            await onSave(supData);
            onClose();
        } catch (err: any) {
             console.error("Error saving supervisor:", err);
            setError(err.message || "Er is een fout opgetreden bij het opslaan.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{editingSup ? 'Begeleider Bewerken' : 'Nieuwe Begeleider'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Organisatie</label>
                        <select 
                            value={organizationId} 
                            onChange={e => setOrganizationId(e.target.value)} 
                            required 
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"
                        >
                            <option value="">Selecteer organisatie...</option>
                            {organizations.map(org => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Views for Organizations and Supervisors ---

const OrganizationsView = ({ organizations, onSave, onDelete }: { organizations: Organization[], onSave: (org: Organization) => Promise<void>, onDelete: (id: string) => Promise<void> }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (org: Organization) => {
        setEditingOrg(org);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Weet u zeker dat u deze organisatie wilt verwijderen?")) {
            await onDelete(id);
        }
    };

    const addExampleOrg = async () => {
        const exampleOrg: Organization = {
            id: '',
            name: "Voorbeeld Zorg B.V.",
            address: "Industrieweg 10, 5600 AA Eindhoven",
            email: "info@voorbeeldzorg.nl",
            phone: "040-1234567",
            logo: null
        };
        try {
            await onSave(exampleOrg);
        } catch (error) {
            console.error("Fout bij aanmaken voorbeeld:", error);
            alert("Kon voorbeeld niet aanmaken.");
        }
    };

    const filteredOrgs = useMemo(() => {
        return organizations.filter(org => 
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (org.address && org.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (org.phone && org.phone.includes(searchTerm))
        );
    }, [organizations, searchTerm]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Organisaties</h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 p-2"
                            placeholder="Zoeken..."
                        />
                    </div>
                    <button 
                        onClick={addExampleOrg}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                        <PlusIcon className="w-5 h-5" /> Voorbeeld
                    </button>
                    <button 
                        onClick={() => { setEditingOrg(null); setIsModalOpen(true); }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <PlusIcon className="w-5 h-5" /> Toevoegen
                    </button>
                </div>
            </div>
            
            {(isModalOpen) && (
                <AddOrganizationModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={onSave}
                    editingOrg={editingOrg}
                />
            )}

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adres</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredOrgs.map(org => (
                            <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                    {org.logo ? (
                                        <img src={org.logo} alt="" className="h-8 w-8 object-contain bg-white rounded" />
                                    ) : (
                                        <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">Logo</div>
                                    )}
                                    {org.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{org.address || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {org.email && <div>{org.email}</div>}
                                    {org.phone && <div>{org.phone}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(org)} className="text-blue-600 hover:text-blue-900 mr-4">Bewerken</button>
                                    <button onClick={() => handleDelete(org.id)} className="text-red-600 hover:text-red-900">Verwijderen</button>
                                </td>
                            </tr>
                        ))}
                         {filteredOrgs.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Geen organisaties gevonden.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const SupervisorsView = ({ supervisors, organizations, onSave, onDelete }: { supervisors: Supervisor[], organizations: Organization[], onSave: (sup: Supervisor) => Promise<void>, onDelete: (id: string) => Promise<void> }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSup, setEditingSup] = useState<Supervisor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (sup: Supervisor) => {
        setEditingSup(sup);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if(window.confirm("Weet u zeker dat u deze begeleider wilt verwijderen?")) {
            await onDelete(id);
        }
    };

    const getOrgName = (id: string) => {
        return organizations.find(o => o.id === id)?.name || 'Onbekend';
    };

    const filteredSups = useMemo(() => {
        return supervisors.filter(sup => 
            sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sup.email && sup.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (sup.phone && sup.phone.includes(searchTerm)) ||
            getOrgName(sup.organizationId).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [supervisors, searchTerm, organizations]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Begeleiders</h3>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="relative rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 p-2"
                            placeholder="Zoeken..."
                        />
                    </div>
                    <button 
                        onClick={() => { setEditingSup(null); setIsModalOpen(true); }}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        <PlusIcon className="w-5 h-5" /> Toevoegen
                    </button>
                </div>
            </div>
            
            {(isModalOpen) && (
                <AddSupervisorModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={onSave}
                    organizations={organizations}
                    editingSup={editingSup}
                />
            )}

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organisatie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSups.map(sup => (
                            <tr key={sup.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sup.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getOrgName(sup.organizationId)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {sup.email && <div>{sup.email}</div>}
                                    {sup.phone && <div>{sup.phone}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(sup)} className="text-blue-600 hover:text-blue-900 mr-4">Bewerken</button>
                                    <button onClick={() => handleDelete(sup.id)} className="text-red-600 hover:text-red-900">Verwijderen</button>
                                </td>
                            </tr>
                        ))}
                        {filteredSups.length === 0 && (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Geen begeleiders gevonden.</td></tr>
                        )}
                    </tbody>
                </table>
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
            // Use a unique name to avoid "App named 'Secondary' already exists" error
            const appName = `Secondary-${Date.now()}`;
            secondaryApp = initializeApp(firebaseConfig, appName);
            const secondaryAuth = getAuth(secondaryApp);
            
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "gebruikers", user.uid), {
                uid: user.uid,
                email: user.email,
                role: role,
                status: UserStatus.Active,
                department: department || null,
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
                try {
                    await deleteApp(secondaryApp);
                } catch (e) {
                    console.error("Error deleting secondary app", e);
                }
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
    onClose: () => void;
    onSave: (uid: string, data: Partial<UserProfile>) => void;
    supervisors: Supervisor[];
    organizations: Organization[];
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onClose, onSave, supervisors, organizations }) => {
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [address, setAddress] = useState(user.address || '');
    const [phone, setPhone] = useState(user.phone || '');
    const [role, setRole] = useState(user.role);
    const [department, setDepartment] = useState<Department | ''>(user.department || '');
    const [status, setStatus] = useState(user.status);
    const [supervisorId, setSupervisorId] = useState(user.supervisorId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(user.uid, {
            displayName,
            address,
            phone,
            role,
            department: department || null,
            status,
            supervisorId: supervisorId || null
        } as any);
        onClose();
    };

    const getSupervisorLabel = (sup: Supervisor) => {
        const org = organizations.find(o => o.id === sup.organizationId);
        return `${sup.name} (${org?.name || 'Onbekend'})`;
    };

    const sortedSupervisors = useMemo(() => {
        return [...supervisors].sort((a, b) => a.name.localeCompare(b.name));
    }, [supervisors]);

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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Begeleider</label>
                            <select value={supervisorId} onChange={e => setSupervisorId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                                <option value="">Geen</option>
                                {sortedSupervisors.map(sup => (
                                    <option key={sup.id} value={sup.id}>{getSupervisorLabel(sup)}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Kies uit de lijst van begeleiders</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Status</label>
                            <select value={status} onChange={e => setStatus(e.target.value as UserStatus)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                                <option value={UserStatus.Active}>Actief (Toegang)</option>
                                <option value={UserStatus.Inactive}>Inactief (Geen toegang)</option>
                                <option value={UserStatus.Pending}>In afwachting</option>
                            </select>
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
    onUpdateUser: (uid: string, data: Partial<UserProfile>) => void;
    currentUserEmail: string;
    organizations: Organization[];
    supervisors: Supervisor[];
    onSaveOrg: (org: Organization) => Promise<void>;
    onDeleteOrg: (id: string) => Promise<void>;
    onSaveSup: (sup: Supervisor) => Promise<void>;
    onDeleteSup: (id: string) => Promise<void>;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onUpdateUser, currentUserEmail, organizations, supervisors, onSaveOrg, onDeleteOrg, onSaveSup, onDeleteSup }) => {
    const [activeSubTab, setActiveSubTab] = useState<'medewerkers' | 'organisaties' | 'begeleiders'>('medewerkers');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

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
    
    const filteredUsers = useMemo(() => {
        return users.filter(user => 
            (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [users, searchTerm]);

    const getSupervisorName = (id?: string | null) => {
        if (!id) return null;
        const sup = supervisors.find(s => s.id === id);
        return sup ? sup.name : null;
    };

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
                    onClose={() => setEditingUser(null)}
                    onSave={onUpdateUser}
                    supervisors={supervisors}
                    organizations={organizations}
                />
            )}

            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveSubTab('medewerkers')}
                        className={`${
                            activeSubTab === 'medewerkers'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Medewerkers
                    </button>
                    <button
                        onClick={() => setActiveSubTab('organisaties')}
                        className={`${
                            activeSubTab === 'organisaties'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Organisaties
                    </button>
                    <button
                        onClick={() => setActiveSubTab('begeleiders')}
                        className={`${
                            activeSubTab === 'begeleiders'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        Begeleiders
                    </button>
                </nav>
            </div>

            {activeSubTab === 'medewerkers' && (
                <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Medewerkers</h2>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 p-2"
                                placeholder="Zoeken..."
                            />
                        </div>
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusIcon className="w-5 h-5" />
                            <span className="whitespace-nowrap">Nieuwe Medewerker</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr key="head-row">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam / Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredUsers.map(user => {
                                    const isCurrentUser = user.email === currentUserEmail;
                                    const supervisorName = getSupervisorName(user.supervisorId);
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
                                                    {supervisorName && (
                                                        <span className="text-xs text-blue-500 mt-1">Begeleider: {supervisorName}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                {user.role} 
                                                {user.department && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{user.department}</span>}
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
                                {filteredUsers.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Geen medewerkers gevonden.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                </>
            )}

            {activeSubTab === 'organisaties' && (
                <OrganizationsView organizations={organizations} onSave={onSaveOrg} onDelete={onDeleteOrg} />
            )}

            {activeSubTab === 'begeleiders' && (
                <SupervisorsView supervisors={supervisors} organizations={organizations} onSave={onSaveSup} onDelete={onDeleteSup} />
            )}
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

const ImagePreviewModal = ({ src, onClose }: { src: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="relative max-w-4xl max-h-[90vh]">
                <img src={src} alt="Vergroting" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                <button 
                    onClick={onClose}
                    className="absolute -top-4 -right-4 bg-white text-black rounded-full p-2 hover:bg-gray-200 shadow-lg"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

// --- Edit Customer Modal ---
const EditCustomerModal = ({ customer, onClose, onSave }: { customer: Customer, onClose: () => void, onSave: (originalEmail: string, updatedCustomer: Customer) => void }) => {
    const [name, setName] = useState(customer.name);
    const [email, setEmail] = useState(customer.email);
    const [phone, setPhone] = useState(customer.phone);
    const [address, setAddress] = useState(customer.address);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // We pass the original email to identify records to update, and the new data
        await onSave(customer.email, { ...customer, name, email, phone, address });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Klant Bewerken</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adres</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                     <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {loading ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- Edit Task Modal ---
const EditTaskModal = ({ task, orderId, onClose, onSave }: { task: FurnitureItem, orderId: string, onClose: () => void, onSave: (updatedTask: FurnitureItem) => void }) => {
    const [type, setType] = useState(task.type);
    const [price, setPrice] = useState(task.price);
    const [treatment, setTreatment] = useState(task.treatment);
    const [image, setImage] = useState(task.image);
    const [error, setError] = useState<string | null>(null);
    const [processingImage, setProcessingImage] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProcessingImage(true);
            try {
                const resizedImage = await resizeImage(file);
                setImage(resizedImage);
                setError(null);
            } catch (err) {
                 console.error("Fout bij verwerken afbeelding:", err);
                setError("Kon afbeelding niet verwerken.");
            } finally {
                setProcessingImage(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...task, type, price, treatment, image });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Taak Bewerken</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type Meubel</label>
                        <input type="text" value={type} onChange={e => setType(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prijs (€)</label>
                        <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Behandeling</label>
                        <input type="text" value={treatment} onChange={e => setTreatment(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Afbeelding</label>
                         <div className="mt-1 flex items-center space-x-4">
                            <label className="cursor-pointer bg-blue-50 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-100 font-medium text-sm">
                                <span>{processingImage ? 'Verwerken...' : 'Wijzigen'}</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={processingImage} />
                            </label>
                        </div>
                         {image ? (
                            <div className="mt-2">
                                <img src={image} alt="Preview" className="h-24 w-full object-cover rounded" />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mt-2">Geen afbeelding</p>
                        )}
                         {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">Annuleren</button>
                        <button type="submit" disabled={processingImage} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                            Opslaan
                        </button>
                    </div>
                </form>
             </div>
        </div>
    );
};

const Dashboard = ({ orders, onUpdateFurnitureDepartment, userProfile, onUpdateFurniturePriority, onUpdateFurniture }: { 
    orders: Order[], 
    onUpdateFurnitureDepartment: (orderId: string, furnitureId: string, dept: Department) => void,
    userProfile: UserProfile,
    onUpdateFurniturePriority: (orderId: string, furnitureId: string, priority: number) => void,
    onUpdateFurniture: (orderId: string, updatedItem: FurnitureItem) => void
}) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [collapsedDepartments, setCollapsedDepartments] = useState<string[]>([]);
    const [editingTask, setEditingTask] = useState<{ orderId: string, item: FurnitureItem } | null>(null);

    const toggleDepartment = (dept: string) => {
        setCollapsedDepartments(prev => 
            prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
        );
    };

    // Group items by department
    const tasksByDepartment = useMemo(() => {
        const groups: Record<string, Array<{ item: FurnitureItem, order: Order }>> = {};
        DEPARTMENT_ORDER.forEach(d => groups[d] = []);

        orders.forEach(order => {
            // Only process active orders
            if (order.status !== 'Actief') return;

            order.furniture.forEach(item => {
                // Apply role-based filtering:
                // Medewerkers only see tasks in their own department if they have one assigned.
                if (userProfile.role === UserRole.Medewerker && userProfile.department && item.department !== userProfile.department) {
                    return;
                }

                if (!groups[item.department]) groups[item.department] = [];
                groups[item.department].push({ item, order });
            });
        });

        // Sort items by priority (descending) then by deadline (ascending)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                const prioDiff = (b.item.priority || 0) - (a.item.priority || 0);
                if (prioDiff !== 0) return prioDiff;
                return new Date(a.order.deadline).getTime() - new Date(b.order.deadline).getTime();
            });
        });

        return groups;
    }, [orders, userProfile]);

    const handleSaveTask = (updatedItem: FurnitureItem) => {
        if(editingTask) {
            onUpdateFurniture(editingTask.orderId, updatedItem);
            setEditingTask(null);
        }
    };

    return (
        <div className="pb-8 space-y-8">
            {selectedImage && <ImagePreviewModal src={selectedImage} onClose={() => setSelectedImage(null)} />}
            {editingTask && <EditTaskModal task={editingTask.item} orderId={editingTask.orderId} onClose={() => setEditingTask(null)} onSave={handleSaveTask} />}
            
            {DEPARTMENT_ORDER.map(dept => {
                const tasks = tasksByDepartment[dept] || [];
                const isCollapsed = collapsedDepartments.includes(dept);

                // Logic to hide empty columns for Medewerkers to reduce clutter, 
                // unless it's their specific department.
                if (userProfile.role === UserRole.Medewerker && tasks.length === 0 && userProfile.department !== dept) {
                    return null;
                }

                return (
                    <div key={dept} className="w-full bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Section Header */}
                        <div 
                            className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${DEPARTMENT_COLORS[dept]}`}
                            onClick={() => toggleDepartment(dept)}
                        >
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold truncate uppercase tracking-wide">{dept}</h3>
                                <span className="text-sm font-semibold bg-white bg-opacity-30 px-3 py-0.5 rounded-full">
                                    {tasks.length} {tasks.length === 1 ? 'taak' : 'taken'}
                                </span>
                            </div>
                            <div className="text-2xl font-bold leading-none">
                                {isCollapsed ? '+' : '-'}
                            </div>
                        </div>

                        {/* Section Body (Grid) */}
                        {!isCollapsed && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {tasks.map(({ item, order }) => (
                                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow flex flex-col h-full relative group/card">
                                            
                                            {/* Edit Button (Pencil) */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingTask({ orderId: order.orderNumber, item });
                                                }}
                                                className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md text-gray-500 hover:text-blue-600 opacity-0 group-hover/card:opacity-100 transition-opacity"
                                                title="Taak bewerken"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>

                                            {/* Image Area - Prominent */}
                                            {item.image ? (
                                                <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 relative group overflow-hidden rounded-t-lg">
                                                    <img 
                                                        src={item.image} 
                                                        alt={item.type} 
                                                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                                        onClick={() => setSelectedImage(item.image)}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all pointer-events-none" />
                                                </div>
                                            ) : (
                                                <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 rounded-t-lg">
                                                    <span className="text-sm italic">Geen afbeelding</span>
                                                </div>
                                            )}

                                            {/* Card Content - Clickable to Edit */}
                                            <div 
                                                className="p-4 flex-1 flex flex-col cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                onClick={() => setEditingTask({ orderId: order.orderNumber, item })}
                                            >
                                                <div className="mb-3">
                                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{item.type}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        #{order.orderNumber} • {order.customer.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate mt-1">{order.title}</p>
                                                </div>

                                                <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded text-sm text-blue-800 dark:text-blue-200 mb-3">
                                                    <span className="font-semibold">Behandeling:</span> {item.treatment || 'Geen'}
                                                </div>

                                                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3" onClick={e => e.stopPropagation()}>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
                                                        <span className={`font-medium ${new Date(order.deadline) < new Date() ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {new Date(order.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>

                                                    {/* Controls */}
                                                    <div className="flex flex-col gap-2">
                                                        <select 
                                                            value={item.department} 
                                                            onChange={(e) => onUpdateFurnitureDepartment(order.orderNumber, item.id, e.target.value as Department)}
                                                            disabled={userProfile.role === UserRole.Medewerker}
                                                            className="block w-full text-sm rounded border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed py-2"
                                                        >
                                                            {DEPARTMENT_ORDER.map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                        
                                                        {userProfile.role === UserRole.Beheerder && (
                                                            <div className="flex justify-between gap-2">
                                                                <button 
                                                                    onClick={() => onUpdateFurniturePriority(order.orderNumber, item.id, (item.priority || 0) + 1)} 
                                                                    className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 rounded py-2 text-sm font-medium transition-colors"
                                                                >
                                                                    ▲ Prioriteit
                                                                </button>
                                                                <button 
                                                                    onClick={() => onUpdateFurniturePriority(order.orderNumber, item.id, (item.priority || 0) - 1)} 
                                                                    className="flex-1 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 rounded py-2 text-sm font-medium transition-colors"
                                                                >
                                                                    ▼
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {tasks.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-gray-400 italic">
                                            Geen taken in deze afdeling.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
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
    const [furnImage, setFurnImage] = useState('');
    const [processingImage, setProcessingImage] = useState(false);

    const handleFurnImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProcessingImage(true);
            try {
                const resizedImage = await resizeImage(file);
                setFurnImage(resizedImage);
            } catch (err) {
                console.error("Fout bij verwerken afbeelding:", err);
                alert("Kon afbeelding niet verwerken.");
            } finally {
                setProcessingImage(false);
            }
        }
    };

    const handleAddFurniture = () => {
        if (!furnType) return;
        const newItem: FurnitureItem = {
            id: Date.now().toString(),
            type: furnType,
            price: furnPrice,
            image: furnImage,
            treatment: furnTreatment,
            department: Department.Ophalen, 
            priority: 0
        };
        setFurnitureItems([...furnitureItems, newItem]);
        setFurnType('');
        setFurnPrice(0);
        setFurnTreatment('');
        setFurnImage('');
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
                    <div className="flex flex-col md:flex-row gap-2 mb-4 items-start md:items-center">
                        <input placeholder="Type (bijv. Kast)" value={furnType} onChange={e => setFurnType(e.target.value)} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        <input placeholder="Prijs" type="number" value={furnPrice} onChange={e => setFurnPrice(Number(e.target.value))} className="w-24 p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        <input placeholder="Behandeling" value={furnTreatment} onChange={e => setFurnTreatment(e.target.value)} className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        
                        <label className="cursor-pointer bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded border border-gray-300 dark:border-gray-500 flex items-center gap-2 whitespace-nowrap">
                           <span className="text-sm">{processingImage ? 'Laden...' : (furnImage ? 'Foto gekozen' : 'Foto')}</span>
                           <input type="file" accept="image/*" onChange={handleFurnImageChange} className="hidden" disabled={processingImage} />
                        </label>

                        <button type="button" onClick={handleAddFurniture} disabled={processingImage} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full md:w-auto disabled:opacity-50">
                            <PlusIcon className="w-5 h-5 mx-auto" />
                        </button>
                    </div>
                    {furnImage && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-1">Voorbeeld:</p>
                            <img src={furnImage} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                        </div>
                    )}
                    
                    <ul className="space-y-2">
                        {furnitureItems.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                <div className="flex items-center gap-3">
                                    {item.image && <img src={item.image} alt="mini" className="w-10 h-10 object-cover rounded" />}
                                    <span className="text-gray-900 dark:text-white">{item.type} - €{item.price} - {item.treatment}</span>
                                </div>
                                <button type="button" onClick={() => setFurnitureItems(furnitureItems.filter((_, i) => i !== idx))} className="text-red-500">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex justify-end">
                    <button type="submit" disabled={processingImage} className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium disabled:opacity-50">
                        Opdracht Aanmaken
                    </button>
                </div>
            </form>
        </div>
    );
};

const CustomerHistoryModal = ({ customer, orders, onClose }: { customer: Customer & { firstSeen: number }, orders: Order[], onClose: () => void }) => {
    // Filter orders specifically for this customer
    const customerOrders = useMemo(() => {
        return orders
            .filter(o => o.customer.email === customer.email)
            .sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime());
    }, [orders, customer.email]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6 border-b pb-2 dark:border-gray-700">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email} | {customer.phone}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-6">
                    {customerOrders.length > 0 ? (
                        customerOrders.map(order => (
                            <div key={order.orderNumber} className="border rounded-lg p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Project: {order.title} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(#{order.orderNumber})</span>
                                    </h3>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${order.status === 'Actief' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Datum: {new Date(order.pickupDate).toLocaleDateString()}</p>
                                
                                <div className="bg-white dark:bg-gray-800 rounded p-3 shadow-sm">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Meubels & Bewerkingen:</h4>
                                    <ul className="space-y-2">
                                        {order.furniture.map((item, idx) => (
                                            <li key={idx} className="flex justify-between text-sm border-b last:border-0 pb-1 dark:border-gray-700">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">{item.type}</span>
                                                <span className="text-blue-600 dark:text-blue-400">{item.treatment || 'Geen specifieke bewerking'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">Geen geschiedenis gevonden.</p>
                    )}
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500">Sluiten</button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer & { firstSeen: number } | null>(null);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // Auth & Data fetching
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const docRef = doc(db, "gebruikers", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserProfile(docSnap.data() as UserProfile);
                    } else {
                         // Fallback if profile missing but auth exists
                         setUserProfile(null);
                    }
                } catch (e) {
                    console.error("Error fetching profile", e);
                }
            } else {
                setUserProfile(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!userProfile || userProfile.status !== UserStatus.Active) return;

        const unsubOrders = onSnapshot(collection(db, "opdrachten"), (snapshot) => {
            const loadedOrders = snapshot.docs.map(doc => doc.data() as Order);
            setOrders(loadedOrders);
        });

        const unsubUsers = onSnapshot(collection(db, "gebruikers"), (snapshot) => {
             const loadedUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
             setUsers(loadedUsers);
        });
        
        const unsubOrgs = onSnapshot(collection(db, "organisaties"), (snapshot) => {
            const loadedOrgs = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Organization));
            setOrganizations(loadedOrgs);
        });

        const unsubSups = onSnapshot(collection(db, "begeleiders"), (snapshot) => {
            const loadedSups = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Supervisor));
            setSupervisors(loadedSups);
        });

        return () => {
            unsubOrders();
            unsubUsers();
            unsubOrgs();
            unsubSups();
        };
    }, [userProfile]);

    const addOrder = async (order: Order) => {
        try {
            await setDoc(doc(db, "opdrachten", order.orderNumber), order);
        } catch(e) {
            console.error("Error adding order", e);
            alert("Fout bij toevoegen opdracht");
        }
    };

    const updateFurnitureDepartment = async (orderId: string, furnitureId: string, dept: Department) => {
        const orderRef = doc(db, "opdrachten", orderId);
        const order = orders.find(o => o.orderNumber === orderId);
        if(order) {
            const updatedFurniture = order.furniture.map(f => {
                if(f.id === furnitureId) return {...f, department: dept};
                return f;
            });
            await updateDoc(orderRef, { furniture: updatedFurniture });
        }
    };

    const updateFurniturePriority = async (orderId: string, furnitureId: string, priority: number) => {
        const orderRef = doc(db, "opdrachten", orderId);
        const order = orders.find(o => o.orderNumber === orderId);
        if(order) {
             const updatedFurniture = order.furniture.map(f => {
                if(f.id === furnitureId) return {...f, priority: priority};
                return f;
            });
            await updateDoc(orderRef, { furniture: updatedFurniture });
        }
    };

    const updateFurnitureDetails = async (orderId: string, updatedItem: FurnitureItem) => {
        const orderRef = doc(db, "opdrachten", orderId);
        const order = orders.find(o => o.orderNumber === orderId);
        if(order) {
            const updatedFurniture = order.furniture.map(f => {
                if(f.id === updatedItem.id) return updatedItem;
                return f;
            });
            await updateDoc(orderRef, { furniture: updatedFurniture });
        }
    };

    const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
        try {
            await updateDoc(doc(db, "gebruikers", uid), data);
        } catch(e) {
            console.error("Error updating user", e);
        }
    };

    const handleSaveOrg = async (org: Organization) => {
        try {
            // Remove optional fields if they are empty strings to satisfy Firestore rules
            // AND specifically use addDoc for new, updateDoc for existing to be safe with permissions
            const safeOrg = {
                name: org.name,
                address: org.address || null,
                email: org.email || null,
                phone: org.phone || null,
                logo: org.logo || null,
                // Do not include 'id' in the data payload
            };

            if(org.id) {
                await updateDoc(doc(db, "organisaties", org.id), safeOrg);
            } else {
                await addDoc(collection(db, "organisaties"), {
                    ...safeOrg,
                    createdAt: new Date().toISOString()
                });
            }
        } catch(e) {
             console.error("Error saving org", e);
             throw e; // Propagate to modal
        }
    }

    const handleDeleteOrg = async (id: string) => {
        try {
            await deleteDoc(doc(db, "organisaties", id));
        } catch(e) {
            console.error("Error deleting org", e);
        }
    }

    const handleSaveSup = async (sup: Supervisor) => {
        try {
            const safeSup = {
                name: sup.name,
                organizationId: sup.organizationId,
                email: sup.email || null,
                phone: sup.phone || null,
            };

            if(sup.id) {
                 await updateDoc(doc(db, "begeleiders", sup.id), safeSup);
            } else {
                 await addDoc(collection(db, "begeleiders"), {
                    ...safeSup,
                    createdAt: new Date().toISOString()
                 });
            }
        } catch(e) {
             console.error("Error saving sup", e);
             throw e;
        }
    }

    const handleDeleteSup = async (id: string) => {
        try {
             await deleteDoc(doc(db, "begeleiders", id));
        } catch(e) {
             console.error("Error deleting sup", e);
        }
    }

    const handleUpdateCustomer = async (originalEmail: string, updatedCustomer: Customer) => {
        try {
            // Find all orders that belong to this customer
            const ordersToUpdate = orders.filter(o => o.customer.email === originalEmail);
            
            // Update each order with new customer details
            // We use Promise.all to do it in parallel
            const promises = ordersToUpdate.map(order => {
                const orderRef = doc(db, "opdrachten", order.orderNumber);
                return updateDoc(orderRef, { 
                    customer: {
                        ...updatedCustomer,
                        // Preserve the original customerNumber if needed, or update it if part of edit
                        customerNumber: order.customer.customerNumber 
                    } 
                });
            });

            await Promise.all(promises);
            setEditingCustomer(null);
        } catch (error) {
            console.error("Error updating customer:", error);
            alert("Er is een fout opgetreden bij het bijwerken van de klant.");
        }
    };

    // Prepare Customers List (derived from orders)
    const customers = useMemo(() => {
        const custMap = new Map<string, Customer & { firstSeen: number }>();
        orders.forEach(order => {
            if (!custMap.has(order.customer.email)) {
                custMap.set(order.customer.email, { ...order.customer, firstSeen: new Date(order.pickupDate).getTime() });
            }
        });
        return Array.from(custMap.values());
    }, [orders]);


    if (loading) {
        return <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-500">Laden...</div>;
    }

    if (!user) {
        return <LoginScreen />;
    }

    if (!userProfile) {
         // Handle edge case where auth is successful but firestore profile creation failed or is slow
        return <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-500">Profiel aan het laden... (Indien dit lang duurt, log opnieuw in) <button onClick={() => signOut(auth)} className="ml-4 text-blue-500">Uitloggen</button></div>;
    }

    if (userProfile.status === UserStatus.Pending) {
        return <PendingApprovalScreen />;
    }

    if (userProfile.status === UserStatus.Inactive) {
        return <InactiveAccountScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-12 font-sans text-gray-900 dark:text-gray-100">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} userProfile={userProfile} />
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
                {activeTab === 'dashboard' && (
                    <Dashboard 
                        orders={orders} 
                        onUpdateFurnitureDepartment={updateFurnitureDepartment} 
                        userProfile={userProfile}
                        onUpdateFurniturePriority={updateFurniturePriority}
                        onUpdateFurniture={updateFurnitureDetails}
                    />
                )}

                {activeTab === 'nieuwe-opdracht' && (userProfile.role === UserRole.Beheerder || userProfile.role === UserRole.Teamleider) && (
                    <NewOrderForm addOrder={addOrder} setActiveTab={setActiveTab} />
                )}

                {activeTab === 'klanten' && (userProfile.role === UserRole.Beheerder || userProfile.role === UserRole.Teamleider) && (
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Klanten</h2>
                         <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Naam</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Adres</th>
                                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acties</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {customers.map((cust, idx) => (
                                        <tr key={idx}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600" onClick={() => setEditingCustomer(cust)}>
                                                {cust.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                <div>{cust.email}</div>
                                                <div>{cust.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{cust.address}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-4">
                                                <button 
                                                    className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                                                    onClick={() => setEditingCustomer(cust)}
                                                >
                                                    <PencilIcon className="w-4 h-4" /> Bewerken
                                                </button>
                                                <button 
                                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" 
                                                    onClick={() => setSelectedCustomerForHistory(cust)}
                                                >
                                                    Geschiedenis
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {customers.length === 0 && (
                                        <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">Geen klanten gevonden.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {selectedCustomerForHistory && (
                            <CustomerHistoryModal 
                                customer={selectedCustomerForHistory} 
                                orders={orders} 
                                onClose={() => setSelectedCustomerForHistory(null)} 
                            />
                        )}
                        {editingCustomer && (
                            <EditCustomerModal
                                customer={editingCustomer}
                                onClose={() => setEditingCustomer(null)}
                                onSave={handleUpdateCustomer}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'vervoer' && (userProfile.role === UserRole.Beheerder || userProfile.role === UserRole.Teamleider) && (
                     <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Vervoer</h2>
                        <p className="text-gray-500">Vervoersplanning functionaliteit wordt later toegevoegd.</p>
                     </div>
                )}

                {activeTab === 'gebruikers' && userProfile.role === UserRole.Beheerder && (
                    <UsersView 
                        users={users} 
                        onUpdateUser={handleUpdateUser} 
                        currentUserEmail={user.email || ''} 
                        organizations={organizations}
                        supervisors={supervisors}
                        onSaveOrg={handleSaveOrg}
                        onDeleteOrg={handleDeleteOrg}
                        onSaveSup={handleSaveSup}
                        onDeleteSup={handleDeleteSup}
                    />
                )}

                {activeTab === 'mijn-account' && (
                     <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mijn Account</h2>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Naam</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{userProfile.displayName || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{userProfile.email}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{userProfile.role}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Afdeling</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{userProfile.department || 'Geen'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Telefoon</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{userProfile.phone || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adres</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">{userProfile.address || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;