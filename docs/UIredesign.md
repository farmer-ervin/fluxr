### Context:
We are completely redesigning our SaaS web application using **shadcn/ui and TailwindCSS**, replacing all existing UI components and styles while keeping the same functionality.

### Goals:
- Fully migrate all UI components to **shadcn/ui**, unless there is no direct equivalent. If no alternative exists, we will **apply Tailwind styling** to match the design.
- Implement a **collapsible side panel navigation**.
- Remove the **header** and shift all navigation to the sidebar.
- Ensure **dark mode support** with a **global theme system** in Tailwind.
- **Reduce redundant components** and create a **consistent component structure** for maintainability.
- Ensure **accessibility (a11y)** and **performance optimizations**.
- Make it beautiful UI

### Current Tech Stack:
#### Frontend:
- **React 18.3.1** (Updated from original 18.2.0 plan for better compatibility)
- **Vite 5.4.2**
- **TailwindCSS 3.4.1**
- **shadcn/ui with New York style** (Recommended modern style variant)
- **Radix UI (unstyled, accessible components)**
- **Lucide React (icons)**
- **Class Variance Authority (component variants)**
- **React Router DOM (client-side routing)**

#### Interactive Components:
- **TipTap (Rich Text Editor)**
- **dnd-kit & hello-pangea/dnd (Drag & Drop)**
- **ReactFlow (Flowchart Visualization)**

#### Backend & Data:
- **Supabase (Database & Authentication)**
- **Stripe (Payments)**
- **OpenAI SDK (AI Integration)**
- **Mixpanel (Analytics)**

### Files & Components to Migrate:
We have an extensive component library, including:
- **Custom Core Components**: `Layout.tsx`, `PageTitle.tsx`
- **Dialogs & Forms**: `alert-dialog.tsx`, `dialog.tsx`, `dropdown-menu.tsx`
- **Feature-Specific Components**: `FeatureBuckets.tsx`, `PrdEditor.tsx`, `UploadPrdDialog.tsx`
- **Flow & Kanban**: `flow/`, `kanban/`
- **AI Components**: `AiDialog.tsx`, `AiTextActions.tsx`
- **Prompt Components**: `prompts/`

### Design References:
Attached are screenshots of UI components from **shadcn/ui** that we want to follow:
1. **Sidebar Navigation** – Collapsible, replacing the existing header-based navigation.
2. **Dashboard Components** – Cards, graphs, tables, settings, analytics views.
3. **Form Elements & Inputs** – Consistent UI for text fields, dropdowns, modals, buttons.

### Implementation Plan

#### Phase 1: Setup & Foundation (Week 1)
1. **Environment Setup**
   - Update React to 18.3.1 ✅
   - Verify TailwindCSS 3.4.1 configuration ✅
   - Install and configure shadcn/ui CLI ✅
   - Set up initial theme configuration ✅

2. **Component Migration Rules**
   - Rule 1: Use shadcn/ui components when equivalent functionality exists
   - Rule 2: Use Radix UI with updated styling when no shadcn/ui component exists
   - Rule 3: Update existing component styling when neither option is available

3. **Theme System Setup**
   - Configure global Tailwind theme tokens ✅
   - Set up dark mode infrastructure ✅
   - Create theme switching mechanism ✅

#### Phase 2: Core Components Migration (Week 2)
1. **Layout & Navigation**
   - Implement new collapsible sidebar using shadcn/ui Sheet component
   - Migrate header content to sidebar
   - Set up responsive navigation behavior

2. **Basic UI Components**
   - Migrate buttons to shadcn/ui Button
   - Implement form elements (Input, Select, Checkbox)
   - Set up Dialog and Alert Dialog components
   - Configure Dropdown menus

3. **Typography System**
   - Implement shadcn/ui Typography components
   - Update heading hierarchy
   - Standardize text styles

#### Phase 3: Feature-Specific Components (Week 3)
1. **Rich Text Editor**
   - Style TipTap editor with new theme
   - Implement shadcn/ui Toolbar for editor controls
   - Update editor plugins styling

