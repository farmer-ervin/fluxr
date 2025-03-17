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
  Upload,
  AlertCircle,
  Lightbulb,
  Search,
  ChevronDown
} from 'lucide-react';
import { SaveIndicator, SaveStatus } from '../components/SaveIndicator';
import { RichTextEditor } from '../components/RichTextEditor';
import { FeatureBuckets } from '../components/FeatureBuckets';
import { AiDialog } from '../components/AiDialog';
import { EditableField } from '../components/EditableField';
import { EditableList } from '../components/EditableList';
import { AutoTextarea } from '@/components/ui/auto-textarea';
import { ScoreBar } from '@/components/ScoreBar';
import { useAuth } from '@/components/auth/AuthProvider';
import { useProduct } from '@/components/context/ProductContext';
import { supabase } from '@/lib/supabase';
import { PrdTooltip } from '@/components/PrdTooltip';
import { SectionBlock } from '@/components/SectionBlock';
import { CustomSectionDialog } from '@/components/CustomSectionDialog';
import { UploadPrdDialog, ParsedPrdData } from '@/components/UploadPrdDialog';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { PageHeader } from '@/components/PageHeader';

// shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

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
  custom_sections?: Record<string, string>; // For storing custom section data
  [key: string]: any; // Allow for other standard fields
}

const defaultFeatureBucket = [
  { id: 'features', title: 'Features', features: [] }
];

