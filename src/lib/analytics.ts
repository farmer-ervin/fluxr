import mixpanel from './mixpanel';

// 1. Authentication Events
export const trackSignUp = (signupType: string = 'Direct') => {
  mixpanel.track('Sign Up', {
    'Signup Type': signupType
  });
};

export const trackLogin = () => {
  mixpanel.track('Login');
};

export const trackLogout = () => {
  mixpanel.track('Logout');
};

export const trackPasswordResetRequested = () => {
  mixpanel.track('Password Reset Requested');
};

export const trackPasswordResetCompleted = () => {
  mixpanel.track('Password Reset Completed');
};

// 2. Product Management Events
export const trackNewProduct = (productName: string) => {
  mixpanel.track('New Product', {
    'Product Name': productName
  });
};

export const trackProductDeleted = (productName: string) => {
  mixpanel.track('Product Deleted', {
    'Product Name': productName
  });
};

export const trackProductUpdated = (productName: string, updateType: string) => {
  mixpanel.track('Product Updated', {
    'Product Name': productName,
    'Update Type': updateType
  });
};

export const trackProductDescriptionUpdated = (productName: string) => {
  mixpanel.track('Product Description Updated', {
    'Product Name': productName
  });
};

export const trackProductNameUpdated = (oldName: string, newName: string) => {
  mixpanel.track('Product Name Updated', {
    'Old Name': oldName,
    'New Name': newName
  });
};

// 3. PRD Events
export const trackUploadPRD = () => {
  mixpanel.track('Upload PRD');
};

export const trackSuccessfulPRDUpload = (prdLength: number) => {
  mixpanel.track('Successful PRD Upload', {
    'PRD Length': prdLength
  });
};

export const trackStartPRDGeneration = () => {
  mixpanel.track('Start PRD Generation');
};

export const trackSuccessfulPRDGeneration = () => {
  mixpanel.track('Successful PRD Generation');
};

export const trackPRDSectionUpdated = (sectionName: string) => {
  mixpanel.track('PRD Section Updated', {
    'Section Name': sectionName
  });
};

export const trackPRDSectionAdded = (sectionName: string) => {
  mixpanel.track('PRD Section Added', {
    'Section Name': sectionName
  });
};

export const trackPRDSectionDeleted = (sectionName: string) => {
  mixpanel.track('PRD Section Deleted', {
    'Section Name': sectionName
  });
};

export const trackPRDSectionRenamed = (oldName: string, newName: string) => {
  mixpanel.track('PRD Section Renamed', {
    'Old Name': oldName,
    'New Name': newName
  });
};

// 4. Customer Profile Events
export const trackStartCustomerProfileGeneration = () => {
  mixpanel.track('Start Customer Profile Generation');
};

export const trackSuccessfulCustomerProfileGeneration = () => {
  mixpanel.track('Successful Customer Profile Generation');
};

export const trackCustomerProfileSelected = (profileName: string) => {
  mixpanel.track('Customer Profile Selected', {
    'Profile Name': profileName
  });
};

export const trackCustomerProfileUpdated = (profileName: string) => {
  mixpanel.track('Customer Profile Updated', {
    'Profile Name': profileName
  });
};

export const trackCustomerProfileDeleted = (profileName: string) => {
  mixpanel.track('Customer Profile Deleted', {
    'Profile Name': profileName
  });
};

// 5. User Flow Events
export const trackStartFlowGeneration = () => {
  mixpanel.track('Start Flow Generation');
};

export const trackFlowPatternSelected = (pattern: string) => {
  mixpanel.track('Flow Pattern Selected', {
    'Pattern': pattern
  });
};

export const trackFlowGenerationCompleted = (pageCount: number) => {
  mixpanel.track('Flow Generation Completed', {
    'Page Count': pageCount
  });
};

export const trackFlowPageAdded = (pageName: string) => {
  mixpanel.track('Flow Page Added', {
    'Page Name': pageName
  });
};

export const trackFlowPageDeleted = (pageName: string) => {
  mixpanel.track('Flow Page Deleted', {
    'Page Name': pageName
  });
};

export const trackFlowConnectionAdded = (sourcePage: string, targetPage: string) => {
  mixpanel.track('Flow Connection Added', {
    'Source Page': sourcePage,
    'Target Page': targetPage
  });
};

export const trackFlowConnectionDeleted = (sourcePage: string, targetPage: string) => {
  mixpanel.track('Flow Connection Deleted', {
    'Source Page': sourcePage,
    'Target Page': targetPage
  });
};

export const trackFlowRefinementStarted = () => {
  mixpanel.track('Flow Refinement Started');
};

export const trackFlowRefinementCompleted = () => {
  mixpanel.track('Flow Refinement Completed');
};

export const trackFlowReviewStarted = () => {
  mixpanel.track('Flow Review Started');
};

export const trackFlowReviewCompleted = () => {
  mixpanel.track('Flow Review Completed');
};

export const trackFlowUndoAction = () => {
  mixpanel.track('Flow Undo Action');
};

export const trackFlowRedoAction = () => {
  mixpanel.track('Flow Redo Action');
};

// 6. Feature Management Events
export const trackFeatureAdded = (featureName: string) => {
  mixpanel.track('Feature Added', {
    'Feature Name': featureName
  });
};

export const trackFeatureUpdated = (featureName: string, updateType: string) => {
  mixpanel.track('Feature Updated', {
    'Feature Name': featureName,
    'Update Type': updateType
  });
};

export const trackFeatureDeleted = (featureName: string) => {
  mixpanel.track('Feature Deleted', {
    'Feature Name': featureName
  });
};

export const trackFeaturePriorityChanged = (featureName: string, newPriority: string) => {
  mixpanel.track('Feature Priority Changed', {
    'Feature Name': featureName,
    'New Priority': newPriority
  });
};

export const trackFeatureStatusChanged = (featureName: string, newStatus: string) => {
  mixpanel.track('Feature Status Changed', {
    'Feature Name': featureName,
    'New Status': newStatus
  });
};

export const trackFeatureDescriptionUpdated = (featureName: string) => {
  mixpanel.track('Feature Description Updated', {
    'Feature Name': featureName
  });
};

export const trackFeatureReordered = (featureName: string, newPosition: number) => {
  mixpanel.track('Feature Reordered', {
    'Feature Name': featureName,
    'New Position': newPosition
  });
};

// 7. Navigation Events
export const trackPageView = (pageName: string, url: string) => {
  mixpanel.track('Page View', {
    'Page Name': pageName,
    'URL': url
  });
};

export const trackNavigation = (fromPage: string, toPage: string) => {
  mixpanel.track('Navigation', {
    'From Page': fromPage,
    'To Page': toPage
  });
};

export const trackTimeSpentOnPage = (pageName: string, timeInSeconds: number) => {
  mixpanel.track('Time Spent on Page', {
    'Page Name': pageName,
    'Time in Seconds': timeInSeconds
  });
}; 