2. **Kanban & Flow Components**
   - Apply new styling to ReactFlow components
   - Update dnd-kit components with new theme
   - Implement shadcn/ui Card for Kanban items

3. **AI Components**
   - Migrate AI dialogs to shadcn/ui Dialog
   - Update AI action buttons
   - Style AI response containers

#### Phase 4: Forms & Interactive Elements (Week 4)
1. **Form Components**
   - Implement shadcn/ui Form
   - Set up form validation styling
   - Migrate complex form layouts

2. **Data Display**
   - Implement shadcn/ui Table
   - Set up Card layouts
   - Configure data grids

3. **Feedback & Loading States**
   - Implement Toast notifications
   - Set up loading skeletons
   - Configure progress indicators

#### Phase 5: Testing & Optimization (Week 5)
1. **Component Testing**
   - Test all migrated components
   - Verify dark mode functionality
   - Ensure responsive behavior

2. **Performance Optimization**
   - Implement code splitting
   - Optimize bundle size
   - Set up component lazy loading

3. **Accessibility Verification**
   - Test with screen readers
   - Verify keyboard navigation
   - Ensure ARIA compliance

### Component Migration Mapping

#### Direct shadcn/ui Replacements:
- Button → shadcn/ui Button
- Input → shadcn/ui Input
- Select → shadcn/ui Select
- Checkbox → shadcn/ui Checkbox
- Dialog → shadcn/ui Dialog
- DropdownMenu → shadcn/ui DropdownMenu
- Toast → shadcn/ui Toast
- Card → shadcn/ui Card
- Sheet → shadcn/ui Sheet (for sidebar)
- Form → shadcn/ui Form

#### Radix UI with Custom Styling:
- TipTap toolbar → Radix UI Toolbar
- Complex tooltips → Radix UI Tooltip
- Custom select interfaces → Radix UI Select

#### Custom Styled Components:
- ReactFlow components
- Kanban board layouts
- AI response containers
- Custom visualizations

### Updating Process
For each component:
1. Install shadcn/ui component: `npx shadcn-ui@latest add [component]`
2. Update imports and props
3. Migrate state and event handlers
4. Apply custom styling if needed
5. Test functionality
6. Verify accessibility
7. Document changes

### Quality Assurance
- Run component tests after each migration
- Verify responsive behavior
- Test dark mode compatibility
- Check accessibility compliance
- Validate performance metrics
- Review bundle size impact

## Detailed Implementation Plan

### Phase 1: Environment Setup & Foundation (Days 1-7)

#### Day 1: Project Preparation ✅
1. **Create Git Branch**
   ```bash
   git checkout -b ui-redesign
   ```

2. **Update Dependencies**
   ```bash
   npm install react@18.3.1
   npm install tailwindcss@3.4.1 --save-dev
   ```

3. **Install shadcn/ui and Required Dependencies**
   ```bash
   npm install @radix-ui/react-icons lucide-react
   npm install class-variance-authority clsx tailwind-merge
   npm install @radix-ui/react-slot
   npx shadcn-ui@latest init
   ```
   
   During init, select:
   - Style: New York
   - Base color: Slate
   - CSS variables for colors: Yes
   - Global CSS: src/index.css
   - CSS reset: Yes
   - Import aliases: @components, @lib, @styles

#### Completed Steps for Day 1:

1. ✅ Created and switched to `ui-redesign` branch
2. ✅ Updated React and ReactDOM to version 18.3.1 (newer than originally planned 18.2.0, providing better compatibility)
3. ✅ Installed required shadcn/ui dependencies:
   - @radix-ui/react-icons
   - lucide-react
   - class-variance-authority
   - clsx
   - tailwind-merge
   - @radix-ui/react-slot
4. ✅ Configured Tailwind with:
   - Dark mode support using "class" strategy
   - Extended color system with shadcn/ui variables
   - Custom border radius system
   - Animation configurations
   - Typography plugin
   - Animation plugin
5. ✅ Set up the project with proper configuration files:
   - components.json for shadcn/ui configuration with New York style (recommended modern variant)
   - Updated tailwind.config.js with necessary plugins and theme settings
   - Comprehensive import aliases (@components, @utils, @ui, @lib, @hooks)

