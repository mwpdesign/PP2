import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Rating,
  FormHelperText,
} from '@mui/material';
import { Button, Card } from '../ui';

interface WoundLocation {
  anatomicalSite: string;
  laterality: 'left' | 'right' | 'central' | 'bilateral';
  description: string;
}

interface WoundAssessmentFormProps {
  onSubmit: (data: WoundAssessmentData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export interface WoundAssessmentData {
  // Patient Information (for IVR)
  patientId: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  diagnosisCodes: string[];
  
  // Wound Classification
  woundType: string;
  woundStage: string;
  woundLocation: WoundLocation;
  woundDuration: string;
  
  // Wound Measurements
  woundSize: {
    length: number;
    width: number;
    depth: number;
    undermining: number;
    tunneling: number;
  };
  
  // Wound Characteristics
  woundBed: string;
  woundEdges: string;
  periwoundSkin: string;
  exudateType: string;
  exudateAmount: string;
  odorPresent: boolean;
  
  // Pain Assessment
  painLevel: number;
  painCharacteristics: string;
  
  // Treatment
  currentDressings: string;
  treatmentHistory: string;
  previousProducts: string[];
  
  // Product Request (for IVR)
  requestedProducts: {
    productType: string;
    quantity: number;
    frequency: string;
    duration: string;
  }[];
  
  // Documentation
  photos: File[];
  clinicalNotes: string;
}

const WoundAssessmentForm: React.FC<WoundAssessmentFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<Partial<WoundAssessmentData>>({
    woundSize: {
      length: 0,
      width: 0,
      depth: 0,
      undermining: 0,
      tunneling: 0
    },
    requestedProducts: []
  });
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSubmit({ ...formData, photos } as WoundAssessmentData);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const updateWoundSize = (dimension: keyof WoundAssessmentData['woundSize'], value: number) => {
    setFormData({
      ...formData,
      woundSize: {
        ...(formData.woundSize || { length: 0, width: 0, depth: 0, undermining: 0, tunneling: 0 }),
        [dimension]: value
      }
    });
  };

  const addRequestedProduct = () => {
    setFormData({
      ...formData,
      requestedProducts: [
        ...(formData.requestedProducts || []),
        { productType: '', quantity: 1, frequency: '', duration: '' }
      ]
    });
  };

  return (
    <Card className="p-6">
      <Typography variant="h5" className="mb-6 text-gray-800 font-semibold">
        Wound Assessment & IVR Submission
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Insurance Information Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Insurance Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Insurance Provider</InputLabel>
                  <Select
                    value={formData.insuranceProvider || ''}
                    onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                    required
                    label="Insurance Provider"
                  >
                    <MenuItem value="medicare">Medicare</MenuItem>
                    <MenuItem value="medicaid">Medicaid</MenuItem>
                    <MenuItem value="bcbs">Blue Cross Blue Shield</MenuItem>
                    <MenuItem value="aetna">Aetna</MenuItem>
                    <MenuItem value="uhc">UnitedHealthcare</MenuItem>
                    <MenuItem value="cigna">Cigna</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Insurance Policy Number"
                  required
                  value={formData.insurancePolicyNumber || ''}
                  onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Wound Classification Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Wound Classification
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Wound Type</InputLabel>
                  <Select
                    value={formData.woundType || ''}
                    onChange={(e) => setFormData({ ...formData, woundType: e.target.value })}
                    required
                    label="Wound Type"
                  >
                    <MenuItem value="diabetic_ulcer">Diabetic Ulcer</MenuItem>
                    <MenuItem value="pressure_injury">Pressure Injury</MenuItem>
                    <MenuItem value="venous_ulcer">Venous Ulcer</MenuItem>
                    <MenuItem value="arterial_ulcer">Arterial Ulcer</MenuItem>
                    <MenuItem value="surgical">Surgical Wound</MenuItem>
                    <MenuItem value="burn">Burn</MenuItem>
                    <MenuItem value="trauma">Traumatic Wound</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Wound Stage</InputLabel>
                  <Select
                    value={formData.woundStage || ''}
                    onChange={(e) => setFormData({ ...formData, woundStage: e.target.value })}
                    required
                    label="Wound Stage"
                  >
                    <MenuItem value="stage1">Stage 1</MenuItem>
                    <MenuItem value="stage2">Stage 2</MenuItem>
                    <MenuItem value="stage3">Stage 3</MenuItem>
                    <MenuItem value="stage4">Stage 4</MenuItem>
                    <MenuItem value="unstageable">Unstageable</MenuItem>
                    <MenuItem value="suspected_deep">Suspected Deep Tissue Injury</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Wound Measurements Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Wound Measurements
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Length (cm)"
                  type="number"
                  required
                  value={formData.woundSize?.length || ''}
                  onChange={(e) => updateWoundSize('length', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Width (cm)"
                  type="number"
                  required
                  value={formData.woundSize?.width || ''}
                  onChange={(e) => updateWoundSize('width', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Depth (cm)"
                  type="number"
                  required
                  value={formData.woundSize?.depth || ''}
                  onChange={(e) => updateWoundSize('depth', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Undermining (cm)"
                  type="number"
                  value={formData.woundSize?.undermining || ''}
                  onChange={(e) => updateWoundSize('undermining', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tunneling (cm)"
                  type="number"
                  value={formData.woundSize?.tunneling || ''}
                  onChange={(e) => updateWoundSize('tunneling', parseFloat(e.target.value))}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Wound Characteristics Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Wound Characteristics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Wound Bed</InputLabel>
                  <Select
                    value={formData.woundBed || ''}
                    onChange={(e) => setFormData({ ...formData, woundBed: e.target.value })}
                    required
                    label="Wound Bed"
                  >
                    <MenuItem value="granulation">Granulation Tissue (Red)</MenuItem>
                    <MenuItem value="fibrin">Fibrin (Yellow)</MenuItem>
                    <MenuItem value="necrotic">Necrotic Tissue (Black)</MenuItem>
                    <MenuItem value="epithelialization">Epithelialization (Pink)</MenuItem>
                    <MenuItem value="mixed">Mixed Tissue Types</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Exudate Type</InputLabel>
                  <Select
                    value={formData.exudateType || ''}
                    onChange={(e) => setFormData({ ...formData, exudateType: e.target.value })}
                    required
                    label="Exudate Type"
                  >
                    <MenuItem value="serous">Serous</MenuItem>
                    <MenuItem value="serosanguineous">Serosanguineous</MenuItem>
                    <MenuItem value="sanguineous">Sanguineous</MenuItem>
                    <MenuItem value="purulent">Purulent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Pain Assessment Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Pain Assessment
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography component="legend">Pain Level (0-10)</Typography>
                <Rating
                  max={10}
                  value={formData.painLevel || 0}
                  onChange={(_, value) => setFormData({ ...formData, painLevel: value || 0 })}
                />
                <FormHelperText>0 = No Pain, 10 = Severe Pain</FormHelperText>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Pain Characteristics"
                  multiline
                  rows={2}
                  value={formData.painCharacteristics || ''}
                  onChange={(e) => setFormData({ ...formData, painCharacteristics: e.target.value })}
                  placeholder="Describe pain characteristics (e.g., burning, throbbing, etc.)"
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Treatment History Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Treatment History
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Dressings"
                  required
                  value={formData.currentDressings || ''}
                  onChange={(e) => setFormData({ ...formData, currentDressings: e.target.value })}
                  placeholder="List current dressing types and frequency of changes"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Treatment History"
                  multiline
                  rows={4}
                  required
                  value={formData.treatmentHistory || ''}
                  onChange={(e) => setFormData({ ...formData, treatmentHistory: e.target.value })}
                  placeholder="Describe previous treatments and their outcomes..."
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Product Request Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Product Request for IVR
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Button
                  variant="outline"
                  onClick={addRequestedProduct}
                  className="mb-4"
                >
                  Add Product Request
                </Button>
                {formData.requestedProducts?.map((product, index) => (
                  <Box key={index} className="mb-4 p-4 border rounded">
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Product Type</InputLabel>
                          <Select
                            value={product.productType}
                            onChange={(e) => {
                              const newProducts = [...(formData.requestedProducts || [])];
                              newProducts[index] = { ...product, productType: e.target.value };
                              setFormData({ ...formData, requestedProducts: newProducts });
                            }}
                            required
                            label="Product Type"
                          >
                            <MenuItem value="skin_graft">Skin Graft</MenuItem>
                            <MenuItem value="collagen_matrix">Collagen Matrix</MenuItem>
                            <MenuItem value="wound_dressing">Advanced Wound Dressing</MenuItem>
                            <MenuItem value="npwt">Negative Pressure Wound Therapy</MenuItem>
                            <MenuItem value="biological">Temperature-Controlled Biological Product</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Quantity"
                          type="number"
                          required
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...(formData.requestedProducts || [])];
                            newProducts[index] = { ...product, quantity: parseInt(e.target.value) };
                            setFormData({ ...formData, requestedProducts: newProducts });
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Frequency"
                          required
                          value={product.frequency}
                          onChange={(e) => {
                            const newProducts = [...(formData.requestedProducts || [])];
                            newProducts[index] = { ...product, frequency: e.target.value };
                            setFormData({ ...formData, requestedProducts: newProducts });
                          }}
                          placeholder="e.g., Weekly, Bi-weekly"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Duration"
                          required
                          value={product.duration}
                          onChange={(e) => {
                            const newProducts = [...(formData.requestedProducts || [])];
                            newProducts[index] = { ...product, duration: e.target.value };
                            setFormData({ ...formData, requestedProducts: newProducts });
                          }}
                          placeholder="e.g., 4 weeks, 3 months"
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </Grid>

          {/* Documentation Section */}
          <Grid item xs={12}>
            <Typography variant="h6" className="mb-4 text-gray-700">
              Documentation
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="wound-photos"
                  multiple
                  type="file"
                  onChange={handlePhotoUpload}
                />
                <label htmlFor="wound-photos">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2E86AB] mb-2"
                  >
                    Upload Wound Photos
                  </button>
                </label>
                {photos.length > 0 && (
                  <Typography variant="body2" className="mt-2 text-gray-600">
                    {photos.length} photo{photos.length === 1 ? '' : 's'} selected
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Clinical Notes"
                  multiline
                  rows={4}
                  value={formData.clinicalNotes || ''}
                  onChange={(e) => setFormData({ ...formData, clinicalNotes: e.target.value })}
                  placeholder="Additional clinical notes or observations..."
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Form Actions */}
          <Grid item xs={12}>
            <Box className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Assessment & IVR Request'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Card>
  );
};

export default WoundAssessmentForm; 