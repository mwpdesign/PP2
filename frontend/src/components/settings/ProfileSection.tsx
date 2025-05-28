import React, { useState } from 'react';
import { Camera, Save, X, Building2, Truck } from 'lucide-react';

interface ProfileFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  specialty: string;
  email: string;
  phone: string;
  emergencyContact: string;

  // Professional Credentials
  licenseNumber: string;
  npiNumber: string;
  medicareProviderNumber: string; // PTAN
  medicaidProviderNumber: string;
  taxId: string;
  yearsExperience: string;
  boardCertifications: string;
  professionalBio: string;

  // Facility Information
  primaryFacility: string;
  officeContactName: string;
  officePhone: string;
  officeFax: string;

  // Shipping Information
  shippingStreet: string;
  shippingCity: string;
  shippingState: string;
  shippingZip: string;
  shippingContactName: string;
  shippingPhone: string;
  deliveryInstructions: string;
}

const ProfileSection: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProfileFormData>({
    // Personal Information
    firstName: 'John',
    lastName: 'Doe',
    title: 'Dr.',
    specialty: 'Internal Medicine',
    email: 'john.doe@healthcare.com',
    phone: '(555) 123-4567',
    emergencyContact: '(555) 987-6543',

    // Professional Credentials
    licenseNumber: 'MD123456',
    npiNumber: '1234567890',
    medicareProviderNumber: 'K234567',
    medicaidProviderNumber: 'MP987654',
    taxId: '12-3456789',
    yearsExperience: '15',
    boardCertifications: 'American Board of Internal Medicine',
    professionalBio: 'Experienced physician specializing in internal medicine with focus on preventive care.',

    // Facility Information
    primaryFacility: 'City General Hospital',
    officeContactName: 'Sarah Johnson',
    officePhone: '(555) 234-5678',
    officeFax: '(555) 234-5679',

    // Shipping Information
    shippingStreet: '123 Medical Center Drive',
    shippingCity: 'San Francisco',
    shippingState: 'CA',
    shippingZip: '94143',
    shippingContactName: 'Mark Wilson',
    shippingPhone: '(555) 345-6789',
    deliveryInstructions: 'Delivery entrance on side of building. Hours: 8am-5pm M-F',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // TODO: Implement save functionality with validation
    setIsEditing(false);
  };

  const handleCancel = () => {
    // TODO: Reset form data to original values
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Profile Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
          >
            Edit Profile
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-slate-600 text-white rounded-md hover:bg-slate-700"
            >
              <Save className="w-4 h-4 inline-block mr-1" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
            >
              <X className="w-4 h-4 inline-block mr-1" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Profile Image */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Camera className="w-8 h-8" />
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 p-1 bg-slate-600 rounded-full text-white cursor-pointer hover:bg-slate-700">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
            </label>
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium text-slate-800">
            {formData.firstName} {formData.lastName}
          </h3>
          <p className="text-sm text-slate-600">{formData.title} - {formData.specialty}</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Professional Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Specialty</label>
            <input
              type="text"
              name="specialty"
              value={formData.specialty}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Professional Credentials */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Professional Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">License Number</label>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">NPI Number</label>
            <input
              type="text"
              name="npiNumber"
              value={formData.npiNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Medicare Provider # (PTAN)</label>
            <input
              type="text"
              name="medicareProviderNumber"
              value={formData.medicareProviderNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Medicaid Provider #</label>
            <input
              type="text"
              name="medicaidProviderNumber"
              value={formData.medicaidProviderNumber}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tax ID</label>
            <input
              type="text"
              name="taxId"
              value={formData.taxId}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Facility Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Building2 className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Facility Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Primary Facility</label>
            <input
              type="text"
              name="primaryFacility"
              value={formData.primaryFacility}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Office Contact Name</label>
            <input
              type="text"
              name="officeContactName"
              value={formData.officeContactName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Office Phone</label>
            <input
              type="tel"
              name="officePhone"
              value={formData.officePhone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Office Fax</label>
            <input
              type="tel"
              name="officeFax"
              value={formData.officeFax}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Truck className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-800">Shipping Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Street Address</label>
            <input
              type="text"
              name="shippingStreet"
              value={formData.shippingStreet}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">City</label>
            <input
              type="text"
              name="shippingCity"
              value={formData.shippingCity}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">State</label>
              <input
                type="text"
                name="shippingState"
                value={formData.shippingState}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">ZIP Code</label>
              <input
                type="text"
                name="shippingZip"
                value={formData.shippingZip}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Shipping Contact Name</label>
            <input
              type="text"
              name="shippingContactName"
              value={formData.shippingContactName}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Shipping Phone</label>
            <input
              type="tel"
              name="shippingPhone"
              value={formData.shippingPhone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Delivery Instructions</label>
            <textarea
              name="deliveryInstructions"
              value={formData.deliveryInstructions}
              onChange={handleInputChange}
              disabled={!isEditing}
              rows={2}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
              placeholder="Special delivery instructions, access codes, or preferred delivery times"
            />
          </div>
        </div>
      </div>

      {/* Professional Bio */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Professional Bio</h3>
        <div>
          <textarea
            name="professionalBio"
            value={formData.professionalBio}
            onChange={handleInputChange}
            disabled={!isEditing}
            rows={4}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileSection; 