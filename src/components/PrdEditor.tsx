import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Target, 
  Users,
  Puzzle,
  Server,
  BarChart3,
  Loader2,
  Star,
  Briefcase,
  XCircle,
  Plus,
  Pencil,
  Settings,
  Upload
} from 'lucide-react';
import { SaveIndicator, SaveStatus } from '../components/SaveIndicator';
import { RichTextEditor } from '../components/RichTextEditor';
import { FeatureBuckets } from '../components/FeatureBuckets';
import { AiDialog } from '../components/AiDialog';
import { EditableField } from '../components/EditableField';
import { EditableList } from '../components/EditableList';
import { AutoTextarea } from '@/components/ui/auto-textarea';
import { ScoreBar } from '@/components/ScoreBar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { useProduct } from '@/components/context/ProductContext';
import { supabase } from '@/lib/supabase';
import { SectionBlock } from '@/components/SectionBlock';
import { CustomSectionDialog } from '@/components/CustomSectionDialog';
import { UploadPrdDialog, ParsedPrdData } from '@/components/UploadPrdDialog';
import { trackUploadPRD, trackSuccessfulPRDUpload, trackStartPRDGeneration, trackSuccessfulPRDGeneration } from '@/lib/analytics';

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  placeholder: string;
  subsections?: {
    id: string;
    title: string;
    content: string;
    placeholder: string;
  }[];
  isCustom?: boolean;
}

interface ProductDetails {
  id: string;
  name: string;
  description: string;
  slug: string;
}

interface PRDData {
  id: string;
  problem: string;
  solution: string;
  target_audience: string;
  tech_stack: string;
  success_metrics: string;
  custom_sections?: Record<string, string>;
  [key: string]: any;
}

const defaultFeatureBucket = [
  { id: 'features', title: 'Features', features: [] }
];