export function PrdEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setCurrentProduct, updateProduct } = useProduct();
  const { productSlug } = useParams();
  
  const [isTopStuck, setIsTopStuck] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState('overview');
  const [activeSubsectionId, setActiveSubsectionId] = useState<string | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [prdData, setPrdData] = useState<PRDData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editingSection, setEditingSection] = useState<{id: string, title: string} | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    itemType: string;
    itemId: string | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    itemType: '',
    itemId: null,
    isDeleting: false
  });
  // State for feature buckets
  const [featureBuckets, setFeatureBuckets] = useState<any[]>(defaultFeatureBucket);

  // Error handler for feature operations
  const handleError = (error: string) => {
    setError(error);
  };

  // Feature update handler
  const handleFeatureUpdate = async (feature: any) => {
    if (!productDetails?.id) return;
    
    try {
      const { error } = await supabase
        .from('features')
        .upsert({ ...feature, product_id: productDetails.id });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating feature:', error);
      setError('Failed to update feature');
    }
  };

  const debouncedProductUpdate = useCallback(
    debounce(async (id: string, updates: Partial<ProductDetails>) => {
      try {
        setSaveStatus('saving');
        await updateProduct(id, updates);

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
    [updateProduct]
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
      icon: <AlertCircle className="w-5 h-5" />,
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
      icon: <Lightbulb className="w-5 h-5" />,
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
      content: JSON.stringify(defaultFeatureBucket),
      placeholder: JSON.stringify(defaultFeatureBucket)
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
        
        // Load the standard sections
        const updatedSections = [...sections];
        
        // Initialize custom_sections if it doesn't exist
        const customSections = prdData.custom_sections || {};
        
        // Add custom sections from the JSONB data
        Object.entries(customSections).forEach(([sectionId, content]) => {
          // Extract the section name from the ID (remove 'custom_' prefix)
          const sectionTitle = sectionId.replace('custom_', '').split('_').map(
            word => word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
          // Add this custom section to our sections array
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
        
        // Update the standard sections with their content
        const finalSections = updatedSections.map(section => {
          // For standard sections, get content from the direct column
          if (!section.isCustom) {
            const sectionContent = prdData[section.id];
            return {
              ...section,
              content: sectionContent || section.placeholder
            };
          }
          
          // Custom sections were already populated above
          return section;
        });

        setSections(finalSections);
        
        // If there's a features section, parse it to initialize featureBuckets
        const featuresSection = finalSections.find(section => section.id === 'features');
        if (featuresSection && featuresSection.content) {
          try {
            const parsedFeatures = JSON.parse(featuresSection.content);
            setFeatureBuckets(parsedFeatures || defaultFeatureBucket);
          } catch (err) {
            console.error('Error parsing features data:', err);
            // Use default if parsing fails
            setFeatureBuckets(defaultFeatureBucket);
          }
        }

      } catch (error) {
        console.error('Error loading product data:', error);
        setError('Failed to load product data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadProductData();
  }, [productSlug, user?.id]);

  // Set up real-time subscription for features updates
  useEffect(() => {
    if (!productDetails?.id) return;
    
    let isSubscribed = true;
    
    // Subscribe to changes in the features table for this product
    const featuresSubscription = supabase.channel('features-changes')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'features', 
            filter: `product_id=eq.${productDetails.id}` 
          }, 
          (payload) => {
            if (!isSubscribed) return;
            console.log('Features changed:', payload);
            
            // Update the features section
            // Fetch the latest features data
            supabase
              .from('features')
              .select('*')
              .eq('product_id', productDetails.id)
              .order('position', { ascending: true })
              .then(({ data, error }) => {
                if (!isSubscribed) return;
                if (error) {
                  console.error('Error fetching updated features:', error);
                  return;
                }
                
                // Update the features section with new data
                setSections(prev => prev.map(section => {
                  if (section.id === 'features') {
                    const updatedBucket = [
                      {
                        id: 'features',
                        title: 'Features',
                        features: data || []
                      }
                    ];
                    return {
                      ...section,
                      content: JSON.stringify(updatedBucket)
                    };
                  }
                  return section;
                }));
              });
          }
      )
      .subscribe();
      
    // Clean up the subscription when component unmounts
    return () => {
      isSubscribed = false;
      supabase.removeChannel(featuresSubscription);
    };
  }, [productDetails?.id]);

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

    if (sectionId === 'description') {
      // Update product description
      if (productDetails) {
        setProductDetails(prev => prev ? { ...prev, description: content } : null);
        debouncedProductUpdate(productDetails.id, { description: content });
      }
    } else if (sectionId !== 'features') {
      // Update PRD section content
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
    
    // Create a safe ID from the section name
    const sectionId = `custom_${sectionName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check if this section already exists
    if (sections.some(section => section.id === sectionId)) {
      // You might want to show an error or append a number
      return;
    }
    
    // Create the new section
    const newSection: Section = {
      id: sectionId,
      title: sectionName,
      icon: <FileText className="w-5 h-5" />,
      content: '',
      placeholder: `<h2>${sectionName}</h2>
<p>Add content for this custom section here...</p>`,
      isCustom: true
    };
    
    // Add the section to the sections array
    setSections(prev => [...prev, newSection]);
    
    // Update the custom_sections JSONB field in the database
    const customSections = { ...(prdData.custom_sections || {}) };
    customSections[sectionId] = '';
    
    const updates = {
      custom_sections: customSections
    };
    
    setPrdData(prev => prev ? { ...prev, ...updates } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    // Scroll to the new section
    setTimeout(() => {
      scrollToSection(sectionId);
    }, 100);
  };

  // Function to handle section renaming
  const handleStartRenameSection = (sectionId: string, title: string) => {
    setEditingSection({ id: sectionId, title });
    setIsAddSectionOpen(true);
  };

  // Function to perform the actual renaming
  const handleRenameSection = (sectionId: string, newName: string) => {
    if (!prdData) return;
    
    // Get the original section from our sections array
    const sectionToRename = sections.find(s => s.id === sectionId);
    if (!sectionToRename || !sectionToRename.isCustom) return;
    
    // Create a new section ID based on the new name
    const newSectionId = `custom_${newName.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check if this new section ID already exists (avoiding conflicts)
    if (newSectionId !== sectionId && sections.some(s => s.id === newSectionId)) {
      // Could show an error here about duplicate names
      return;
    }

    // Get the current custom sections data
    const customSections = { ...(prdData.custom_sections || {}) };
    
    // Create a new entry with the new ID and copy the content
    const content = customSections[sectionId] || '';
    
    // Update the custom sections object
    delete customSections[sectionId]; // Remove the old entry
    customSections[newSectionId] = content; // Add new entry with the same content
    
    // Create the updates for the database
    const updates = {
      custom_sections: customSections
    };
    
    // Update the PRD data in the database
    setPrdData(prev => prev ? { ...prev, custom_sections: customSections } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    // Update the section in our local state
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
    
    // Update the active section ID if it was the one being renamed
    if (activeSectionId === sectionId) {
      setActiveSectionId(newSectionId);
    }
    
    // Reset editing state
    setEditingSection(null);
  };

  // Function to handle section deletion
  const handleDeleteSection = async (sectionId: string) => {
    setDeleteDialogState({
      isOpen: true,
      itemType: 'Section',
      itemId: sectionId,
      isDeleting: false
    });
  };

  const handleConfirmDeleteSection = async () => {
    if (!prdData || !deleteDialogState.itemId) return;
    
    try {
      setDeleteDialogState(prev => ({ ...prev, isDeleting: true }));
      
      // Get the section to delete
      const sectionToDelete = sections.find(s => s.id === deleteDialogState.itemId);
      if (!sectionToDelete || !sectionToDelete.isCustom) return;
      
      // Get the current custom sections data
      const customSections = { ...(prdData.custom_sections || {}) };
      
      // Remove the section from the custom sections object
      delete customSections[deleteDialogState.itemId];
      
      // Create the updates for the database
      const updates = {
        custom_sections: customSections
      };
      
      // Update the PRD data in the database
      setPrdData(prev => prev ? { ...prev, custom_sections: customSections } : null);
      debouncedPrdUpdate(prdData.id, updates);
      
      // Remove the section from our local state
      setSections(prev => prev.filter(s => s.id !== deleteDialogState.itemId));
      
      // If the active section was deleted, set active section to overview
      if (activeSectionId === deleteDialogState.itemId) {
        setActiveSectionId('overview');
      }

      setDeleteDialogState({
        isOpen: false,
        itemType: '',
        itemId: null,
        isDeleting: false
      });
    } catch (error) {
      console.error('Error deleting section:', error);
      setError('Failed to delete section');
    }
  };

  // Handle parsed PRD data from the upload dialog
  const handlePrdParsed = (parsedData: ParsedPrdData) => {
    if (!prdData || !productDetails) return;
    
    // Create updates object for the database
    const updates: Partial<PRDData> = {};
    
    // Update standard sections
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
    
    // Handle custom sections if they exist
    if (parsedData.custom_sections && Object.keys(parsedData.custom_sections).length > 0) {
      // Get existing custom sections
      const existingCustomSections = prdData.custom_sections || {};
      
      // Merge with new custom sections
      const mergedCustomSections = {
        ...existingCustomSections,
        ...parsedData.custom_sections
      };
      
      updates.custom_sections = mergedCustomSections;
      
      // Add new custom sections to the UI
      const newSections: Section[] = [];
      
      Object.entries(parsedData.custom_sections).forEach(([sectionId, content]) => {
        // Skip if this section already exists
        if (sections.some(section => section.id === sectionId)) {
          return;
        }
        
        // Extract the section name from the ID (remove 'custom_' prefix)
        const sectionTitle = sectionId.replace('custom_', '').split('_').map(
          word => word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        // Create the new section
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
      
      // Add new sections to the UI
      if (newSections.length > 0) {
        setSections(prev => [...prev, ...newSections]);
      }
    }
    
    // Update the PRD data in the database
    setPrdData(prev => prev ? { ...prev, ...updates } : null);
    debouncedPrdUpdate(prdData.id, updates);
    
    // Update sections in state
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
        // Update custom section content if it exists in parsedData
        if (section.isCustom && parsedData.custom_sections && parsedData.custom_sections[section.id]) {
          return { ...section, content: parsedData.custom_sections[section.id] };
        }
        return section;
      })
    );
    
    // Handle features if they exist
    if (parsedData.features && Array.isArray(parsedData.features) && parsedData.features.length > 0) {
      // Process features
      const processedFeatures = parsedData.features.map(feature => ({
        product_id: productDetails.id,
        name: feature.name,
        description: feature.description,
        priority: feature.priority || 'not-prioritized',
        implementation_status: feature.implementation_status || 'not_started',
        position: 0 // This will be updated by the database trigger
      }));
      
      // Insert features into the database
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

  // Update handleDeleteFeature to show confirmation
  const handleDeleteFeature = async (featureId: string) => {
    setDeleteDialogState({
      isOpen: true,
      itemType: 'Feature',
      itemId: featureId,
      isDeleting: false
    });
  };

  const handleConfirmDeleteFeature = async () => {
    if (!deleteDialogState.itemId) return;
    
    try {
      setDeleteDialogState(prev => ({ ...prev, isDeleting: true }));

      // First get the feature to check if it has a screenshot
      const { data: feature, error: fetchError } = await supabase
        .from('features')
        .select('screenshot_url')
        .eq('id', deleteDialogState.itemId)
        .single();
      
      if (fetchError) throw fetchError;

      // If there's a screenshot, delete it from storage
      if (feature?.screenshot_url) {
        const path = feature.screenshot_url.split('/').pop(); // Get filename from URL
        if (path) {
          const { error: storageError } = await supabase.storage
            .from('feature-screenshots')
            .remove([path]);
          
          if (storageError) {
            console.error('Error deleting screenshot:', storageError);
          }
        }
      }

      // Now delete the feature
      const { error } = await supabase
        .from('features')
        .delete()
        .match({ id: deleteDialogState.itemId });
      
      if (error) throw error;
      
      // Update the features section with the feature removed
      setSections(prev => prev.map(section => {
        if (section.id === 'features') {
          const currentFeatures = JSON.parse(section.content);
          const updatedFeatures = currentFeatures.map((bucket: any) => ({
            ...bucket,
            features: bucket.features.filter((f: any) => f.id !== deleteDialogState.itemId)
          }));
          return {
            ...section,
            content: JSON.stringify(updatedFeatures)
          };
        }
        return section;
      }));

      setDeleteDialogState({
        isOpen: false,
        itemType: '',
        itemId: null,
        isDeleting: false
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      setError('Failed to delete feature');
    }
  };

  // Add intersection observer for top section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsTopStuck(!entry.isIntersecting);
      },
      { threshold: 1 }
    );

    const element = document.getElementById('prd-header');
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  // Handler for AI-generated content
  const handleAiGenerated = (data: any) => {
    if (!prdData) return;
    
    // Create updates object for the database
    const updates: Partial<PRDData> = {};
    
    // Update standard sections if present in the data
    if (data.problem) {
      updates.problem = data.problem;
    }
    
    if (data.solution) {
      updates.solution = data.solution;
    }
    
    if (data.target_audience) {
      updates.target_audience = data.target_audience;
    }
    
    if (data.tech_stack) {
      updates.tech_stack = data.tech_stack;
    }
    
    if (data.success_metrics) {
      updates.success_metrics = data.success_metrics;
    }
    
    // Update the PRD data in the database
    if (Object.keys(updates).length > 0) {
      setPrdData(prev => prev ? { ...prev, ...updates } : null);
      debouncedPrdUpdate(prdData.id, updates);
    
      // Update sections in state
      setSections(prev => 
        prev.map(section => {
          if (section.id === 'problem' && data.problem) {
            return { ...section, content: data.problem };
          }
          if (section.id === 'solution' && data.solution) {
            return { ...section, content: data.solution };
          }
          if (section.id === 'target_audience' && data.target_audience) {
            return { ...section, content: data.target_audience };
          }
          if (section.id === 'tech_stack' && data.tech_stack) {
            return { ...section, content: data.tech_stack };
          }
          if (section.id === 'success_metrics' && data.success_metrics) {
            return { ...section, content: data.success_metrics };
          }
          return section;
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              className="mx-auto"
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="PRD Editor"
        description="Define your product's vision, features, and success metrics"
      >
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-2">
            <SaveIndicator status={saveStatus} error={saveError} />
            {productDetails?.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Import PRD
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PRD
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <AiDialog
              productData={{
                name: productDetails?.name || '',
                description: productDetails?.description || '',
                problem: prdData?.problem || '',
                solution: prdData?.solution || '',
                target_audience: prdData?.target_audience || '',
              }}
              sections={sections.slice(1)}
              onAiGenerated={handleAiGenerated}
            />
            <PrdTooltip />
          </div>
        </div>
      </PageHeader>

      <div className="grid grid-cols-[250px,1fr] gap-6 flex-1 overflow-hidden">
        <Card className="p-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Document Sections</h2>
              <nav className="space-y-1">
                {sections.map(section => (
                  <div key={section.id}>
                    <Button
                      onClick={() => scrollToSection(section.id)}
                      variant={section.id === activeSectionId ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 h-11 px-4 ${
                        section.id === activeSectionId
                          ? 'bg-primary hover:bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-primary/5 hover:text-foreground'
                      }`}
                    >
                      <span className="flex items-center">
                        {section.icon}
                      </span>
                      <span className="flex-grow text-left">{section.title}</span>
                      {section.isCustom && (
                        <div className="flex gap-0.5 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRenameSection(section.id, section.title);
                            }}
                            className={`h-7 w-7 ${
                              section.id === activeSectionId
                                ? 'text-primary-foreground hover:bg-primary-foreground/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                            }`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSection(section.id);
                            }}
                            className={`h-7 w-7 ${
                              section.id === activeSectionId
                                ? 'text-primary-foreground hover:bg-primary-foreground/20'
                                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </Button>
                    
                    {section.subsections && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.subsections.map(subsection => (
                          <Button
                            key={subsection.id}
                            onClick={() => scrollToSection(section.id, subsection.id)}
                            variant={section.id === activeSectionId && subsection.id === activeSubsectionId ? "default" : "ghost"}
                            size="sm"
                            className={`w-full justify-start h-9 px-4 ${
                              section.id === activeSectionId && subsection.id === activeSubsectionId
                                ? 'bg-primary/90 hover:bg-primary/90 text-primary-foreground'
                                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                            }`}
                          >
                            {subsection.title}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <Separator className="my-4" />
                
                <Button
                  onClick={() => {
                    setEditingSection(null);
                    setIsAddSectionOpen(true);
                  }}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-11 px-4 text-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Section</span>
                </Button>
              </nav>
            </div>
          </ScrollArea>
        </Card>

        <Card className="p-0 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="p-6">
              {sections.map((section) => (
                <div key={section.id} className="mb-6">
                  <SectionBlock
                    section={section}
                    onContentChange={handleSectionContentChange}
                    productDetails={productDetails}
                    onRenameSection={handleStartRenameSection}
                    onProductNameChange={(name) => handleProductDetailsChange({ target: { name: 'name', value: name } } as React.ChangeEvent<HTMLInputElement>)}
                    onDeleteSection={handleDeleteSection}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      </div>
      
      {/* Dialogs */}
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
      
      <ConfirmDeleteDialog
        isOpen={deleteDialogState.isOpen}
        onClose={() => setDeleteDialogState({
          isOpen: false,
          itemType: '',
          itemId: null,
          isDeleting: false
        })}
        onConfirm={deleteDialogState.itemType === 'Section' 
          ? handleConfirmDeleteSection 
          : handleConfirmDeleteFeature}
        itemType={deleteDialogState.itemType}
        isDeleting={deleteDialogState.isDeleting}
      />

      {showUploadDialog && productDetails?.id && (
        <UploadPrdDialog 
          productId={productDetails.id} 
          onPrdParsed={handlePrdParsed}
          onClose={() => setShowUploadDialog(false)}
        />
      )}
    </div>
  );
}