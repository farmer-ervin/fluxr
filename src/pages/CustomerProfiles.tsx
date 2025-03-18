import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Target, XCircle, Star, Loader2, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateMvpPrd, OpenAIError } from '@/lib/openai';
import { supabase } from '@/lib/supabase';
import { trackStartCustomerProfileGeneration, trackSuccessfulCustomerProfileGeneration } from '@/lib/analytics';

interface CustomerProfile {
  name: string;
  overview: {
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
  };
  background: {
    role: string;
    industry: string;
    companySize: string;
    companyType: string;
    dailyResponsibilities: string[];
    currentTools: string[];
  };
  problems: {
    biggestFrustration: string;
    manualTasks: string[];
    painPoints: string;
    inefficiencies: string[];
  };
  scoring: {
    problemMatch: number;
    urgencyToSolve: number;
    abilityToPay: number;
    explanation: string;
  };
}

interface CustomerProfilesResponse {
  customerProfiles: CustomerProfile[];
  recommendation: {
    selectedProfile: string;
    rationale: string;
  };
}

function ScoreBar({ score, label, total = 5 }: { score: number; label: string; total?: number }) {
  const dots = Array(total).fill(0);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-32">{label}:</span>
      <div className="flex gap-1">
        {dots.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < score ? 'bg-brand-purple' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-sm text-gray-600 ml-2">{score}/{total}</span>
    </div>
  );
}

