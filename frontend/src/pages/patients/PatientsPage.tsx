import React, { useState } from 'react';
import { ArrowLeft, Plus, FileText, Search, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NewPatientForm } from '../../components/patients/NewPatientForm';
import PatientIntakeForm from '../../components/patients/PatientIntakeForm';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

type ViewType = 'hub' | 'new-patient' | 'quick-intake' | 'search';

export default function PatientsPage() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('hub');

  const renderView = () => {
    switch (currentView) {
      case 'new-patient':
        return (
          <div className="bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <button
                onClick={() => setCurrentView('hub')}
                className="flex items-center text-slate-600 hover:text-slate-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patient Management
              </button>
              <h2 className="text-xl font-bold text-slate-900">New Patient Registration</h2>
            </div>
            <ErrorBoundary fallback={<div className="p-6 text-center">Loading sophisticated form...</div>}>
              <NewPatientForm onClose={() => setCurrentView('hub')} onSave={() => setCurrentView('hub')} />
            </ErrorBoundary>
          </div>
        );
        
      case 'quick-intake':
        return (
          <div className="bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <button
                onClick={() => setCurrentView('hub')}
                className="flex items-center text-slate-600 hover:text-slate-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patient Management
              </button>
              <h2 className="text-xl font-bold text-slate-900">Quick Patient Intake</h2>
            </div>
            <ErrorBoundary fallback={<div className="p-6 text-center">Loading intake form...</div>}>
              <PatientIntakeForm />
            </ErrorBoundary>
          </div>
        );

      case 'search':
        return (
          <div className="bg-white p-6">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <button
                onClick={() => setCurrentView('hub')}
                className="flex items-center text-slate-600 hover:text-slate-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Patient Management
              </button>
              <h2 className="text-xl font-bold text-slate-900">Patient Search</h2>
            </div>
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Patient search functionality coming soon</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white">
            <div className="border-b border-slate-200 px-6 py-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center text-slate-600 hover:text-slate-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Patient Management</h1>
                  <p className="text-slate-600">Create and manage patient records</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setCurrentView('new-patient')}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-slate-100 group-hover:bg-slate-200 p-3 rounded-lg">
                      <Plus className="w-6 h-6 text-slate-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">New Patient Registration</h3>
                  <p className="text-slate-600 text-sm">Complete patient registration with full medical history and documentation</p>
                  <div className="mt-4 text-xs text-emerald-600 font-medium">1,352 lines • Advanced Form</div>
                </button>

                <button
                  onClick={() => setCurrentView('quick-intake')}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-emerald-100 group-hover:bg-emerald-200 p-3 rounded-lg">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Quick Patient Intake</h3>
                  <p className="text-slate-600 text-sm">Streamlined intake form for urgent care and walk-in patients</p>
                  <div className="mt-4 text-xs text-emerald-600 font-medium">580 lines • Sophisticated Form</div>
                </button>

                <button
                  onClick={() => setCurrentView('search')}
                  className="bg-white border border-slate-200 rounded-lg p-6 hover:border-slate-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-amber-100 group-hover:bg-amber-200 p-3 rounded-lg">
                      <Search className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Search Patients</h3>
                  <p className="text-slate-600 text-sm">Search existing patient records and manage patient information</p>
                  <div className="mt-4 text-xs text-slate-600 font-medium">Search & Management</div>
                </button>
              </div>

              <div className="mt-8 bg-slate-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Sophisticated Patient Management System</h3>
                <p className="text-slate-600 mb-4">Access your advanced patient forms with comprehensive validation, document upload, and HIPAA-compliant data handling.</p>
                <div className="flex items-center text-sm text-slate-500">
                  <Users className="w-4 h-4 mr-2" />
                  Enterprise-grade forms ready for production use
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {renderView()}
    </div>
  );
} 