> **Implementation Improvements**:
> - Upgraded to React 18.3.1 for better dependency compatibility
> - Adopted shadcn/ui's recommended New York style instead of Default
> - Configured more comprehensive import aliases for better code organization

Next steps will be Day 2: Theme Configuration, where we'll set up the theme provider and implement dark mode support.

#### Day 2: Theme Configuration ✅
1. **Create Theme Provider**
   ```bash
   npx shadcn@latest add theme
   ```

2. **Configure Dark Mode Support**
   - Modify tailwind.config.js:
   ```js
   module.exports = {
     darkMode: ["class"],
     theme: {
       // existing config
     }
   }
   ```

3. **Create ThemeProvider Component**
   - Implement in `src/components/context/ThemeProvider.tsx`
   - Add to main application wrapper

#### Completed Steps for Day 2:

1. ✅ Created a custom ThemeProvider component in `src/components/context/ThemeProvider.tsx`:
   - Implements theme context with light, dark and system options
   - Persists theme preference in localStorage
   - Provides a useTheme hook for easy access to theme functions
   - Properly manages theme changes using CSS classes

2. ✅ Created a ThemeToggle component in `src/components/ui/theme-toggle.tsx`:
   - Provides an intuitive dropdown interface for theme selection
   - Includes a dynamic icon that changes based on current theme
   - Uses accessible design patterns with proper keyboard navigation
   - Animates smoothly between light and dark modes

3. ✅ Added ThemeProvider to the application in `src/main.tsx`:
   - Wraps the entire application to ensure theme consistency
   - Uses "system" as the default theme to respect user preferences
   - Stores theme setting with a unique key "fluxr-theme"

4. ✅ Verified CSS variable setup in `src/index.css`:
   - Confirmed all necessary theme variables are defined for both light and dark modes
   - Variables follow the HSL color format for better color manipulation
   - All component colors are properly defined using CSS variables
   - Chart colors are included for data visualization components

5. ✅ Implemented utility functions in `src/lib/utils.ts`:
   - Added the `cn()` utility for merging Tailwind classes
   - Set up proper type definitions for class merging

#### Theme System Architecture:

The theme system we've implemented follows best practices from shadcn/ui and Tailwind CSS:

1. **CSS Variables Approach**:
   - All colors are defined as HSL values in CSS variables
   - Variables are set at the :root level for light mode
   - Variables are overridden in .dark class for dark mode
   - This approach enables smooth transitions between themes

2. **Class-based Theme Switching**:
   - Dark mode is implemented using Tailwind's "class" strategy
   - The html element gets a "dark" class when dark mode is active
   - This approach allows for easy theme toggling without page reload

3. **System Preference Detection**:
   - The theme respects user's system preferences by default
   - Uses `prefers-color-scheme` media query to detect system setting
   - Falls back to light mode if system preference can't be determined

4. **Theme Persistence**:
   - User's theme preference is stored in localStorage
   - Theme is restored on page reload for consistent experience
   - Separate storage key prevents conflicts with other applications

5. **UI Integration**:
   - Added ThemeToggle in the header for easy access
   - Enhanced existing UI elements with dark mode styles
   - Used responsive design that looks great in both light and dark modes

Our theme implementation is now ready for use throughout the application. The next step is to continue migrating UI components to use the new theme system and implement the collapsible sidebar navigation.

#### Day 3: Styling Guidelines & Standards ✅
1. **Design Tokens**
   - Created comprehensive CSS variables system
   - Defined color palette with HSL values
   - Established spacing and typography scales
   - Added animation and transition tokens

2. **Component Patterns**
   - Defined reusable button variants
   - Created consistent input styles
   - Established card and navigation patterns
   - Added dark mode support to all patterns

3. **Documentation**
   - Created styling guidelines document
   - Added component usage examples
   - Documented accessibility requirements
   - Included responsive design patterns

4. **Tailwind Configuration**
   - Updated color system with CSS variables
   - Added custom spacing and sizing scales
   - Configured typography and animations
   - Set up consistent border radius system