function ProfileCard({ 
  profile, 
  isSelected,
  isRecommended = false,
  onSelect 
}: { 
  profile: CustomerProfile; 
  isSelected: boolean;
  isRecommended?: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 space-y-6 relative ${
      isSelected ? 'ring-2 ring-brand-purple' : ''
    }`}>
      {isRecommended && (
        <div className="bg-brand-purple/5 -mx-6 -mt-6 px-6 py-4 rounded-t-lg border-b border-brand-purple/20">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-brand-purple" />
            <h3 className="text-lg font-semibold text-brand-purple">Recommended Persona</h3>
          </div>
          <p className="text-gray-700">{profile.scoring.explanation}</p>
        </div>
      )}
      
      <div className="absolute top-4 right-4">
        <Button
          variant={isSelected ? "secondary" : "outline"}
          onClick={onSelect}
        >
          {isSelected ? 'Selected' : 'Select Profile'}
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
        
        <div className="space-y-3">
          <p className="text-gray-600">{profile.overview.paragraph1}</p>
          <p className="text-gray-600">{profile.overview.paragraph2}</p>
          <p className="text-gray-600">{profile.overview.paragraph3}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          Profile Score
        </h4>
        <ScoreBar score={profile.scoring.problemMatch} label="Problem Match" />
        <ScoreBar score={profile.scoring.urgencyToSolve} label="Urgency to Solve" />
        <ScoreBar score={profile.scoring.abilityToPay} label="Ability to Pay" />
      </div>

      <div>
        <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
          <Briefcase className="w-5 h-5 mr-2 text-brand-purple" />
          Background
        </h4>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Role:</span>
            <p className="text-gray-700">{profile.background.role}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Industry:</span>
            <p className="text-gray-700">{profile.background.industry}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Company:</span>
            <p className="text-gray-700">{profile.background.companySize} • {profile.background.companyType}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Daily Responsibilities:</span>
            <ul className="list-disc list-inside text-gray-700 ml-2">
              {profile.background.dailyResponsibilities.map((resp, index) => (
                <li key={index}>{resp}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Current Tools:</span>
            <ul className="list-disc list-inside text-gray-700 ml-2">
              {profile.background.currentTools.map((tool, index) => (
                <li key={index}>{tool}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <h4 className="flex items-center text-lg font-semibold text-gray-900 mb-3">
          <XCircle className="w-5 h-5 mr-2 text-red-500" />
          Problems
        </h4>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-500">Biggest Frustration:</span>
            <p className="text-gray-700">{profile.problems.biggestFrustration}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Manual Tasks:</span>
            <ul className="list-disc list-inside text-gray-700 ml-2">
              {profile.problems.manualTasks.map((task, index) => (
                <li key={index}>{task}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Pain Points:</span>
            <p className="text-gray-700">{profile.problems.painPoints}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Inefficiencies:</span>
            <ul className="list-disc list-inside text-gray-700 ml-2">
              {profile.problems.inefficiencies.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add this helper function before the CustomerProfiles component
function transformProfileToHtml(profile: CustomerProfile): string {
  return `
<h3><strong>${profile.name}<h3><strong>

<div class="overview">
  <p>${profile.overview.paragraph1}</p>
  <p>${profile.overview.paragraph2}</p>
  <p>${profile.overview.paragraph3}</p>
</div>

<h3>Background</h3>
<ul>
  <li><strong>Role:</strong> ${profile.background.role}</li>
  <li><strong>Industry:</strong> ${profile.background.industry}</li>
  <li><strong>Company:</strong> ${profile.background.companySize} • ${profile.background.companyType}</li>
</ul>

<h3>Daily Responsibilities</h3>
<ul>
  ${profile.background.dailyResponsibilities.map(resp => `<li>${resp}</li>`).join('\n  ')}
</ul>

<h3>Current Tools</h3>
<ul>
  ${profile.background.currentTools.map(tool => `<li>${tool}</li>`).join('\n  ')}
</ul>

<h3>Problems & Pain Points</h3>
<p><strong>Biggest Frustration:</strong> ${profile.problems.biggestFrustration}</p>
<p><strong>Pain Points:</strong> ${profile.problems.painPoints}</p>

<h3>Manual Tasks</h3>
<ul>
  ${profile.problems.manualTasks.map(task => `<li>${task}</li>`).join('\n  ')}
</ul>

<h3>Inefficiencies</h3>
<ul>
  ${profile.problems.inefficiencies.map(inefficiency => `<li>${inefficiency}</li>`).join('\n  ')}
</ul>`;
}

export function CustomerProfiles() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productSlug } = useParams();
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { customerProfiles: profiles, recommendation } = 
    (location.state?.profiles as CustomerProfilesResponse) || { customerProfiles: [], recommendation: null };

  if (!productSlug || profiles.length === 0) {
    navigate('/');
    return null;
  }

  // Find the recommended profile
  const recommendedProfile = profiles.find(p => p.name === recommendation?.selectedProfile);
  const recommendedIndex = profiles.findIndex(p => p.name === recommendation?.selectedProfile);
  const otherProfiles = profiles.filter(p => p.name !== recommendation?.selectedProfile);

  const handleGenerateMvp = async () => {
    if (selectedProfileIndex === null) return;
    
    const selectedProfile = profiles[selectedProfileIndex];
    setIsGenerating(true);
    setError(null);
    
    // Track start of customer profile generation
    trackStartCustomerProfileGeneration();
    
    try {
      // First, get the product ID using the slug
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, description')
        .eq('slug', productSlug)
        .single();

      if (productError) throw productError;
      if (!productData) throw new Error('Product not found');

      // Save the customer profile
      const { data: profileData, error: profileError } = await supabase
        .from('customer_profiles')
        .insert({
          product_id: productData.id,
          name: selectedProfile.name,
          overview: selectedProfile.overview,
          background: selectedProfile.background,
          problems: selectedProfile.problems,
          scoring: selectedProfile.scoring,
          is_selected: true
        })
        .select()
        .single();

      if (profileError) {
        throw profileError;
      }

      // Update any other selected profiles to be unselected
      if (profileData) {
        const { error: updateError } = await supabase
          .from('customer_profiles')
          .update({ is_selected: false })
          .eq('product_id', productData.id)
          .neq('id', profileData.id);

        if (updateError) {
          console.error('Error updating other profiles:', updateError);
        }
      }

      // Generate MVP content using OpenAI
      const mvpContent = await generateMvpPrd({
        customerProfile: selectedProfile,
        productDescription: productData.description || '',
        problems: selectedProfile.problems
      });

      // Parse the JSON response
      const mvpData = JSON.parse(mvpContent);
      
      // Transform the selected profile into HTML format
      const targetAudienceHtml = transformProfileToHtml(selectedProfile);
      
      // Insert the generated features into the features table
      if (mvpData.prd?.features && Array.isArray(mvpData.prd.features)) {
        const features = mvpData.prd.features.map((feature: any) => ({
          product_id: productData.id,
          name: feature.name,
          description: feature.description,
          priority: feature.priority || 'not-prioritized',
          implementation_status: feature.implementation_status || 'not_started',
          position: 0 // This will be updated by the database trigger
        }));

        const { data: insertedFeatures, error: featuresError } = await supabase
          .from('features')
          .insert(features)
          .select();

        if (featuresError) {
          console.error('Error inserting features:', featuresError);
          // Continue with PRD update even if feature insertion fails
        }
      }
      
      // Update the PRD in the database with the transformed target audience HTML
      const { error: prdError } = await supabase
        .from('prds')
        .update({
          problem: mvpData.prd.problem,
          solution: mvpData.prd.solution,
          target_audience: targetAudienceHtml,
          tech_stack: JSON.stringify(mvpData.prd.technologyStack),
          success_metrics: JSON.stringify(mvpData.prd.successMetrics)
        })
        .eq('product_id', productData.id);

      if (prdError) throw prdError;
      
      // Track successful customer profile generation
      trackSuccessfulCustomerProfileGeneration();
      
      // Navigate to the PRD editor with the MVP data
      navigate(`/product/${productSlug}/prd`, { state: { mvpData } });
    } catch (error) {
      // Handle user-friendly error message
      if (error instanceof OpenAIError) {
        setError(error.message);
      } else {
        setError('Failed to generate MVP PRD. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate(`/product/${productSlug}/prd`)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to PRD Editor
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Profiles</h2>
          <p className="text-gray-600 mt-2">
            Based on your product description, we've identified these key customer personas.
            Select one profile to generate an MVP PRD.
          </p>
        </div>
        <Button
          variant={selectedProfileIndex !== null ? "default" : "secondary"}
          size="lg"
          disabled={selectedProfileIndex === null || isGenerating}
          onClick={handleGenerateMvp}
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating PRD...
            </span>
          ) : (
            'Generate PRD'
          )}
        </Button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200 text-red-700 flex items-center gap-2 mb-6">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Recommended Profile */}
      {recommendedProfile && (
        <div className="mb-8">
          <ProfileCard 
            profile={recommendedProfile}
            isSelected={selectedProfileIndex === recommendedIndex}
            isRecommended={true}
            onSelect={() => setSelectedProfileIndex(recommendedIndex)}
          />
        </div>
      )}

      {/* Other Profiles */}
      {otherProfiles.length > 0 && (
        <>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Other Personas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {otherProfiles.map((profile, index) => {
              // Adjust index to account for recommended profile being removed
              const actualIndex = index >= recommendedIndex ? index + 1 : index;
              return (
                <ProfileCard 
                  key={index}
                  profile={profile}
                  isSelected={selectedProfileIndex === actualIndex}
                  onSelect={() => setSelectedProfileIndex(actualIndex)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}