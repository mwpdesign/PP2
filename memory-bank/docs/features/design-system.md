# Healthcare IVR Platform Design System

## Color Palette

### Primary Colors
- Dark Navy: #2C3E50 (Main brand color, sidebar)
- White: #FFFFFF (Cards, content background)
- Light Blue: #f8fafc (Page background)

### Text Colors
- Primary: #2C3E50 (Headers, important text)
- Secondary: rgba(0, 0, 0, 0.6) (Body text)
- White: #FFFFFF (Sidebar text)

## Typography

### Headers
- H4: 2rem, 600 weight (Page titles)
- H5: 1.5rem, 500 weight (Section headers)
- H6: 1.25rem, 500 weight (Card titles)

### Body Text
- Body 1: 1rem (Regular text)
- Body 2: 0.875rem (Secondary text)

## Components

### Logo
- Position: Top of sidebar
- Height: 40px
- Auto width
- Proper contrast on dark background

### Cards
```typescript
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  backgroundColor: '#ffffff',
}));
```

### Buttons
- Primary: Dark navy background (#2C3E50)
- Hover: Lighter navy (#34495E)
- Text transform: none
- Border radius: 4px
- Padding: theme.spacing(1, 3)

### Navigation
- Dark navy sidebar (#2C3E50)
- White icons and text
- Hover: rgba(255, 255, 255, 0.1)
- Simple, clean list items

### Form Elements
- Clean, minimal styling
- Consistent spacing
- Clear labels
- Simple validation states

## Layout

### Spacing
- Page padding: theme.spacing(3)
- Section spacing: theme.spacing(3)
- Grid gap: theme.spacing(3)
- Form field gap: theme.spacing(2)

### Containers
- Main content: maxWidth="lg"
- Forms: maxWidth="md"
- Responsive grid system

### Visual Hierarchy
1. Logo in sidebar
2. Clean navigation
3. Page header
4. Content cards
5. Action buttons

## Best Practices

### Clean Medical UI
- Minimal, professional appearance
- Clear information hierarchy
- Consistent branding
- Good contrast
- Proper spacing

### Form Design
- Logical field grouping
- Clear labels
- Simple validation
- Loading states
- Confirmation dialogs

### Navigation
- Clear menu structure
- Simple hover states
- Logical grouping
- Visual feedback

## Implementation Notes

### Theme Configuration
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#2C3E50',
      light: '#34495E',
      dark: '#2C3E50',
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
      color: '#2C3E50',
    },
    h5: {
      fontWeight: 500,
      color: '#2C3E50',
    },
    h6: {
      fontWeight: 500,
      color: '#2C3E50',
    },
  },
});
```

### Component Usage
- Simple card styling
- Consistent text hierarchy
- Clean button design
- Proper spacing
- Clear navigation 