#### Day 4-5: Layout Foundation
1. **Analyze Current Layout Component**
   - Document current layout structure
   - Identify navigation items to migrate

2. **Create New Layout Component**
   - Create sidebar layout using Sheet component
   - Implement responsive behavior

3. **Setup Theme Toggle**
   - Implement theme switching button
   - Add to sidebar

#### Day 6-7: Design System Setup
1. **Define Color System**
   - Establish primary, secondary, accent colors
   - Create color tokens in CSS

2. **Typography Scale Setup**
   - Define heading and body text styles
   - Document typography system

3. **Documentation**
   - Create design system reference document
   - Document theme configuration

### Phase 2: Core Components Migration (Days 8-14)

#### Day 8: Navigation Components
1. **Migrate Header Content to Sidebar**
   - Move navigation links
   - Implement mobile navigation menu
   - Add logo and branding

2. **Create Page Layout Components**
   ```bash
   npx shadcn-ui@latest add separator
   npx shadcn-ui@latest add scroll-area
   ```

3. **Implement Main Navigation Component**
   - Create responsive sidebar
   - Add collapsible functionality

#### Day 9: Dialog Components
1. **Install Dialog Components**
   ```bash
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add alert-dialog
   ```

2. **Migrate Existing Dialogs**
   - Migrate alert-dialog.tsx
   - Migrate dialog.tsx
   - Update any components using dialogs

#### Day 10-11: Form Components
1. **Install Form Components**
   ```bash
   npx shadcn-ui@latest add form
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add textarea
   npx shadcn-ui@latest add select
   npx shadcn-ui@latest add checkbox
   npx shadcn-ui@latest add radio-group
   npx shadcn-ui@latest add switch
   ```

2. **Migrate Form Elements**
   - Create base form patterns
   - Implement form validation
   - Update existing forms

#### Day 12: Dropdown Components
1. **Install Dropdown Components**
   ```bash
   npx shadcn-ui@latest add dropdown-menu
   npx shadcn-ui@latest add command
   ```

2. **Migrate Dropdown Menus**
   - Update dropdown-menu.tsx
   - Implement command palette if needed

#### Day 13-14: Card & Container Components
1. **Install Card Components**
   ```bash
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add avatar
   npx shadcn-ui@latest add badge
   ```

2. **Implement Container Components**
   - Create card layouts
   - Implement list containers
   - Create grid layouts

### Phase 3: Feature-Specific Components (Days 15-21)

#### Day 15-16: Rich Text Editor
1. **TipTap Editor Styling**
   - Install editor components
   ```bash
   npx shadcn-ui@latest add tooltip
   npx shadcn-ui@latest add popover
   npx shadcn-ui@latest add toggle
   npx shadcn-ui@latest add toggle-group
   ```

2. **Create Custom TipTap Toolbar**
   - Style editor toolbar using Toggle Group
   - Implement editor commands

3. **Update PrdEditor.tsx**
   - Apply new styling to rich text editor
   - Implement toolbar with shadcn/ui components

#### Day 17-18: Kanban Board Components
1. **Card Components for Kanban**
   - Style kanban cards
   - Implement drag handles

2. **Kanban Board Layout**
   - Create column layout
   - Style drag-and-drop interactions

3. **Update dnd-kit Integration**
   - Ensure compatibility with new styling
   - Test drag-and-drop functionality

#### Day 19-20: Flow Components
1. **ReactFlow Styling**
   - Update node styles
   - Customize edge styling
   - Implement control panel

2. **Flow Controls**
   ```bash
   npx shadcn-ui@latest add slider
   npx shadcn-ui@latest add menubar
   ```

3. **Implement Custom Flow Components**
   - Create custom node components
   - Style flow controls

#### Day 21: AI Components
1. **Migrate AI Dialog Components**
   - Update AiDialog.tsx
   - Style AI response containers

2. **AI Actions Styling**
   - Implement AiTextActions.tsx
   - Style action buttons

### Phase 4: Forms & Interactive Elements (Days 22-28)

