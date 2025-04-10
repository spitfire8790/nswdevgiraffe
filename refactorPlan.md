# Proposed Refactor Plan (Updated)

Below is a high-level plan for refactoring the `DevelopmentModal` component to reduce file size and improve maintainability, based on the current state of the code. ASCII-style diagrams illustrate the recommended folder structure.

---

## Goals

1. Separate large chunks of code into smaller, reusable modules
2. Improve code readability by isolating concerns (data fetching, filtering, UI, etc.)
3. Provide clearer, more maintainable structure for future development

---

## Step-by-Step Instructions

### 1. Extract Data Fetching and API Utilities

The main component relies on external utilities for fetching and cleaning data:

- Functions already externalized (verify imports):

  - `fetchAllDAs` (imported from `../../utils/api/fetchDAs`)
  - `deduplicateDAs` (imported from `../../utils/api/dataCleanup`)
  - `queryLgaFromCoordinates` (imported but no longer used in this component after removing auto-detect - consider removing import if not needed elsewhere).

- **Action:** Confirm these utilities are well-placed in `utils/api/`. No major changes needed here based on the current component code, but verify the `queryLgaFromCoordinates` import is still necessary.

### 2. Move Calculation and Formatting Logic

- ✅ Functions already moved:

  - `calculateSummaryStats` (moved to `utils/calculations.js`)
  - `formatDateLong`, `formatDateShort`, `formatCostShort` (moved to `utils/formatters.js`)
  - `getAbbreviatedAppType` (moved to `utils/formatters.js`)

- Functions still to move:
  - `getDevelopmentType` (approx. lines 1010–1040)
  - `isResidentialType` (approx. lines 550–555)

Example structure:

```
utils/
├── calculations.js      // e.g. calculateSummaryStats
├── formatters.js        // e.g. formatDateLong, formatDateShort
└── typeUtils.js         // e.g. getDevelopmentType, isResidentialType
```

### 3. Extract and Organize Filter Logic

The code that controls filter states and checks conditions is spread throughout the component:

- Move `getFilteredApplications` (approx. lines 950–1010)
- Move filter setter functions (`setFilter`, `resetFilter`, `resetAllFilters`)
- Consider creating a custom hook for filter state management

Example structure:

```
utils/
└── filters.js (pure function)
   OR
hooks/
└── useDevelopmentFilters.js (custom hook)
```

### 4. Break Main UI into Subcomponents

The `DevelopmentModal` renders many UI sections that can be split into subcomponents:

- `LGASelector` – just the portion that handles LGA changes, validation, and auto-detect
- `FilterBar` – the row that shows all the filter cards
- `SummaryStats` – the small KPI boxes at the top (total applications, total value, dwellings, etc.)
- `DevCharts` – the tabbed chart UI
- `DevelopmentTable` – the big table for applications, with sorting logic

Example structure:

```
components/
└── DevelopmentModal/
    ├── LGASelector.jsx
    ├── FilterBar.jsx
    ├── SummaryStats.jsx
    ├── DevCharts.jsx
    ├── DevelopmentTable.jsx
    └── index.jsx         // orchestrates them
```

### 5. Relocate or Centralize Constants

Currently, several constants are defined in the component or imported from nearby files:

- `STATUS_COLORS` (lines 50-57)
- `developmentCategories`
- `RESIDENTIAL_TYPES`

These should be moved to dedicated files:

```
constants/
├── statusColors.js
├── developmentCategories.js
└── residentialTypes.js
```

### 6. Leverage a Custom Hook for Data Loading

Since the entire logic around fetching development data is complex:

- Create a custom hook like `useDevelopmentData(lgaName, selectedFeatures)` that handles:
  - Fetching data
  - Deduplicating records
  - Calculating summary statistics
  - Managing loading/error states

This would greatly simplify the main component.

### 7. Map Interaction Functions

Move map-specific operations to their own utility file:

- `flyToPoint` (approx. lines 862-880)
- `handleCreateGeoJSONLayer` (approx. lines 956-990)
- `removeAllDevelopmentLayers` (approx. lines 622-636)

These could go in:

```
utils/
└── map/
    └── layerOperations.js
```

### 8. Testing as You Go

Apply each extraction step individually to avoid mixing changes. After each one:

1. Verify compilation and linting.
2. Test all features (LGA detection, filtering, charting, table).
3. Confirm no functional change occurred.

---

## ASCII Directory Diagram

Below is a simple ASCII diagram showing the proposed new directory layout:

```
project-root/
├── src/
│   ├── components/
│   │   ├── DevelopmentModal/
│   │   │   ├── LGASelector.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── SummaryStats.jsx
│   │   │   ├── DevCharts.jsx
│   │   │   ├── DevelopmentTable.jsx
│   │   │   └── index.jsx          (DevelopmentModal)
│   │   └── ...
│   ├── utils/
│   │   ├── api/
│   │   │   ├── fetchDAs.js
│   │   │   ├── dataCleanup.js
│   │   │   └── arcgis.js
│   │   ├── map/
│   │   │   └── layerOperations.js
│   │   ├── calculations.js
│   │   ├── formatters.js
│   │   ├── filters.js
│   │   └── typeUtils.js
│   ├── constants/
│   │   ├── statusColors.js
│   │   ├── developmentCategories.js
│   │   └── residentialTypes.js
│   └── hooks/
│       ├── useDevelopmentData.js
│       └── useDevelopmentFilters.js
└── ...
```

This modular approach will keep the code cleaner, easier to navigate, and more maintainable.

---

## Expected Benefits

1. **Improved Readability**: The main component file will be significantly shorter, focusing on orchestration rather than implementation details.

2. **Better Testing**: Smaller, pure functions are easier to test in isolation.

3. **Code Reuse**: Utilities for formatting, calculation, and API calls can be reused across the application.

4. **Easier Maintenance**: When bugs arise or features need to be added, developers can quickly locate the relevant code.

5. **Performance Optimization**: Separated components make it easier to apply React optimization techniques like memoization.

By implementing this plan step-by-step with careful testing at each stage, the large `DevelopmentModal` component can be transformed into a maintainable, modular set of components and utilities.
