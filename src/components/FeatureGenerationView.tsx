import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, ListChecks, Filter, Search, Check, Clock, AlertTriangle, Info, ChevronDown, ChevronUp, Edit, Trash, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Feature {
  id: string;
  name: string;
  description: string;
  priority: 'must-have' | 'nice-to-have' | 'not-prioritized';
  implementation_status: 'not_started' | 'in_progress' | 'completed';
}

interface FeatureGenerationViewProps {
  features: Feature[];
  isLoading: boolean;
  onBack: () => void;
  onNext: () => void;
  onRegenerateFeatures: () => Promise<void>;
  onUpdateFeature?: (feature: Feature) => void;
  onDeleteFeature?: (featureId: string) => void;
  onAddFeature?: (feature: Feature) => void;
}

const priorityColors = {
  'must-have': 'text-red-600 bg-red-50 border-red-200',
  'nice-to-have': 'text-yellow-600 bg-yellow-50 border-yellow-200',
  'not-prioritized': 'text-gray-600 bg-gray-50 border-gray-200'
};

const priorityIcons = {
  'must-have': <Check className="h-3.5 w-3.5" />,
  'nice-to-have': <Clock className="h-3.5 w-3.5" />,
  'not-prioritized': <AlertTriangle className="h-3.5 w-3.5" />
};

interface EditFeatureDialogProps {
  feature: Feature | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (feature: Feature) => void;
  isNew?: boolean;
}

