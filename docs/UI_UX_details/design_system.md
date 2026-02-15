# BuildBidz Design System Specification

## 1. Brand Identity & Colors

### Primary Palette
The brand uses a high-contrast pairing of deep Navy for trust and vibrant Orange for action.

| Token | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| `primary` | **Enterprise Navy** | `#0f172a` | Main buttons, active states, key headings |
| `primary-foreground` | **White** | `#ffffff` | Text on primary backgrounds |
| `secondary` | **Slate 100** | `#f1f5f9` | Secondary buttons, backgrounds |
| `accent` | **Brand Orange** | `#f97316` | Call-to-actions, highlights, "Brand" variant |
| `destructive` | **Red 600** | `#dc2626` | Delete actions, errors |

### Functional Colors
| Token | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| `background` | **White** | `#ffffff` | Page background |
| `muted` | **Slate 50** | `#f8fafc` | Card backgrounds, subtle sections |
| `border` | **Slate 200** | `#e2e8f0` | Dividers, inputs, card borders |
| `input` | **Slate 200** | `#e2e8f0` | Form input borders |

---

## 2. Typography
We use a dual-font stack to balance modern geometry with high readability.

### Font Family
*   **Headings**: `Outfit` (Sans-serif, Geometric) - Used for component titles, page headers.
*   **Body**: `Inter` (Sans-serif, Humanist) - Used for paragraphs, inputs, data tables.

### Type Scale
| Style | Size | Weight | Usage |
| :--- | :--- | :--- | :--- |
| `h1` | 3rem (48px) | Bold (700) | Marketing headers |
| `h2` | 1.875rem (30px) | Bold (700) | Page titles |
| `h3` | 1.5rem (24px) | SemiBold (600) | Section headers |
| `body-lg` | 1.125rem (18px) | Regular (400) | Lead text |
| `body` | 1rem (16px) | Regular (400) | Default text |
| `small` | 0.875rem (14px) | Medium (500) | Metadata, hints |

---

## 3. Component Library Specs

### 3.1 Button
Standardized interaction model for all clickables.
*   **Height**:
    *   `default`: 40px (`h-10`)
    *   `sm`: 36px (`h-9`)
    *   `lg`: 44px (`h-11`)
*   **Radius**: `rounded-md` (6px)
*   **Interaction**:
    *   `hover`: specific opacity (e.g., `hover:bg-primary/90`)
    *   `active`: `scale-95` (95% size reduction) for tactile feel.
    *   `focus-visible`: 2px ring offset.

### 3.2 Card
Container for related content.
*   **Background**: White (`bg-card`)
*   **Border**: 1px Solid (`border-border`)
*   **Shadow**: `shadow-sm` (Subtle elevation)
*   **Padding**: `p-6` (24px) standard

### 3.3 Input
Form fields.
*   **Height**: 40px
*   **Border**: 1px (`border-input`)
*   **Focus**: Ring with `ring-offset-2`
*   **Placeholder**: `text-muted-foreground`

---

## 4. Iconography
*   **Library**: `Lucide React`
*   **Style**: Outlined, 2px stroke (default), rounded caps.
*   **Size**:
    *   `w-4 h-4` (16px) for inline icons (buttons).
    *   `w-5 h-5` (20px) for navigation.
    *   `w-6 h-6` (24px) for feature icons.