#### Day 22-23: Advanced Form Patterns
1. **Complex Form Layouts**
   ```bash
   npx shadcn-ui@latest add label
   npx shadcn-ui@latest add calendar
   npx shadcn-ui@latest add date-picker
   ```

2. **Form Wizards & Multi-step Forms**
   - Create stepped form components
   - Implement form navigation

3. **Custom Form Components**
   - Implement specialized form elements
   - Create form templates

#### Day 24-25: Data Display Components
1. **Install Table Components**
   ```bash
   npx shadcn-ui@latest add table
   npx shadcn-ui@latest add data-table
   ```

2. **Implement Data Tables**
   - Create sortable tables
   - Implement filtering
   - Add pagination

3. **Data Visualization Components**
   ```bash
   npx shadcn-ui@latest add progress
   npx shadcn-ui@latest add skeleton
   ```

#### Day 26-28: Feedback & Notifications
1. **Install Notification Components**
   ```bash
   npx shadcn-ui@latest add toast
   npx shadcn-ui@latest add sonner
   ```

2. **Implement Toast Notifications**
   - Create global notification system
   - Style success/error states

3. **Loading States**
   - Implement loading skeletons
   - Create loading spinners
   - Add progress indicators

### Phase 5: Testing & Optimization (Days 29-35)

#### Day 29-30: Component Testing
1. **Test Core Components**
   - Verify all components in light/dark mode
   - Test responsive behavior
   - Check accessibility

2. **Interactive Component Testing**
   - Test forms and validation
   - Test drag-and-drop
   - Test navigation

#### Day 31-32: Performance Optimization
1. **Code Splitting**
   - Implement lazy loading for routes
   - Set up component lazy loading

2. **Bundle Analysis**
   ```bash
   npm install -D webpack-bundle-analyzer
   ```
   - Analyze bundle size
   - Identify optimization opportunities

3. **Performance Improvements**
   - Implement memo for heavy components
   - Optimize renders

#### Day 33-34: Accessibility Verification
1. **Automated A11y Testing**
   ```bash
   npm install -D axe-core @axe-core/react
   ```
   - Set up automated testing
   - Fix identified issues

2. **Manual Testing**
   - Test with keyboard navigation
   - Test with screen readers
   - Verify ARIA attributes

#### Day 35: Documentation & Final Review
1. **Component Documentation**
   - Document all migrated components
   - Create usage examples

2. **Final UI Review**
   - Verify design consistency
   - Check for styling issues
   - Test across browsers

3. **Prepare for Merge**
   - Resolve any conflicts
   - Prepare release notes

### Component Migration Examples

#### Example 1: Button Component Migration
```tsx
// Before:
import React from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
  // other props
}

export const Button = ({ variant = 'primary', ...props }: ButtonProps) => {
  return (
    <button 
      className={`px-4 py-2 rounded ${
        variant === 'primary' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-800'
      }`}
      {...props} 
    />
  );
};

// After (with shadcn/ui):
import { Button } from "@/components/ui/button";

// Usage:
<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
```

#### Example 2: Dialog Component Migration
```tsx
// Before (using Radix UI directly):
import * as DialogPrimitive from '@radix-ui/react-dialog';

// After (with shadcn/ui):
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Usage:
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description goes here</DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
  </DialogContent>
</Dialog>
```

#### Example 3: Layout Migration
```tsx
// Before:
<div className="flex flex-col min-h-screen">
  <Header />
  <main className="flex-1 container mx-auto py-8">
    {children}
  </main>
  <Footer />
</div>

// After (with collapsible sidebar):
<div className="flex min-h-screen">
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetTrigger asChild className="md:hidden">
      <Button variant="outline" size="icon">
        <MenuIcon />
      </Button>
    </SheetTrigger>
    <SheetContent side="left" className="w-[240px] sm:w-[300px]">
      <Sidebar />
    </SheetContent>
  </Sheet>
  
  <div className="hidden md:flex w-[240px] flex-col border-r">
    <Sidebar />
  </div>
  
  <main className="flex-1 overflow-auto">
    <div className="container mx-auto py-8">
      {children}
    </div>
  </main>
</div>
```
