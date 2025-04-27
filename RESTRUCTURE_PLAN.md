# Project Restructuring Plan: Moving to Vite with Frontend/Backend Separation

## Current Structure
```
project/
  ├── public/
  │   ├── js/
  │   │   ├── alphaVantageService.js
  │   │   ├── config.js
  │   │   └── symbolService.js
  │   ├── css/
  │   │   └── styles.css
  │   └── watchlist.html
  ├── server.js
  ├── alphaVantageService.js (duplicate)
  ├── symbolService.js (duplicate)
  ├── inject.js
  ├── package.json
  └── package-lock.json
```

## Target Structure
```
project/
  ├── frontend/                  # New Vite frontend project
  │   ├── src/
  │   │   ├── services/         # Service files moved from public/js
  │   │   │   ├── alphaVantageService.js
  │   │   │   └── symbolService.js
  │   │   ├── styles/          # CSS files moved from public/css
  │   │   │   └── styles.css
  │   │   ├── config/         # Configuration
  │   │   │   └── config.js
  │   │   ├── App.js          # New main application component
  │   │   └── main.js        # Entry point for Vite
  │   ├── index.html         # Converted from watchlist.html
  │   ├── vite.config.js     # Vite configuration
  │   ├── package.json       # Frontend dependencies
  │   └── package-lock.json
  │
  ├── backend/                # Express API server
  │   ├── src/
  │   │   └── server.js      # Moved from root
  │   ├── package.json       # Backend dependencies
  │   └── package-lock.json
  │
  └── README.md              # Project documentation
```

## Step-by-Step Implementation Plan

### 1. Setup Backend
1. Create backend directory structure
2. Move server.js to backend/src/
3. Create new package.json for backend:
   - Copy relevant dependencies from current package.json
   - Update scripts for backend server
4. Configure CORS for frontend development server
5. Remove static file serving (since Vite will handle this)

### 2. Setup Frontend with Vite
1. Create new Vite project in frontend directory
2. Configure Vite:
   - Set up development proxy for API calls
   - Configure build output directory
   - Add necessary plugins
3. Move and reorganize existing files:
   - Convert watchlist.html to index.html
   - Move service files to src/services/
   - Move CSS to src/styles/
   - Move config.js to src/config/
4. Update import/export statements to use ES modules
5. Create main.js as the entry point
6. Set up proper module bundling

### 3. Code Modifications

#### Backend Changes
1. Update server.js:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// CORS configuration for development
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com'
    : 'http://localhost:5173' // Vite's default port
}));

app.use(express.json());

// API routes will go here

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
```

#### Frontend Changes
1. Convert script tags to ES modules
2. Update service files to use ES module syntax:
```javascript
// Before
class AlphaVantageService {
  // ...
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlphaVantageService;
}

// After
export class AlphaVantageService {
  // ...
}
```

### 4. Development Workflow
1. Running development servers:
```bash
# Terminal 1 - Backend
cd backend
npm run dev  # runs on port 3000

# Terminal 2 - Frontend
cd frontend
npm run dev  # runs on port 5173
```

2. Development URLs:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### 5. Production Build
1. Frontend build:
```bash
cd frontend
npm run build
```
   - Outputs optimized files to frontend/dist/

2. Backend build (if needed):
```bash
cd backend
npm run build
```

### 6. Deployment Considerations
1. Frontend:
   - Can be deployed to static hosting (Netlify, Vercel, etc.)
   - Or served by backend in production
2. Backend:
   - Deploy to Node.js hosting platform
   - Configure production environment variables
   - Set up proper CORS for production domain

### 7. Testing Plan
1. Verify all API endpoints work with new CORS configuration
2. Test frontend development hot reload functionality
3. Ensure all services work with ES module imports
4. Test production build locally before deployment
5. Verify all functionality in a staging environment

## Benefits of New Structure
1. **Development Experience**:
   - Fast hot module replacement with Vite
   - Better code organization
   - Independent frontend/backend development
   - Modern ES modules instead of script tags

2. **Build Optimization**:
   - Code splitting
   - Tree shaking
   - Asset optimization
   - Smaller bundle sizes

3. **Maintenance**:
   - Clear separation of concerns
   - No duplicate files
   - Easier to test
   - Better dependency management

4. **Scalability**:
   - Frontend and backend can scale independently
   - Easier to add new features
   - Better code reusability
   - Simpler deployment options

## Timeline
1. Backend setup: ~1 hour
2. Frontend setup: ~2 hours
3. Code migration: ~2 hours
4. Testing and fixes: ~2 hours
5. Total estimated time: ~7 hours

## Rollback Plan
All changes will be committed to git in small, logical chunks. If issues arise:
1. Git revert to last working state
2. Restore original package.json
3. Restart Express server 