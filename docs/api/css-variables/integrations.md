# Framework Integrations

Integrate Vizel CSS variables with Tailwind CSS and shadcn/ui.

## Tailwind CSS

Vizel works seamlessly with Tailwind CSS. Map Vizel's CSS variables to Tailwind's theme system.

### Configuration

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        vizel: {
          primary: 'var(--vizel-primary)',
          'primary-hover': 'var(--vizel-primary-hover)',
          'primary-foreground': 'var(--vizel-primary-foreground)',
          secondary: 'var(--vizel-secondary)',
          background: 'var(--vizel-background)',
          foreground: 'var(--vizel-foreground)',
          muted: 'var(--vizel-muted)',
          'muted-foreground': 'var(--vizel-muted-foreground)',
          border: 'var(--vizel-border)',
          success: 'var(--vizel-success)',
          warning: 'var(--vizel-warning)',
          error: 'var(--vizel-error)',
        },
      },
      borderRadius: {
        vizel: {
          sm: 'var(--vizel-radius-sm)',
          md: 'var(--vizel-radius-md)',
          lg: 'var(--vizel-radius-lg)',
          xl: 'var(--vizel-radius-xl)',
        },
      },
      fontFamily: {
        vizel: {
          sans: 'var(--vizel-font-sans)',
          mono: 'var(--vizel-font-mono)',
        },
      },
    },
  },
}
```

### Usage

```html
<div class="bg-vizel-background text-vizel-foreground">
  <button class="bg-vizel-primary text-vizel-primary-foreground rounded-vizel-md">
    Click me
  </button>
</div>
```

---

## shadcn/ui

Vizel is designed to work with [shadcn/ui](https://ui.shadcn.com/). Both libraries use similar CSS variable naming conventions.

### Variable Mapping

Add these CSS variable mappings to your global styles:

```css
@layer base {
  :root {
    /* Map Vizel variables to shadcn/ui variables */
    --background: var(--vizel-background);
    --foreground: var(--vizel-foreground);
    
    --card: var(--vizel-background);
    --card-foreground: var(--vizel-foreground);
    
    --popover: var(--vizel-background);
    --popover-foreground: var(--vizel-foreground);
    
    --primary: var(--vizel-primary);
    --primary-foreground: var(--vizel-primary-foreground);
    
    --secondary: var(--vizel-secondary);
    --secondary-foreground: var(--vizel-secondary-foreground);
    
    --muted: var(--vizel-muted);
    --muted-foreground: var(--vizel-muted-foreground);
    
    --accent: var(--vizel-accent);
    --accent-foreground: var(--vizel-accent-foreground);
    
    --destructive: var(--vizel-destructive);
    --destructive-foreground: var(--vizel-destructive-foreground);
    
    --border: var(--vizel-border);
    --input: var(--vizel-border);
    --ring: var(--vizel-primary);
    
    --radius: var(--vizel-radius-lg);
  }

  .dark {
    /* Dark theme mappings are automatic since Vizel 
       uses the same selectors */
  }
}
```

### Usage with shadcn/ui Components

```tsx
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function App() {
  return (
    <Card>
      <CardContent className="p-6">
        <Vizel
          placeholder="Type '/' for commands..."
          features={{ slashCommand: true, dragHandle: true }}
        />
        <div className="mt-4 flex gap-2">
          <Button>Save</Button>
          <Button variant="outline">Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Theme Synchronization

Both Vizel and shadcn/ui support the same theme selectors:

```tsx
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';
import { Button } from '@/components/ui/button';

function App() {
  return (
    // Works for both Vizel and shadcn/ui
    <div className="dark">
      <Vizel placeholder="Type '/' for commands..." />
      <Button>Save</Button>
    </div>
  );
}
```

Or use Vizel's ThemeProvider:

```tsx
import { ThemeProvider, Vizel } from '@vizel/react';
import '@vizel/core/styles.css';
import { Button } from '@/components/ui/button';

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <Vizel placeholder="Type '/' for commands..." />
      <Button>Save</Button>
    </ThemeProvider>
  );
}
```

### With next-themes

```tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Vizel } from '@vizel/react';
import '@vizel/core/styles.css';

function App() {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      <Vizel
        placeholder="Type '/' for commands..."
        features={{
          slashCommand: true,
          dragHandle: true,
        }}
      />
    </NextThemesProvider>
  );
}
```
