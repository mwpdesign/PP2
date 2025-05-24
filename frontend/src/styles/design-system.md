# Wound Care Portal Design System

## Login Page Design

### Layout & Spacing
```tsx
// Main container
"min-h-screen bg-[#2C3E50] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"

// Card container
"bg-white rounded-xl shadow-2xl p-8"

// Logo section
"flex flex-col items-center mb-8"
"w-full flex justify-center mb-6"
"h-32 w-auto" // Logo size

// Content spacing
"mb-6" // Main content
"mt-6 pt-6 border-t border-gray-200" // Footer section
```

### Color Palette
- Background: `#2C3E50` (Dark blue background)
- Primary Blue: `#375788` (HIPAA badge & brand color)
- Input Border: `rgb(209 213 219)` (gray-300)
- Input Border Hover: `rgb(156 163 175)` (gray-400)
- Input Focus Ring: `rgb(96 165 250 / 0.1)` (blue-400 with opacity)
- Text Colors:
  - Primary: `rgb(17 24 39)` (gray-900)
  - Secondary: `rgb(75 85 99)` (gray-600)
  - Muted: `rgb(107 114 128)` (gray-500)

### Typography
```tsx
// Main title
"text-2xl font-bold text-gray-900 text-center"

// Subtitle
"text-sm text-gray-600 text-center max-w-sm"

// Form labels
"text-sm font-medium text-gray-700"

// Input text
"text-base text-gray-900"
```

### Interactive Elements

#### Trust Badges
```tsx
// Badge container
"flex items-center gap-2 bg-[#375788] rounded-lg px-3 py-1.5"

// Badge text
"text-xs font-medium text-white"
```

#### Input Fields
```tsx
// MUI TextField styles
{
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    transition: 'all 0.15s ease-in-out',
    '& fieldset': {
      borderColor: 'rgb(209 213 219)',
      borderWidth: '1px',
    },
    '&:hover fieldset': {
      borderColor: 'rgb(156 163 175)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#60a5fa',
      borderWidth: '1px',
      boxShadow: '0 0 0 4px rgb(96 165 250 / 0.1)',
    }
  }
}
```

#### Button
```tsx
// Primary button
{
  textTransform: 'none',
  backgroundColor: '#2563eb',
  fontSize: '0.875rem',
  fontWeight: 500,
  boxShadow: 'none',
  '&:hover': {
    backgroundColor: '#1d4ed8',
    boxShadow: 'none'
  }
}
```

### Component Hierarchy
1. AuthLayout
   - Logo
   - Title & Subtitle
   - LoginForm
   - TrustIndicators
   - Footer

2. LoginForm
   - Title
   - Email Input
   - Password Input
   - Remember Device
   - Submit Button

3. TrustIndicators
   - HIPAA Badge
   - Secure Access Badge

### Responsive Behavior
- Max width: `max-w-md`
- Padding adjustments:
  - Mobile: `px-4`
  - Small: `sm:px-6`
  - Large: `lg:px-8`

## Usage Guidelines

1. **Color Consistency**
   - Use `#375788` for all primary brand elements
   - Maintain consistent blue across all interactive elements
   - Keep trust badges in primary blue

2. **Spacing**
   - Maintain 8px grid system
   - Use consistent margin bottom (`mb-6`, `mb-8`)
   - Keep proper spacing between sections

3. **Typography**
   - Use consistent font sizes
   - Maintain proper hierarchy
   - Keep text colors consistent

4. **Interactive States**
   - Subtle hover states
   - Consistent focus styles
   - Professional transition timing 