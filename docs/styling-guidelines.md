## Fluxr Styling Guidelines

### Design Principles

1. **Clean and Professional**
   - Minimal, purposeful design elements
   - Generous whitespace
   - Clear visual hierarchy

2. **Consistent Spacing**
   - 8px grid system (0.5rem = 8px)
   - Consistent padding and margins
   - Breathing room between elements

3. **Typography**
   - Clear hierarchy with distinct heading and body styles
   - Optimal line heights for readability
   - Consistent font sizes across similar elements

### Color System

```css
:root {
  /* Brand Colors */
  --brand-purple: hsl(265, 89%, 78%); /* Primary brand color */
  --brand-purple-dark: hsl(265, 89%, 68%);
  
  /* Background Colors */
  --background: hsl(0, 0%, 100%);
  --background-subtle: hsl(220, 14%, 96%);
  --background-muted: hsl(220, 14%, 93%);
  
  /* Text Colors */
  --text-primary: hsl(222, 47%, 11%);
  --text-secondary: hsl(215, 16%, 47%);
  --text-muted: hsl(215, 16%, 57%);
  
  /* Border Colors */
  --border-default: hsl(220, 13%, 91%);
  --border-strong: hsl(220, 13%, 85%);
  
  /* Accent Colors */
  --accent-success: hsl(142, 76%, 36%);
  --accent-warning: hsl(37, 92%, 50%);
  --accent-error: hsl(0, 84%, 60%);
  
  /* Dark Mode Colors */
  --dark-background: hsl(222, 47%, 11%);
  --dark-background-subtle: hsl(222, 47%, 15%);
  --dark-text: hsl(210, 40%, 98%);
  --dark-border: hsl(215, 16%, 27%);
}

.dark {
  --background: var(--dark-background);
  --background-subtle: var(--dark-background-subtle);
  --text-primary: var(--dark-text);
  --border-default: var(--dark-border);
}
```

### Spacing Scale

```css
:root {
  /* Base spacing unit: 4px (0.25rem) */
  --spacing-px: 1px;
  --spacing-0-5: 0.125rem;  /* 2px */
  --spacing-1: 0.25rem;     /* 4px */
  --spacing-2: 0.5rem;      /* 8px */
  --spacing-3: 0.75rem;     /* 12px */
  --spacing-4: 1rem;        /* 16px */
  --spacing-6: 1.5rem;      /* 24px */
  --spacing-8: 2rem;        /* 32px */
  --spacing-10: 2.5rem;     /* 40px */
  --spacing-12: 3rem;       /* 48px */
  --spacing-16: 4rem;       /* 64px */
}
```

### Typography Scale

```css
:root {
  /* Font Families */
  --font-sans: ui-sans-serif, system-ui, -apple-system, sans-serif;
  
  /* Font Sizes */
  --text-xs: 0.75rem;      /* 12px */
  --text-sm: 0.875rem;     /* 14px */
  --text-base: 1rem;       /* 16px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.25rem;      /* 20px */
  --text-2xl: 1.5rem;      /* 24px */
  --text-3xl: 1.875rem;    /* 30px */
  
  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  
  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.25rem;    /* 4px */
  --radius-md: 0.375rem;   /* 6px */
  --radius-lg: 0.5rem;     /* 8px */
  --radius-xl: 0.75rem;    /* 12px */
  --radius-2xl: 1rem;      /* 16px */
  --radius-full: 9999px;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Component Patterns

#### Buttons
```tsx
// Primary Button
<button className="bg-brand-purple hover:bg-brand-purple-dark text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="bg-white hover:bg-gray-50 text-gray-900 font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors">
  Secondary Action
</button>

// Ghost Button
<button className="text-gray-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-colors">
  Ghost Action
</button>
```

#### Navigation Links
```tsx
// Active Link
<a className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-purple text-white font-medium">
  <Icon className="w-4 h-4" />
  <span>Active Link</span>
</a>

// Inactive Link
<a className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition-colors">
  <Icon className="w-4 h-4" />
  <span>Inactive Link</span>
</a>
```

#### Input Fields
```tsx
<input 
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent"
  placeholder="Enter text"
/>
```

#### Cards
```tsx
<div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-300">Card content</p>
</div>
```

### Layout Guidelines

1. **Container Widths**
   ```css
   .container {
     max-width: 1280px; /* 80rem */
     margin: 0 auto;
     padding: 0 1rem;
   }
   ```

2. **Grid System**
   - Use CSS Grid for complex layouts
   - Use Flexbox for simpler arrangements
   - Maintain consistent gaps (use --spacing variables)

3. **Responsive Breakpoints**
   ```css
   /* Mobile First */
   sm: '640px'   /* @media (min-width: 640px) */
   md: '768px'   /* @media (min-width: 768px) */
   lg: '1024px'  /* @media (min-width: 1024px) */
   xl: '1280px'  /* @media (min-width: 1280px) */
   2xl: '1536px' /* @media (min-width: 1536px) */
   ```

### Accessibility Guidelines

1. **Color Contrast**
   - Maintain WCAG 2.1 AA standard (4.5:1 for normal text, 3:1 for large text)
   - Test color combinations in both light and dark modes

2. **Focus States**
   - Visible focus rings on interactive elements
   - Custom focus styles should be clearly visible
   - Never remove focus outlines without replacement

3. **Interactive Elements**
   - Minimum touch target size of 44x44px for mobile
   - Clear hover and active states
   - Appropriate cursor styles

4. **Text Readability**
   - Minimum font size of 16px for body text
   - Adequate line height (1.5 for body text)
   - Maximum line length of 75 characters

### Animation Guidelines

1. **Transitions**
   ```css
   :root {
     --transition-fast: 150ms;
     --transition-normal: 250ms;
     --transition-slow: 350ms;
     --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
   }
   ```

2. **Common Animations**
   - Use for state changes (hover, active, etc.)
   - Keep animations subtle and purposeful
   - Respect reduced-motion preferences

### Best Practices

1. **Maintainability**
   - Use CSS variables for repeated values
   - Follow BEM naming convention for custom classes
   - Keep specificity low

2. **Performance**
   - Minimize use of box-shadows and filters
   - Use hardware-accelerated properties
   - Optimize transitions and animations

3. **Dark Mode**
   - Test all components in both modes
   - Ensure sufficient contrast
   - Avoid pure black (#000) in dark mode

4. **Responsive Design**
   - Mobile-first approach
   - Fluid typography when appropriate
   - Consistent spacing across breakpoints 