export function PrdEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setCurrentProduct } = useProduct();
  const { productSlug } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState('overview');
  const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [prdData, setPrdData] = useState<PRDData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<{id: string, title: string} | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);

  const debouncedProductUpdate = useCallback(
    debounce(async (id: string, updates: Partial<ProductDetails>) => {
      try {
        setSaveStatus('saving');
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('id', id);

        if (error) {
          throw error;
        }

        if (updates.name) {
          const { data: updatedProduct } = await supabase
            .from('products')
            .select('slug')
            .eq('id', id)
            .single();

          if (updatedProduct) {
            navigate(`/product/${updatedProduct.slug}/prd`, { replace: true });
          }
        }
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error updating product details:', error);
        setSaveStatus('error');
        setSaveError('Failed to save product details');
      }
    }, 1000),
    []
  );

  const debouncedPrdUpdate = useCallback(
    debounce(async (id: string, updates: Partial<PRDData>) => {
      try {
        setSaveStatus('saving');
        const { error } = await supabase
          .from('prds')
          .update(updates)
          .eq('id', id);

        if (error) {
          throw error;
        }
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error updating PRD content:', error);
        setSaveStatus('error');
        setSaveError('Failed to save PRD content');
      }
    }, 1000),
    []
  );

  const debouncedProfileUpdate = useCallback(
    debounce(async (profileId: string, updates: any) => {
      try {
        const { error } = await supabase
          .from('customer_profiles')
          .update(updates)
          .eq('id', profileId);

        if (error) throw error;
      } catch (error) {
        console.error('Error saving profile changes:', error);
      }
    }, 1000),
    []
  );

  useEffect(() => {
    return () => {
      debouncedProfileUpdate.cancel();
    };
  }, [debouncedProfileUpdate]);

  const [sections, setSections] = useState<Section[]>([
    {
      id: 'overview',
      title: 'Overview',
      icon: <FileText className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>Product Overview</h2>
<p>This section provides a high-level overview of the product, including:</p>
<ul>
  <li>Vision statement</li>
  <li>Key objectives</li>
  <li>Market opportunity</li>
  <li>Strategic alignment</li>
</ul>`
    },
    {
      id: 'problem',
      title: 'Problem',
      icon: <Puzzle className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>Problem Statement</h2>
<p>Clearly define the problem your product solves:</p>
<ul>
  <li>What are the current pain points?</li>
  <li>What are the existing solutions?</li>
  <li>Why is a new solution needed?</li>
</ul>`
    },
    {
      id: 'solution',
      title: 'Solution',
      icon: <Puzzle className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>Solution</h2>
<p>Describe how your product solves these problems:</p>
<ul>
  <li>Key differentiators</li>
  <li>Unique value proposition</li>
  <li>Competitive advantages</li>
</ul>`
    },
    {
      id: 'target_audience',
      title: 'Target Audience',
      icon: <Users className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>Target Audience</h2>
<p>Define your target users and stakeholders:</p>
<ul>
  <li>Primary user personas</li>
  <li>Secondary user personas</li>
  <li>Market segments</li>
  <li>User demographics</li>
  <li>User behaviors and needs</li>
</ul>`
    },
    {
      id: 'features',
      title: 'Features',
      icon: <Target className="w-5 h-5" />,
      content: '',
      placeholder: 'Features will be managed in the Features section'
    },
    {
      id: 'tech_stack',
      title: 'Technology Stack',
      icon: <Server className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>Technology Stack</h2>
<h3>Frontend Technologies</h3>
<ul>
  <li>Framework: React with TypeScript</li>
  <li>State Management: React Context</li>
  <li>Styling: Tailwind CSS</li>
</ul>

<h3>Backend Technologies</h3>
<ul>
  <li>Database: Supabase (PostgreSQL)</li>
  <li>Authentication: Supabase Auth</li>
  <li>API: Supabase REST API</li>
</ul>

<h3>Development Tools</h3>
<ul>
  <li>Version Control: Git</li>
  <li>Package Manager: npm</li>
  <li>Build Tool: Vite</li>
</ul>

<h3>Third-party Services</h3>
<ul>
  <li>OpenAI API for AI features</li>
  <li>Analytics: TBD</li>
</ul>

<h3>Deployment</h3>
<ul>
  <li>Hosting: Netlify</li>
  <li>CI/CD: GitHub Actions</li>
</ul>`
    },
    {
      id: 'success_metrics',
      title: 'Success Metrics & KPIs',
      icon: <BarChart3 className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>Success Metrics & KPIs</h2>

<h3>User Engagement Metrics</h3>
<ul>
  <li>Daily/Monthly Active Users (DAU/MAU)</li>
  <li>Session Duration</li>
  <li>Feature Adoption Rate</li>
  <li>User Retention Rate</li>
</ul>

<h3>Business Metrics</h3>
<ul>
  <li>Customer Acquisition Cost (CAC)</li>
  <li>Customer Lifetime Value (CLV)</li>
  <li>Monthly Recurring Revenue (MRR)</li>
  <li>Churn Rate</li>
</ul>

<h3>Technical Performance Metrics</h3>
<ul>
  <li>Page Load Time</li>
  <li>API Response Time</li>
  <li>Error Rate</li>
  <li>System Uptime</li>
</ul>

<h3>Success Criteria</h3>
<ul>
  <li>Achieve X% user growth within Y months</li>
  <li>Maintain Z% user retention rate</li>
  <li>Reach break-even point by Q4 2025</li>
</ul>`
    }
  ]);

  useEffect(() => {
    async function loadProductData() {
      if (!productSlug) {
        setError('Invalid product URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*, users!inner(*)')
          .eq('slug', productSlug)
          .eq('users.id', user?.id)
          .single();

        if (productError || !productData) {
          setError('Product not found or you do not have access to it');
          setLoading(false);
          return;
        }
        
        setProductDetails(productData);
        setCurrentProduct(productData);

        const { data: prdData, error: prdError } = await supabase
          .from('prds')
          .select('*')
          .eq('product_id', productData.id)
          .single();

        if (prdError || !prdData) {
          setError('PRD data not found');
          setLoading(false);
          return;
        }

        setPrdData(prdData);
        
        const { data: profileData, error: profileError } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('product_id', productData.id)
          .eq('is_selected', true)
          .maybeSingle();

        if (profileData) {
          setSelectedProfile(profileData);
        }
        
        const updatedSections = [...sections];
        
        const customSections = prdData.custom_sections || {};
        
        Object.entries(customSections).forEach(([sectionId, content]) => {
          const sectionTitle = sectionId.replace('custom_', '').split('_').map(
            word => word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          updatedSections.push({
            id: sectionId,
            title: sectionTitle,
            icon: <FileText className="w-5 h-5" />,
            content: content as string || '',
            placeholder: `<h2>${sectionTitle}</h2>
<p>Add content for this custom section here...</p>`,
            isCustom: true
          });
        });
        
        const finalSections = updatedSections.map(section => {
          if (!section.isCustom) {
            const sectionContent = prdData[section.id];
            return {
              ...section,
              content: sectionContent || section.placeholder
            };
          }
          return section;
        });

        setSections(finalSections);

      } catch (error) {
        console.error('Error loading product data:', error);
        setError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadProductData();
  }, [productSlug, user?.id]);

  const handleSectionContentChange = (sectionId: string, subsectionId: string | null, content: string) => {
    if (!prdData) return;

    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        if (subsectionId) {
          return {
            ...section,
            subsections: section.subsections?.map(subsection => 
              subsection.id === subsectionId
                ? { ...subsection, content }
                : subsection
            )
          };
        } else {
          if (sectionId === 'features') {
            return section;
          }
          return { ...section, content };
        }
      }
      return section;
    });

    setSections(updatedSections);

    if (sectionId !== 'features') {
      const updates: Partial<PRDData> = {
        [sectionId]: content
      };
      debouncedPrdUpdate(prdData.id, updates);
    }
  };

  const handleProductDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!productDetails) return;

    const { name, value } = e.target;
    
    setProductDetails(prev => prev ? { ...prev, [name]: value } : null);

    debouncedProductUpdate(productDetails.id, { [name]: value });
  };

  useEffect(() => {
    return () => {
      debouncedProductUpdate.cancel();
      debouncedPrdUpdate.cancel();
    };
  }, [debouncedProductUpdate, debouncedPrdUpdate]);

  const scrollToSection = (sectionId: string, subsectionId?: string) => {
    const elementId = subsectionId 
      ? `section-${sectionId}-${subsectionId}` 
      : `section-${sectionId}`;
    
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    
    setActiveSectionId(sectionId);
    if (subsectionId) {
      setActiveSubsectionId(subsectionId);
    } else {
      setActiveSubsectionId(null);
    }
  };

  const handleAddSection = (sectionName: string) => {
    if (!prdData) return;
    
    const sectionId = `custom_${sectionName.toLowerCase().replace(/\s+/g, '_')}`;
    
    if (sections.some(section => section.id === sectionId)) {
      return;
    }
    
    const newSection: Section = {
      id: sectionId,
      title: sectionName,
      icon: <FileText className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>${sectionName}</h2>
<p>Add content for this custom section here...</p>`,
      isCustom: true
    };
    
    setSections(prev => [...prev, newSection]);
    
    const customSections = { ...(prdData.custom_sections || {}) };
    customSections[sectionId] = '';
    
    const updates = {
      custom_sections: customSections
    };
    
    setPrdData(prev => prev ? { ...prev, ...updates } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  };

  const handleStartRenameSection = (sectionId: string, title: string) => {
    setEditingSection({ id: sectionId, title });
    setIsAddSectionOpen(true);
  };

  const handleRenameSection = (sectionId: string, newName: string) => {
    if (!prdData) return;
    
    const sectionToRename = sections.find(s => s.id === sectionId);
    if (!sectionToRename || !sectionToRename.isCustom) return;
    
    const newSectionId = `custom_${newName.toLowerCase().replace(/\s+/g, '_')}`;
    
    if (newSectionId !== sectionId && sections.some(s => s.id === newSectionId)) {
      return;
    }

    const customSections = { ...(prdData.custom_sections || {}) };
    
    const content = customSections[sectionId] || '';
    
    delete customSections[sectionId];
    customSections[newSectionId] = content;
    
    const updates = {
      custom_sections: customSections
    };
    
    setPrdData(prev => prev ? { ...prev, custom_sections: customSections } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    setSections(prev => prev.map(s => {
      if (s.id === sectionId) {
        return {
          ...s,
          id: newSectionId,
          title: newName
        };
      }
      return s;
    }));
    
    if (activeSectionId === sectionId) {
      setActiveSectionId(newSectionId);
    }
    
    setEditingSection(null);
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!prdData) return;
    
    const sectionToDelete = sections.find(s => s.id === sectionId);
    if (!sectionToDelete || !sectionToDelete.isCustom) return;
    
    const customSections = { ...(prdData.custom_sections || {}) };
    
    delete customSections[sectionId];
    
    const updates = {
      custom_sections: customSections
    };
    
    setPrdData(prev => prev ? { ...prev, custom_sections: customSections } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    setSections(prev => prev.filter(s => s.id !== sectionId));
    
    if (activeSectionId === sectionId) {
      setActiveSectionId('overview');
    }
  };

  const handlePrdParsed = (parsedData: ParsedPrdData) => {
    if (!prdData || !productDetails) return;
    
    // Track successful PRD upload
    trackSuccessfulPRDUpload(JSON.stringify(parsedData).length);
    
    const updates: Partial<PRDData> = {};
    
    if (parsedData.problem) {
      updates.problem = parsedData.problem;
    }
    
    if (parsedData.solution) {
      updates.solution = parsedData.solution;
    }
    
    if (parsedData.target_audience) {
      updates.target_audience = parsedData.target_audience;
    }
    
    if (parsedData.tech_stack) {
      updates.tech_stack = parsedData.tech_stack;
    }
    
    if (parsedData.success_metrics) {
      updates.success_metrics = parsedData.success_metrics;
    }
    
    if (parsedData.custom_sections && Object.keys(parsedData.custom_sections).length > 0) {
      const existingCustomSections = prdData.custom_sections || {};
      
      const mergedCustomSections = {
        ...existingCustomSections,
        ...parsedData.custom_sections
      };
      
      updates.custom_sections = mergedCustomSections;
      
      const newSections: Section[] = [];
      
      Object.entries(parsedData.custom_sections).forEach(([sectionId, content]) => {
        if (sections.some(section => section.id === sectionId)) {
          return;
        }
        
        const sectionTitle = sectionId.replace('custom_', '').split('_').map(
          word => word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        newSections.push({
          id: sectionId,
          title: sectionTitle,
          icon: <FileText className="w-5 h-5" />,
          content: content as string || '',
          placeholder: `<h2>${sectionTitle}</h2>
<p>Add content for this custom section here...</p>`,
          isCustom: true
        });
      });
      
      if (newSections.length > 0) {
        setSections(prev => [...prev, ...newSections]);
      }
    }
    
    setPrdData(prev => prev ? { ...prev, ...updates } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    setSections(prev => 
      prev.map(section => {
        if (section.id === 'problem' && parsedData.problem) {
          return { ...section, content: parsedData.problem };
        }
        if (section.id === 'solution' && parsedData.solution) {
          return { ...section, content: parsedData.solution };
        }
        if (section.id === 'target_audience' && parsedData.target_audience) {
          return { ...section, content: parsedData.target_audience };
        }
        if (section.id === 'tech_stack' && parsedData.tech_stack) {
          return { ...section, content: parsedData.tech_stack };
        }
        if (section.id === 'success_metrics' && parsedData.success_metrics) {
          return { ...section, content: parsedData.success_metrics };
        }
        if (section.isCustom && parsedData.custom_sections && parsedData.custom_sections[section.id]) {
          return { ...section, content: parsedData.custom_sections[section.id] };
        }
        return section;
      })
    );
    
    if (parsedData.features && Array.isArray(parsedData.features) && parsedData.features.length > 0) {
      const processedFeatures = parsedData.features.map(feature => ({
        product_id: productDetails.id,
        name: feature.name,
        description: feature.description,
        priority: feature.priority || 'not-prioritized',
        implementation_status: feature.implementation_status || 'not_started',
        position: 0
      }));
      
      supabase
        .from('features')
        .insert(processedFeatures)
        .then(({ error }) => {
          if (error) {
            console.error('Error inserting features:', error);
          }
        });
    }
  };

  // Add tracking for PRD generation start
  const handleStartGeneration = () => {
    trackStartPRDGeneration();
    // ... rest of your existing generation logic ...
  };

  // Add tracking for successful PRD generation
  useEffect(() => {
    if (location.state?.mvpData) {
      trackSuccessfulPRDGeneration();
    }
  }, [location.state]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-purple mx-auto mb-4" />
          <p className="text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-red-600 mb-6">{error}</p>
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          className="mx-auto"
        >
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-4">
          {productDetails?.id && (
            <UploadPrdDialog 
              productId={productDetails.id} 
              onPrdParsed={handlePrdParsed} 
            />
          )}
          <div className="flex items-center gap-2">
            <AiDialog />
            <SaveIndicator status={saveStatus} error={saveError} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[250px,1fr] gap-6 h-full">
        <div className="bg-white rounded-lg shadow-lg p-6 h-full overflow-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Sections</h2>
          <nav className="space-y-2">
            {sections.map(section => (
              <div key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center px-4 py-2 rounded-lg text-left transition-colors ${
                    section.id === activeSectionId
                      ? 'bg-brand-purple text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {section.icon}
                  <span className="ml-3">{section.title}</span>
                </button>
                
                {section.subsections && (
                  <div className="ml-6 mt-1 space-y-1">
                    {section.subsections.map(subsection => (
                      <button
                        key={subsection.id}
                        onClick={() => scrollToSection(section.id, subsection.id)}
                        className={`w-full flex items-center px-4 py-1.5 rounded-lg text-left transition-colors text-sm ${
                          section.id === activeSectionId && subsection.id === activeSubsectionId
                            ? 'bg-brand-purple/80 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {subsection.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            <div className="pt-2 mt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setEditingSection(null);
                  setIsAddSectionOpen(true);
                }}
                className="w-full flex items-center px-4 py-2 rounded-lg text-left transition-colors text-brand-purple hover:bg-gray-100"
              >
                <Plus className="w-5 h-5" />
                <span className="ml-3">Add Section</span>
              </button>
            </div>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-lg h-full overflow-auto">
          <div className="section-transition">
            {sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                onContentChange={handleSectionContentChange}
                productDetails={productDetails}
                onRenameSection={handleStartRenameSection}
                onDeleteSection={handleDeleteSection}
              />
            ))}
          </div>
        </div>
      </div>
      
      <CustomSectionDialog
        isOpen={isAddSectionOpen}
        onClose={() => {
          setIsAddSectionOpen(false);
          setEditingSection(null);
        }}
        onAddSection={handleAddSection}
        onRenameSection={handleRenameSection}
        onDeleteSection={handleDeleteSection}
        editingSection={editingSection}
      />
    </div>
  );
}