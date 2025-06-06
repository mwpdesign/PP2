import React, { useState } from 'react';
import { Clock, Search, Star, Zap, FileText, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WoundCareTemplate {
  id: string;
  name: string;
  category: 'acute' | 'chronic' | 'surgical' | 'diabetic' | 'pressure' | 'venous';
  priority: 'urgent' | 'high' | 'medium' | 'routine';
  estimatedTime: string;
  fields: {
    woundType: string;
    location: string;
    size: string;
    depth: string;
    drainage: string;
    painLevel: string;
    treatment: string;
    frequency: string;
    supplies: string[];
    notes: string;
  };
  icd10Codes: string[];
  commonSupplies: string[];
}

interface QuickTemplatesProps {
  onTemplateSelect: (template: WoundCareTemplate) => void;
  onClose: () => void;
  currentFormData?: any;
}

const WOUND_CARE_TEMPLATES: WoundCareTemplate[] = [
  {
    id: 'diabetic-foot-ulcer',
    name: 'Diabetic Foot Ulcer',
    category: 'diabetic',
    priority: 'high',
    estimatedTime: '2-3 minutes',
    fields: {
      woundType: 'Diabetic foot ulcer',
      location: 'Plantar surface, great toe',
      size: '2.5cm x 1.8cm',
      depth: 'Partial thickness',
      drainage: 'Minimal serous',
      painLevel: '4/10',
      treatment: 'Debridement, antimicrobial dressing',
      frequency: 'Every 3 days',
      supplies: ['Antimicrobial foam dressing', 'Gauze', 'Medical tape', 'Saline solution'],
      notes: 'Patient has diabetes mellitus type 2. Wound present for 3 weeks. No signs of infection currently.'
    },
    icd10Codes: ['E11.621', 'L97.519'],
    commonSupplies: ['Antimicrobial foam dressing', 'Alginate dressing', 'Hydrogel', 'Offloading device']
  },
  {
    id: 'pressure-ulcer-stage2',
    name: 'Pressure Ulcer - Stage 2',
    category: 'pressure',
    priority: 'high',
    estimatedTime: '2 minutes',
    fields: {
      woundType: 'Pressure ulcer, stage 2',
      location: 'Sacral area',
      size: '3.0cm x 2.5cm',
      depth: 'Partial thickness',
      drainage: 'Moderate serous',
      painLevel: '6/10',
      treatment: 'Hydrocolloid dressing, pressure redistribution',
      frequency: 'Every 5-7 days',
      supplies: ['Hydrocolloid dressing', 'Foam padding', 'Barrier cream'],
      notes: 'Patient bedbound. Requires pressure redistribution mattress and frequent repositioning.'
    },
    icd10Codes: ['L89.152'],
    commonSupplies: ['Hydrocolloid dressing', 'Foam dressing', 'Pressure redistribution cushion']
  },
  {
    id: 'venous-leg-ulcer',
    name: 'Venous Leg Ulcer',
    category: 'venous',
    priority: 'medium',
    estimatedTime: '2-3 minutes',
    fields: {
      woundType: 'Venous stasis ulcer',
      location: 'Medial malleolus, left leg',
      size: '4.2cm x 3.1cm',
      depth: 'Shallow, partial thickness',
      drainage: 'Heavy serous',
      painLevel: '5/10',
      treatment: 'Compression therapy, absorbent dressing',
      frequency: 'Every 3-4 days',
      supplies: ['Absorbent foam dressing', 'Compression bandage system', 'Skin protectant'],
      notes: 'Chronic venous insufficiency. Requires compression therapy and leg elevation.'
    },
    icd10Codes: ['I87.2', 'L97.229'],
    commonSupplies: ['Compression bandages', 'Absorbent foam', 'Zinc oxide paste']
  },
  {
    id: 'surgical-dehiscence',
    name: 'Surgical Wound Dehiscence',
    category: 'surgical',
    priority: 'urgent',
    estimatedTime: '1-2 minutes',
    fields: {
      woundType: 'Post-surgical dehiscence',
      location: 'Abdominal incision',
      size: '8.0cm x 1.5cm',
      depth: 'Full thickness',
      drainage: 'Minimal serosanguinous',
      painLevel: '7/10',
      treatment: 'Negative pressure wound therapy',
      frequency: 'Every 3 days',
      supplies: ['NPWT system', 'Foam dressing', 'Transparent film'],
      notes: 'Post-operative day 5. Partial dehiscence of surgical site. No signs of infection.'
    },
    icd10Codes: ['T81.31XA', 'T81.89XA'],
    commonSupplies: ['NPWT system', 'Black foam', 'Transparent adhesive film']
  },
  {
    id: 'acute-laceration',
    name: 'Acute Laceration',
    category: 'acute',
    priority: 'high',
    estimatedTime: '1-2 minutes',
    fields: {
      woundType: 'Traumatic laceration',
      location: 'Forearm, dorsal surface',
      size: '5.0cm x 0.8cm',
      depth: 'Partial thickness',
      drainage: 'Minimal bloody',
      painLevel: '6/10',
      treatment: 'Primary closure, antibiotic ointment',
      frequency: 'Daily dressing change',
      supplies: ['Non-adherent dressing', 'Gauze', 'Medical tape', 'Antibiotic ointment'],
      notes: 'Fresh laceration from fall. Cleaned and irrigated. No foreign bodies present.'
    },
    icd10Codes: ['S51.819A'],
    commonSupplies: ['Non-adherent pad', 'Gauze rolls', 'Paper tape', 'Saline solution']
  },
  {
    id: 'chronic-wound-maintenance',
    name: 'Chronic Wound Maintenance',
    category: 'chronic',
    priority: 'routine',
    estimatedTime: '2 minutes',
    fields: {
      woundType: 'Chronic non-healing wound',
      location: 'Lower extremity',
      size: '3.5cm x 2.8cm',
      depth: 'Partial thickness',
      drainage: 'Moderate serous',
      painLevel: '4/10',
      treatment: 'Moisture-retentive dressing, debridement PRN',
      frequency: 'Twice weekly',
      supplies: ['Hydrogel dressing', 'Secondary dressing', 'Gauze'],
      notes: 'Chronic wound present for 6+ months. Slow healing progress. Regular debridement needed.'
    },
    icd10Codes: ['L98.499'],
    commonSupplies: ['Hydrogel sheets', 'Foam secondary dressing', 'Gauze pads']
  }
];

const QuickTemplates: React.FC<QuickTemplatesProps> = ({
  onTemplateSelect,
  onClose,
  currentFormData
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredTemplates = WOUND_CARE_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.fields.woundType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.fields.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || template.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const handleTemplateSelect = (template: WoundCareTemplate) => {
    onTemplateSelect(template);
    toast.success(`Applied ${template.name} template`);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'acute': return <Zap className="w-4 h-4 text-red-500" />;
      case 'chronic': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'surgical': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'diabetic': return <Activity className="w-4 h-4 text-purple-500" />;
      case 'pressure': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'venous': return <Activity className="w-4 h-4 text-green-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'routine': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Wound Care Quick Templates
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Select a template to quickly populate your IVR form with common wound care scenarios
          </p>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="acute">Acute Wounds</option>
              <option value="chronic">Chronic Wounds</option>
              <option value="surgical">Surgical Wounds</option>
              <option value="diabetic">Diabetic Wounds</option>
              <option value="pressure">Pressure Ulcers</option>
              <option value="venous">Venous Ulcers</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="routine">Routine</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(template.category)}
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(template.priority)}`}>
                    {template.priority}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Location:</span>
                    <span>{template.fields.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Size:</span>
                    <span>{template.fields.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Treatment:</span>
                    <span className="text-right">{template.fields.treatment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Frequency:</span>
                    <span>{template.fields.frequency}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Est. completion: {template.estimatedTime}
                    </span>
                    <span className="text-xs text-blue-600 font-medium">
                      {template.commonSupplies.length} supplies included
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">
                Try adjusting your search criteria or browse all available templates.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickTemplates;