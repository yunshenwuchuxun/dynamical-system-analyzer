# Neobrutalism Theme System - Usage Guide

## Overview

The application now features a complete **Neobrutalism design system** with support for both light and dark modes. The theme includes bold borders, flat shadows, and vibrant colors inspired by the brutalist design movement.

## Theme Features

### Color System
- **Light Mode**: Soft pink/beige backgrounds with bold magenta accents
- **Dark Mode**: Deep navy backgrounds with cyan/pink accents
- **Primary Color**: Magenta/Pink (#d1519a in light mode)
- **Neobrutalist Shadows**: Flat, offset shadows (3px 3px) instead of blurred shadows

### Typography
- **Sans-serif**: Poppins (headings, UI elements)
- **Serif**: Lora (body text, optional)
- **Monospace**: Fira Code (code snippets)

### Design Elements
- **Bold Borders**: 2-3px solid borders on all components
- **Flat Shadows**: Offset shadows without blur
- **Rounded Corners**: Consistent border-radius (0.4rem base)
- **High Contrast**: Strong contrast between elements

## Files Overview

### CSS Files
1. **`static/css/theme.css`** - Main theme system with CSS variables
2. **`static/css/style.css`** - Application-specific styles (extends theme)

### JavaScript Files
1. **`static/js/theme-toggle.js`** - Dark mode toggle functionality

### Documentation
1. **`theme-toggle-component.html`** - Reusable component snippet for theme toggle button

## How to Use

### 1. Dark Mode Toggle

The theme toggle button has been added to the header. Users can:
- Click the moon/sun icon to switch themes
- Theme preference is saved in localStorage
- Respects system preference on first load

**Adding Toggle to Other Pages:**

```html
<!-- Add to header -->
<button data-theme-toggle class="help-btn" aria-label="切换主题">
    <i class="fas fa-moon"></i>
</button>

<!-- Include script -->
<script src="{{ url_for('static', filename='js/theme-toggle.js') }}"></script>
```

### 2. Using Theme Variables in Custom CSS

All theme colors are available as CSS variables:

```css
/* Background Colors */
background: var(--background);
background: var(--card);

/* Text Colors */
color: var(--foreground);
color: var(--muted-foreground);

/* Accent Colors */
background: var(--primary);
background: var(--secondary);
background: var(--accent);

/* Borders */
border: 2px solid var(--border);

/* Shadows */
box-shadow: var(--shadow);
box-shadow: var(--shadow-lg);
box-shadow: var(--shadow-xl);

/* Typography */
font-family: var(--font-sans);
font-family: var(--font-mono);

/* Border Radius */
border-radius: var(--radius);
```

### 3. Pre-styled Components

The theme includes pre-styled classes for common components:

**Buttons:**
```html
<button class="action-btn">Primary Button</button>
<button class="action-btn secondary">Secondary Button</button>
<button class="action-btn destructive">Delete Button</button>
```

**Cards:**
```html
<div class="card">
    <!-- Card content -->
</div>
```

**Inputs:**
```html
<input type="text" class="matrix-input" placeholder="输入值">
<input type="number" class="param-input">
```

**Tabs:**
```html
<button class="tab-btn active">选项 1</button>
<button class="tab-btn">选项 2</button>
```

### 4. Utility Classes

```html
<!-- Text Colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-muted">Muted text</p>

<!-- Background Colors -->
<div class="bg-primary">Primary background</div>
<div class="bg-secondary">Secondary background</div>
<div class="bg-muted">Muted background</div>

<!-- Borders -->
<div class="border-primary">Primary border</div>
```

### 5. JavaScript API

The theme system exposes a global `ThemeManager` object:

```javascript
// Get current theme
const theme = ThemeManager.getTheme(); // 'light' or 'dark'

// Set theme programmatically
ThemeManager.setTheme('dark');
ThemeManager.setTheme('light');

// Toggle theme
ThemeManager.toggleTheme();

// Listen for theme changes
window.addEventListener('theme-changed', (e) => {
    console.log('Theme changed to:', e.detail.theme);
});
```

## Customization

### Changing Theme Colors

Edit `static/css/theme.css` and modify the CSS variables in the `:root` selector:

```css
:root {
  /* Change primary color */
  --primary: oklch(0.6209 0.1801 348.1385); /* Pink */

  /* Change background */
  --background: oklch(0.9399 0.0203 345.6985); /* Light beige */

  /* Change shadow color */
  --shadow-color: #d1519a; /* Magenta */
}
```

### Adjusting Shadow Style

```css
:root {
  /* Shadow offset */
  --shadow-x: 3px;
  --shadow-y: 3px;

  /* Shadow blur (0 for flat neobrutalist style) */
  --shadow-blur: 0px;

  /* Shadow spread */
  --shadow-spread: 0px;
}
```

### Changing Border Thickness

```css
/* Global border thickness */
.card, .action-btn, input {
  border-width: 3px; /* Change from 2px to 3px */
}
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS `oklch()` color space support required
- Fallback to hex colors available if needed

## Responsive Design

The theme includes responsive breakpoints:

- **Desktop**: Full layout
- **Tablet** (< 768px): Adjusted padding and font sizes
- **Mobile**: Simplified layout

## Accessibility

- High contrast ratios (WCAG AA compliant)
- Clear focus states with ring indicators
- Proper ARIA labels on theme toggle
- Keyboard navigation support

## Performance

- CSS variables for instant theme switching
- No JavaScript required for styling
- Minimal repaints during theme changes
- localStorage caching for theme preference

## Troubleshooting

### Theme not applying
1. Check that `theme.css` is loaded before `style.css`
2. Clear browser cache
3. Check browser console for errors

### Toggle button not working
1. Verify `theme-toggle.js` is loaded
2. Check for `data-theme-toggle` attribute on button
3. Ensure no conflicting JavaScript

### Colors look different
1. Verify browser supports `oklch()` color space
2. Check monitor color profile
3. Compare in incognito mode (to rule out extensions)

## Future Enhancements

- [ ] Add more color schemes (blue, green, orange)
- [ ] Theme customizer UI
- [ ] Export/import theme settings
- [ ] Animation preferences toggle
- [ ] High contrast mode

## Resources

- Design inspiration: Neobrutalism Web Design
- Color system: OKLCH color space
- Icons: Font Awesome 6.0
- Fonts: Google Fonts (Poppins, Lora, Fira Code)

## Support

For issues or suggestions, check:
- `CLAUDE.md` - Project documentation
- `static/css/theme.css` - Theme variables
- `static/js/theme-toggle.js` - Toggle functionality
