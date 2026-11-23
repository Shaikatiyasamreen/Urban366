import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  MapPin, 
  Search, 
  Filter, 
  ShieldCheck, 
  Key, 
  LogOut, 
  ArrowLeft, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  Briefcase, 
  Plus, 
  X, 
  RefreshCw, 
  Eye, 
  EyeOff,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { API_BASE, API_BASE_URL } from '../config';

const POPULAR_LOCALITIES = [
  'Richmond Town',
  'Indiranagar',
  'Koramangala',
  'HSR Layout',
  'Whitefield',
  'Jayanagar',
  'Malleshwaram',
  'Bellandur',
  'Electronic City'
];

const SERVICE_CATEGORIES = [
  'Cleaning',
  'Plumbing',
  'Electrical',
  'Salon',
  'Carpentry',
  'Appliance Repair',
  'Home Painting',
  'Smart Living'
];

export default function AdminDashboard({ onNavigateHome }) {
  // Auth state
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('urbab366_admin_key') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Laborers data state
  const [laborers, setLaborers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Filters state
  const [selectedLocality, setSelectedLocality] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New Laborer Form state
  const [isAddFormOpen, setIsAddFormOpen] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState(SERVICE_CATEGORIES[0]);
  const [newLocalities, setNewLocalities] = useState(['Richmond Town', 'Indiranagar']);
  const [customLocalityInput, setCustomLocalityInput] = useState('');
  const [newExperience, setNewExperience] = useState(3);
  const [newAvailability, setNewAvailability] = useState('Available');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Laborer Modal state
  const [editingLaborer, setEditingLaborer] = useState(null);
  const [editLocalities, setEditLocalities] = useState([]);
  const [editLocalityInput, setEditLocalityInput] = useState('');
  const [editAvailability, setEditAvailability] = useState('Available');
  const [editExperience, setEditExperience] = useState(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (adminKey) {
      verifyKey(adminKey);
    }
  }, []);

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const verifyKey = async (keyToVerify) => {
    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-key': keyToVerify 
        },
        body: JSON.stringify({ key: keyToVerify })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('urbab366_admin_key', keyToVerify);
        fetchLaborers(keyToVerify);
      } else {
        setAuthError(data.error || 'Invalid administrator secret key');
        setIsAuthenticated(false);
        sessionStorage.removeItem('urbab366_admin_key');
      }
    } catch (err) {
      setAuthError('Failed to reach backend server. Please verify your connection.');
      setIsAuthenticated(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!adminKey.trim()) {
      setAuthError('Please enter the admin key');
      return;
    }
    verifyKey(adminKey.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('urbab366_admin_key');
    setAdminKey('');
    setIsAuthenticated(false);
    setLaborers([]);
  };

  const fetchLaborers = async (key = adminKey) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/admin/laborers`, {
        headers: { 'x-admin-key': key }
      });
      if (res.ok) {
        const data = await res.json();
        setLaborers(data);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
        setAuthError('Session expired or unauthorized. Please re-enter the admin key.');
      } else {
        setErrorMsg('Failed to load laborers list');
      }
    } catch (err) {
      setErrorMsg('Error connecting to backend server');
    } finally {
      setLoading(false);
    }
  };

  // Toggle locality selection for Add Form
  const toggleNewLocality = (loc) => {
    if (newLocalities.includes(loc)) {
      setNewLocalities(newLocalities.filter(l => l !== loc));
    } else {
      setNewLocalities([...newLocalities, loc]);
    }
  };

  const handleAddCustomLocality = (e) => {
    e.preventDefault();
    const clean = customLocalityInput.trim();
    if (clean && !newLocalities.includes(clean)) {
      setNewLocalities([...newLocalities, clean]);
      setCustomLocalityInput('');
    }
  };

  // Submit Add Laborer
  const handleAddLaborer = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Please provide name and phone number');
      return;
    }
    if (newLocalities.length === 0) {
      alert('Please select at least one preferred locality/area');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/laborers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          service_category: newCategory,
          preferred_localities: newLocalities.join(', '),
          experience_years: parseInt(newExperience, 10) || 1,
          availability_status: newAvailability
        })
      });

      const data = await res.json();
      if (res.ok) {
        setLaborers([data, ...laborers]);
        setNewName('');
        setNewPhone('');
        setNewLocalities(['Richmond Town']);
        showNotification(`Laborer ${data.name} added successfully!`);
      } else {
        alert(data.error || 'Failed to add laborer');
      }
    } catch (err) {
      alert('Network error while adding laborer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Toggle directly from card / table
  const handleStatusToggle = async (laborer, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/admin/laborers/${laborer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          availability_status: newStatus
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setLaborers(laborers.map(l => l.id === updated.id ? updated : l));
        showNotification(`${updated.name} is now ${newStatus}`);
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      alert('Error connecting to backend');
    }
  };

  // Delete Laborer
  const handleDeleteLaborer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from registered laborers?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/admin/laborers/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });
      if (res.ok) {
        setLaborers(laborers.filter(l => l.id !== id));
        showNotification(`Laborer ${name} removed`);
      } else {
        alert('Failed to delete laborer');
      }
    } catch (err) {
      alert('Network error deleting laborer');
    }
  };

  // Open Edit Modal
  const openEditModal = (laborer) => {
    setEditingLaborer(laborer);
    const locs = laborer.preferred_localities 
      ? laborer.preferred_localities.split(',').map(s => s.strip ? s.strip() : s.trim()).filter(Boolean)
      : [];
    setEditLocalities(locs);
    setEditAvailability(laborer.availability_status || 'Available');
    setEditExperience(laborer.experience_years || 1);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingLaborer) return;
    if (editLocalities.length === 0) {
      alert('Must select at least one locality');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/admin/laborers/${editingLaborer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          preferred_localities: editLocalities.join(', '),
          availability_status: editAvailability,
          experience_years: parseInt(editExperience, 10) || 1
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setLaborers(laborers.map(l => l.id === updated.id ? updated : l));
        setEditingLaborer(null);
        showNotification(`Updated ${updated.name}'s profile`);
      } else {
        alert('Failed to update laborer');
      }
    } catch (err) {
      alert('Network error saving laborer updates');
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute all unique localities from current laborers for filter dropdown
  const allUniqueLocalities = useMemo(() => {
    const set = new Set(POPULAR_LOCALITIES);
    laborers.forEach(l => {
      if (l.preferred_localities) {
        l.preferred_localities.split(',').forEach(loc => {
          const trimmed = loc.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, [laborers]);

  // Client-side filtered laborers
  const filteredLaborers = useMemo(() => {
    return laborers.filter(l => {
      // Locality filter
      if (selectedLocality) {
        const locs = (l.preferred_localities || '').toLowerCase();
        if (!locs.includes(selectedLocality.toLowerCase())) return false;
      }
      // Category filter
      if (selectedCategory && l.service_category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus && l.availability_status !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (l.name || '').toLowerCase().includes(q);
        const matchesPhone = (l.phone || '').toLowerCase().includes(q);
        const matchesLocs = (l.preferred_localities || '').toLowerCase().includes(q);
        const matchesCat = (l.service_category || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesLocs && !matchesCat) return false;
      }
      return true;
    });
  }, [laborers, selectedLocality, selectedCategory, selectedStatus, searchQuery]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = laborers.length;
    const available = laborers.filter(l => l.availability_status === 'Available').length;
    const busy = laborers.filter(l => l.availability_status === 'Busy').length;
    const inactive = laborers.filter(l => l.availability_status === 'Inactive').length;
    return { total, available, busy, inactive, localitiesCount: allUniqueLocalities.length };
  }, [laborers, allUniqueLocalities]);

  const getCategoryBadgeClass = (category) => {
    switch(category?.toLowerCase()) {
      case 'plumbing': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'electrical': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cleaning': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'salon': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'appliance repair': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'carpentry': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Available') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Available
        </span>
      );
    } else if (status === 'Busy') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Busy
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          Inactive
        </span>
      );
    }
  };

  // --------------------------------------------------------------------------
  // 1. LOGIN SCREEN (If not authenticated)
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Background glow accents */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 animate-fade-in">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 p-7 text-white text-center relative">
            <button
              onClick={onNavigateHome}
              className="absolute top-4 left-4 flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-emerald-400 mx-auto flex items-center justify-center text-white font-black text-xl shadow-lg mb-3">
              U366
            </div>
            <h2 className="text-2xl font-black tracking-tight">Admin Dispatch Portal</h2>
            <p className="text-xs text-slate-300 mt-1">
              Laborer & Bengaluru Locality Management
            </p>
          </div>

          {/* Form Body */}
          <form onSubmit={handleLoginSubmit} className="p-7 space-y-5">
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Administrator Secret Key
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter administrator password..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 rounded-xl outline-none transition-all placeholder:text-slate-400 font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Default password: <code className="bg-slate-100 text-violet-700 px-1 py-0.5 rounded font-mono font-bold">urbab366admin</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>Authenticate & Enter Admin</span>
                </>
              )}
            </button>

            {/* Quick Demo Pre-fill Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAdminKey('urbab366admin');
                  verifyKey('urbab366admin');
                }}
                className="text-xs font-semibold text-violet-600 hover:text-violet-800 hover:underline"
              >
                Use default password & auto-login
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Endpoint: {API_BASE_URL.replace('https://', '')}
              </span>
              <button
                type="button"
                onClick={onNavigateHome}
                className="font-semibold text-slate-600 hover:text-slate-900"
              >
                Return Home
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-xs backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Left: Brand & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to customer homepage"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-900 via-indigo-900 to-slate-900 flex items-center justify-center text-white font-extrabold shadow-sm text-xs">
                U366
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black text-slate-900 leading-tight">
                    Admin Portal
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-violet-100 text-violet-800 rounded-full uppercase">
                    Laborer Dispatch
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Urbab366 Bengaluru Workforce Manager
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & Logout */}
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live: {API_BASE_URL.replace('https://', '').replace('http://', '')}
            </span>

            <button
              onClick={() => fetchLaborers(adminKey)}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Refresh laborers list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-violet-600' : ''}`} />
            </button>

            <button
              onClick={onNavigateHome}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
            >
              <span>View Website</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 transition-colors"
              title="End admin session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Laborers</span>
              <Users className="w-4 h-4 text-violet-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {stats.localitiesCount} localities</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Available Now</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.available}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Ready for instant assignment</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>On Job (Busy)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.busy}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Currently serving bookings</p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Localities Covered</span>
              <MapPin className="w-4 h-4 text-sky-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.localitiesCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Bengaluru service coverage</p>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* ADD LABORER FORM (Collapsible Card) */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div 
            onClick={() => setIsAddFormOpen(!isAddFormOpen)}
            className="p-5 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Register New Laborer & Service Localities
                </h3>
                <p className="text-xs text-slate-500">
                  Assign verified professionals to specific Bengaluru regions and trades
                </p>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-700">
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isAddFormOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {isAddFormOpen && (
            <form onSubmit={handleAddLaborer} className="p-5 sm:p-6 space-y-5 bg-slate-50/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="+91 98450 12345"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-violet-600 focus:ring-2 focus:ring-violet-100 outline-none transition-all placeholder:text-slate-400 font-mono"
                    />
                  </div>
                </div>

                {/* Service Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Service Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-violet-600 outline-none"
                  >
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Experience & Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Exp (Yrs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      value={newExperience}
                      onChange={(e) => setNewExperience(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:border-violet-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Status
                    </label>
                    <select
                      value={newAvailability}
                      onChange={(e) => setNewAvailability(e.target.value)}
                      className="w-full px-2 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-violet-600 outline-none"
                    >
                      <option value="Available">Available</option>
                      <option value="Busy">Busy</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Preferred Localities Section with Multi-select Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preferred Localities / Service Areas * (Click chips to toggle)
                </label>
                
                {/* Popular Locality Chips */}
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {POPULAR_LOCALITIES.map((loc) => {
                    const isSelected = newLocalities.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => toggleNewLocality(loc)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                        }`}
                      >
                        <MapPin className={`w-3 h-3 ${isSelected ? 'text-emerald-300' : 'text-slate-400'}`} />
                        <span>{loc}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Localities Pills & Custom Add Input */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Assigned ({newLocalities.length}):
                    </span>
                    {newLocalities.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-violet-50 text-violet-800 border border-violet-200 rounded-md"
                      >
                        {loc}
                        <button
                          type="button"
                          onClick={() => toggleNewLocality(loc)}
                          className="hover:text-rose-600 transition-colors ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {newLocalities.length === 0 && (
                      <span className="text-xs text-rose-500 font-medium">None selected yet</span>
                    )}
                  </div>

                  {/* Custom Locality Input */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Add another Bengaluru locality (e.g. Hebbal, Sarjapur)..."
                      value={customLocalityInput}
                      onChange={(e) => setCustomLocalityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomLocality(e);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-violet-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomLocality}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Area</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-700 to-indigo-700 hover:from-violet-800 hover:to-indigo-800 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registering...' : 'Register Laborer'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* LOCALITY SEARCH & FILTER BAR */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>Laborer Dispatch Directory</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {filteredLaborers.length} showing
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Filter and inspect staff available to dispatch to specific neighborhoods
              </p>
            </div>

            {/* Clear Filters if any active */}
            {(selectedLocality || selectedCategory || selectedStatus || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedLocality('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Locality Filter Dropdown */}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-violet-600" />
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-violet-600 outline-none appearance-none cursor-pointer"
              >
                <option value="">All Bengaluru Localities ({allUniqueLocalities.length})</option>
                {allUniqueLocalities.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Category Filter Dropdown */}
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 w-4 h-4 text-indigo-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-violet-600 outline-none appearance-none cursor-pointer"
              >
                <option value="">All Service Trades (All Categories)</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Availability Filter Dropdown */}
            <div className="relative">
              <Clock className="absolute left-3 top-3 w-4 h-4 text-emerald-600" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-violet-600 outline-none appearance-none cursor-pointer"
              >
                <option value="">All Availability Statuses</option>
                <option value="Available">Available (Ready to Dispatch)</option>
                <option value="Busy">Busy (On Active Job)</option>
                <option value="Inactive">Inactive (Off-duty)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, phone, area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-violet-600 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* LABORERS TABLE / DIRECTORY */}
        {/* ------------------------------------------------------------------ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-violet-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-600">Loading registered laborers...</p>
            </div>
          ) : filteredLaborers.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No laborers found matching criteria</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedLocality 
                  ? `No laborers are currently assigned to '${selectedLocality}'. Try clearing the locality filter or register a new laborer for this area above.`
                  : 'Try adjusting your category, locality, or search filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 sm:px-6">Laborer Profile</th>
                    <th className="py-3.5 px-4">Trade / Category</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4">Preferred Localities / Areas</th>
                    <th className="py-3.5 px-4">Status & Dispatch</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredLaborers.map((lab) => {
                    const locList = (lab.preferred_localities || '')
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);

                    return (
                      <tr key={lab.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Profile Info */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-100 to-indigo-100 text-violet-800 font-extrabold flex items-center justify-center text-sm border border-violet-200 shrink-0">
                              {lab.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 leading-snug">
                                {lab.name}
                              </p>
                              <p className="text-xs font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{lab.phone}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${getCategoryBadgeClass(lab.service_category)}`}>
                            {lab.service_category}
                          </span>
                        </td>

                        {/* Experience */}
                        <td className="py-4 px-4">
                          <span className="font-semibold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                            {lab.experience_years} {lab.experience_years === 1 ? 'yr' : 'yrs'} exp
                          </span>
                        </td>

                        {/* Preferred Localities */}
                        <td className="py-4 px-4 max-w-[340px]">
                          <div className="flex flex-wrap gap-1">
                            {locList.map((loc, idx) => {
                              const isFiltered = selectedLocality && loc.toLowerCase().includes(selectedLocality.toLowerCase());
                              return (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${
                                    isFiltered
                                      ? 'bg-violet-700 text-white border-violet-700'
                                      : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <MapPin className="w-2.5 h-2.5 shrink-0 opacity-60" />
                                  <span>{loc}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Availability Status (Interactive Toggle) */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(lab.availability_status)}
                            
                            {/* Fast status switcher */}
                            <select
                              value={lab.availability_status}
                              onChange={(e) => handleStatusToggle(lab, e.target.value)}
                              className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-md py-0.5 px-1 outline-none hover:bg-white"
                            >
                              <option value="Available">Available</option>
                              <option value="Busy">Busy</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(lab)}
                              className="p-1.5 text-slate-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                              title="Edit Localities & Profile"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLaborer(lab.id, lab.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Remove Laborer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------------ */}
      {/* EDIT LABORER MODAL */}
      {/* ------------------------------------------------------------------ */}
      {editingLaborer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-lg font-bold">Edit Laborer Localities</h3>
                <p className="text-xs text-slate-400">{editingLaborer.name} · {editingLaborer.service_category}</p>
              </div>
              <button
                onClick={() => setEditingLaborer(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Status and Experience */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Availability Status
                  </label>
                  <select
                    value={editAvailability}
                    onChange={(e) => setEditAvailability(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Years of Experience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Localities Chips */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Bengaluru Areas
                </label>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {POPULAR_LOCALITIES.map(loc => {
                    const isSel = editLocalities.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          if (isSel) setEditLocalities(editLocalities.filter(l => l !== loc));
                          else setEditLocalities([...editLocalities, loc]);
                        }}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                          isSel 
                            ? 'bg-violet-700 text-white border-violet-700' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {loc}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Area */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add another area..."
                    value={editLocalityInput}
                    onChange={(e) => setEditLocalityInput(e.target.value)}
                    className="flex-1 p-2 text-xs border border-slate-200 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const t = editLocalityInput.trim();
                      if (t && !editLocalities.includes(t)) {
                        setEditLocalities([...editLocalities, t]);
                        setEditLocalityInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {editLocalities.map(loc => (
                    <span key={loc} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold bg-violet-100 text-violet-800 rounded">
                      {loc}
                      <button 
                        onClick={() => setEditLocalities(editLocalities.filter(l => l !== loc))}
                        className="text-violet-600 hover:text-rose-600 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingLaborer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