function EditFeatureDialog({ feature, isOpen, onClose, onSave, isNew = false }: EditFeatureDialogProps) {
  const [editedFeature, setEditedFeature] = useState<Feature>(
    feature || {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      priority: 'not-prioritized',
      implementation_status: 'not_started'
    }
  );

  const handleSave = () => {
    onSave(editedFeature);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add New Feature' : 'Edit Feature'}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Add a new feature to your product.' : 'Make changes to your feature.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editedFeature.name}
              onChange={(e) => setEditedFeature({ ...editedFeature, name: e.target.value })}
              placeholder="Feature name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedFeature.description}
              onChange={(e) => setEditedFeature({ ...editedFeature, description: e.target.value })}
              placeholder="Describe the feature..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={editedFeature.priority}
              onValueChange={(value: 'must-have' | 'nice-to-have' | 'not-prioritized') => 
                setEditedFeature({ ...editedFeature, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="must-have">Must Have</SelectItem>
                <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                <SelectItem value="not-prioritized">Not Prioritized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!editedFeature.name || !editedFeature.description}>
            {isNew ? 'Add Feature' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FeatureGenerationView({
  features,
  isLoading,
  onBack,
  onNext,
  onRegenerateFeatures,
  onUpdateFeature,
  onDeleteFeature,
  onAddFeature
}: FeatureGenerationViewProps) {
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [featureToDelete, setFeatureToDelete] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [originalFeatures] = useState<Feature[]>(features);

  const hasChanges = JSON.stringify(originalFeatures) !== JSON.stringify(features);

  const handleRegenerateClick = () => {
    if (hasChanges) {
      setIsRegenerateDialogOpen(true);
    } else {
      onRegenerateFeatures();
    }
  };

  const priorityOrder = {
    'must-have': 0,
    'nice-to-have': 1,
    'not-prioritized': 2
  };

  const filteredFeatures = features
    .filter(feature => {
      const matchesPriority = filterPriority ? feature.priority === filterPriority : true;
      const matchesSearch = searchTerm
        ? feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feature.description.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      return matchesPriority && matchesSearch;
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Count features by priority
  const featureCounts = {
    'must-have': features.filter(f => f.priority === 'must-have').length,
    'nice-to-have': features.filter(f => f.priority === 'nice-to-have').length,
    'not-prioritized': features.filter(f => f.priority === 'not-prioritized').length
  };

  const handleEditFeature = (feature: Feature) => {
    setEditingFeature(feature);
    setIsEditDialogOpen(true);
  };

  const handleDeleteFeature = (featureId: string) => {
    setFeatureToDelete(featureId);
    setIsDeleteDialogOpen(true);
  };

  const handleAddFeature = () => {
    setIsAddDialogOpen(true);
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <ListChecks className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Generated Features</CardTitle>
            <CardDescription className="text-base text-muted-foreground mt-1.5">
              We've generated features based on your problem and solution description. You can add new features, edit existing features, or delete.
            </CardDescription>
          </div>
        </div>
        
        {/* Priority Guide - Collapsible Panel */}
        <div className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="w-full justify-between font-normal text-sm"
          >
            <div className="flex items-center">
              <Info className="h-4 w-4 mr-2 text-primary" />
              Understanding Feature Priority
            </div>
            {isInfoExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {isInfoExpanded && (
            <div className="mt-2 p-4 rounded-lg border bg-muted/40 text-sm text-muted-foreground space-y-2 animate-in fade-in-50 duration-150">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className={`min-w-[24px] h-6 flex items-center justify-center rounded-full border ${priorityColors['must-have']}`}>
                    {priorityIcons['must-have']}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Must Have</h4>
                    <p>Core features required for the MVP. These solve the primary user problems and represent the minimum viable product.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`min-w-[24px] h-6 flex items-center justify-center rounded-full border ${priorityColors['nice-to-have']}`}>
                    {priorityIcons['nice-to-have']}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Nice to Have</h4>
                    <p>Features that add significant value but aren't critical for the first release. Plan these for subsequent iterations.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`min-w-[24px] h-6 flex items-center justify-center rounded-full border ${priorityColors['not-prioritized']}`}>
                    {priorityIcons['not-prioritized']}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Not Prioritized</h4>
                    <p>Features to consider for the long-term roadmap. These might require further validation or are less urgent.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feature filtering controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search features..."
              className="pl-9 h-10 w-full sm:w-[250px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={filterPriority || "all"}
              onValueChange={(value) => setFilterPriority(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px] h-10">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    All ({features.length})
                  </div>
                </SelectItem>
                <SelectItem value="must-have">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5" />
                    Must Have ({featureCounts['must-have']})
                  </div>
                </SelectItem>
                <SelectItem value="nice-to-have">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Nice to Have ({featureCounts['nice-to-have']})
                  </div>
                </SelectItem>
                <SelectItem value="not-prioritized">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Not Prioritized ({featureCounts['not-prioritized']})
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleAddFeature}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Feature
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Generating Features</h3>
            <p className="text-muted-foreground max-w-md">
              We're analyzing your product vision to generate a comprehensive list of features prioritized for your MVP...
            </p>
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No matching features</h3>
            <p className="text-muted-foreground max-w-md">
              {searchTerm ? `No features found matching "${searchTerm}"` : 'No features match the selected filter'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setFilterPriority(null);
                setSearchTerm('');
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFeatures.map((feature) => (
                <div 
                  key={feature.id} 
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-lg">{feature.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${priorityColors[feature.priority]}`}>
                        {priorityIcons[feature.priority]}
                        {feature.priority === 'must-have' ? 'Must Have' : 
                         feature.priority === 'nice-to-have' ? 'Nice to Have' : 
                         'Not Prioritized'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditFeature(feature)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFeature(feature.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between items-center gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 hover:bg-background"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRegenerateClick}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              Regenerate
            </Button>
            <Button
              onClick={onNext}
              disabled={isLoading}
              className="gap-2 shadow-sm hover:shadow-md transition-all"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {isLoading ? 'Processing...' : 'Finish'}
            </Button>
          </div>
        </div>

        {/* Edit Feature Dialog */}
        {editingFeature && (
          <EditFeatureDialog
            feature={editingFeature}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setEditingFeature(null);
            }}
            onSave={(updatedFeature) => {
              onUpdateFeature?.(updatedFeature);
            }}
          />
        )}

        {/* Add Feature Dialog */}
        <EditFeatureDialog
          feature={null}
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={(newFeature) => {
            onAddFeature?.(newFeature);
          }}
          isNew
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Feature</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this feature? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsDeleteDialogOpen(false);
                setFeatureToDelete(null);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (featureToDelete) {
                    onDeleteFeature?.(featureToDelete);
                  }
                  setIsDeleteDialogOpen(false);
                  setFeatureToDelete(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Regenerate Confirmation Dialog */}
        <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Regenerate Features</AlertDialogTitle>
              <AlertDialogDescription>
                You have made changes to the features. Regenerating will discard all your changes and create a new set of features. Are you sure you want to continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsRegenerateDialogOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsRegenerateDialogOpen(false);
                  onRegenerateFeatures();
                }}
              >
                Regenerate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
} 