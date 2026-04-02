# CrmShell

Application shell that provides the top-level layout with a collapsible sidebar navigation and a top header bar with breadcrumbs and user profile. Wraps the main content area (schedule views).

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | `React.ReactNode` | Yes | Main content to render in the content area |
| isFocusMode | `boolean` | No | When true, hides sidebar and header bar for distraction-free viewing |

## UI Kit Components

| Component | Import | Role |
|-----------|--------|------|
| Button | `@fzwp/ui-kit/button` | Sidebar nav buttons, bell notification button |
| Avatar | `@fzwp/ui-kit/avatar` | User profile avatar in the header |
| Divider | `@fzwp/ui-kit/divider` | Horizontal dividers in sidebar, vertical divider between bell and user |
| Image | `@fzwp/ui-kit` | Silpo logo image in sidebar |
| Icons (Bell, House01, ChevronDown, ChevronLeft) | `@fzwp/ui-kit/icons` | Notification bell, breadcrumb home, user dropdown caret, sidebar collapse |

## Key Features

- Left sidebar (76px) with icon-based navigation items
- Active nav item highlighting with background color change
- Sidebar dividers separating nav sections (home, main nav, support)
- Silpo company logo at the top of the sidebar
- Collapse button positioned at the sidebar edge
- Top header bar with breadcrumb navigation (store address)
- Bell notification button with primary accent background
- User profile section with avatar, name, email, and dropdown caret
- Focus mode: animated collapse of sidebar and header bar with CSS transitions
- Content area with rounded top-left corner (border-radius) when not in focus mode
- Full viewport layout (100vw x 100vh) with overflow hidden

## Usage

```tsx
<CrmShell isFocusMode={false}>
  <Header ... />
  <WeeklyTable ... />
</CrmShell>
```

## Dependencies

- SVG path imports from `../../imports/svg-jfnxlebcsy` for custom nav icons
- Image assets for user avatar and Silpo logo
