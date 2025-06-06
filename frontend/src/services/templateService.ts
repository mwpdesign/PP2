import api from './api';
import config from '../config';

export interface WoundCareTemplate {
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
  createdAt?: Date;
  updatedAt?: Date;
  usageCount?: number;
  lastUsed?: Date;
}

export interface TemplateUsageStats {
  templateId: string;
  usageCount: number;
  averageCompletionTime: number;
  successRate: number;
  lastUsed: Date;
}

export interface TemplateSearchFilters {
  category?: string;
  priority?: string;
  searchTerm?: string;
  sortBy?: 'name' | 'usage' | 'recent' | 'category';
  sortOrder?: 'asc' | 'desc';
}

class TemplateService {
  private cache: Map<string, WoundCareTemplate> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  /**
   * Get all wound care templates with optional filtering
   */
  async getTemplates(filters?: TemplateSearchFilters): Promise<WoundCareTemplate[]> {
    try {
      // Check cache first
      if (this.isCacheValid() && this.cache.size > 0) {
        return this.filterTemplates(Array.from(this.cache.values()), filters);
      }

      const response = await api.get<WoundCareTemplate[]>(
        config.getAPIEndpoint('/api/v1/templates/wound-care'),
        { params: filters }
      );

      // Update cache
      this.updateCache(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch templates:', error);

      // Return cached data if available, otherwise fallback to default templates
      if (this.cache.size > 0) {
        return this.filterTemplates(Array.from(this.cache.values()), filters);
      }

      return this.getDefaultTemplates();
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(id: string): Promise<WoundCareTemplate | null> {
    try {
      // Check cache first
      if (this.cache.has(id)) {
        return this.cache.get(id)!;
      }

      const response = await api.get<WoundCareTemplate>(
        config.getAPIEndpoint(`/api/v1/templates/wound-care/${id}`)
      );

      // Update cache
      this.cache.set(id, response.data);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch template ${id}:`, error);

      // Check if it's in default templates
      const defaultTemplates = this.getDefaultTemplates();
      return defaultTemplates.find(t => t.id === id) || null;
    }
  }

  /**
   * Apply a template to form data
   */
  applyTemplate(template: WoundCareTemplate, existingData?: any): any {
    const templateData = {
      // Wound information
      woundType: template.fields.woundType,
      woundLocation: template.fields.location,
      woundSize: template.fields.size,
      woundDepth: template.fields.depth,
      drainage: template.fields.drainage,
      painLevel: template.fields.painLevel,

      // Treatment information
      treatment: template.fields.treatment,
      treatmentFrequency: template.fields.frequency,
      supplies: template.fields.supplies,

      // Clinical notes
      clinicalNotes: template.fields.notes,

      // ICD-10 codes
      icd10Codes: template.icd10Codes,

      // Priority
      priority: template.priority,

      // Metadata
      templateId: template.id,
      templateName: template.name,
      appliedAt: new Date().toISOString()
    };

    // Merge with existing data, preserving patient information
    return {
      ...existingData,
      ...templateData,
      // Preserve patient-specific data
      patientId: existingData?.patientId,
      patientName: existingData?.patientName,
      providerId: existingData?.providerId,
      facilityId: existingData?.facilityId
    };
  }

  /**
   * Record template usage for analytics
   */
  async recordTemplateUsage(templateId: string, completionTime?: number): Promise<void> {
    try {
      await api.post(
        config.getAPIEndpoint('/api/v1/templates/usage'),
        {
          templateId,
          completionTime,
          timestamp: new Date().toISOString()
        }
      );

      // Update local cache with usage info
      const template = this.cache.get(templateId);
      if (template) {
        template.usageCount = (template.usageCount || 0) + 1;
        template.lastUsed = new Date();
        this.cache.set(templateId, template);
      }
    } catch (error) {
      console.error('Failed to record template usage:', error);
      // Non-critical error, continue silently
    }
  }

  /**
   * Get template usage statistics
   */
  async getTemplateStats(templateId?: string): Promise<TemplateUsageStats[]> {
    try {
      const endpoint = templateId
        ? `/api/v1/templates/stats/${templateId}`
        : '/api/v1/templates/stats';

      const response = await api.get<TemplateUsageStats[]>(
        config.getAPIEndpoint(endpoint)
      );

      return response.data;
    } catch (error) {
      console.error('Failed to fetch template stats:', error);
      return [];
    }
  }

  /**
   * Search templates by text
   */
  async searchTemplates(query: string): Promise<WoundCareTemplate[]> {
    const templates = await this.getTemplates();

    const searchTerm = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.fields.woundType.toLowerCase().includes(searchTerm) ||
      template.fields.location.toLowerCase().includes(searchTerm) ||
      template.fields.treatment.toLowerCase().includes(searchTerm) ||
      template.category.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get templates by category
   */
  async getTemplatesByCategory(category: string): Promise<WoundCareTemplate[]> {
    return this.getTemplates({ category });
  }

  /**
   * Get most used templates
   */
  async getMostUsedTemplates(limit: number = 5): Promise<WoundCareTemplate[]> {
    const templates = await this.getTemplates();
    return templates
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Clear template cache
   */
  clearCache(): void {
    this.cache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Private helper methods
   */
  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  private updateCache(templates: WoundCareTemplate[]): void {
    this.cache.clear();
    templates.forEach(template => {
      this.cache.set(template.id, template);
    });
    this.lastCacheUpdate = Date.now();
  }

  private filterTemplates(templates: WoundCareTemplate[], filters?: TemplateSearchFilters): WoundCareTemplate[] {
    if (!filters) return templates;

    let filtered = templates;

    // Apply category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(t => t.priority === filters.priority);
    }

    // Apply search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        t.fields.woundType.toLowerCase().includes(searchTerm) ||
        t.fields.location.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        switch (filters.sortBy) {
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'usage':
            aValue = a.usageCount || 0;
            bValue = b.usageCount || 0;
            break;
          case 'recent':
            aValue = a.lastUsed?.getTime() || 0;
            bValue = b.lastUsed?.getTime() || 0;
            break;
          case 'category':
            aValue = a.category;
            bValue = b.category;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string') {
          return filters.sortOrder === 'desc'
            ? bValue.localeCompare(aValue)
            : aValue.localeCompare(bValue);
        } else {
          return filters.sortOrder === 'desc'
            ? bValue - aValue
            : aValue - bValue;
        }
      });
    }

    return filtered;
  }

  private getDefaultTemplates(): WoundCareTemplate[] {
    return [
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
      }
    ];
  }
}

export default new TemplateService();