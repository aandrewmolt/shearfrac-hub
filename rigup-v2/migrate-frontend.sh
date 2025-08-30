#!/bin/bash

# RigUp V2 Frontend Migration Script
# Copies the entire frontend to the new structure while preserving functionality

echo "🚀 Starting RigUp V2 Frontend Migration..."

# Set paths
CURRENT_DIR="/home/q/Downloads/well-rig-visualizer-main"
NEW_FRONTEND_DIR="/home/q/Downloads/well-rig-visualizer-main/rigup-v2/frontend"

# Create frontend directory if it doesn't exist
mkdir -p "$NEW_FRONTEND_DIR"

echo "📁 Copying frontend files..."

# Copy all frontend-related directories
cp -r "$CURRENT_DIR/src" "$NEW_FRONTEND_DIR/"
cp -r "$CURRENT_DIR/public" "$NEW_FRONTEND_DIR/"

# Copy configuration files
cp "$CURRENT_DIR/package.json" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/package-lock.json" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/tsconfig.json" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/tsconfig.node.json" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/vite.config.ts" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/tailwind.config.js" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/postcss.config.js" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/components.json" "$NEW_FRONTEND_DIR/"
cp "$CURRENT_DIR/.eslintrc.cjs" "$NEW_FRONTEND_DIR/" 2>/dev/null || true
cp "$CURRENT_DIR/index.html" "$NEW_FRONTEND_DIR/"

# Copy environment files
cp "$CURRENT_DIR/.env" "$NEW_FRONTEND_DIR/.env.example" 2>/dev/null || true
cp "$CURRENT_DIR/.env.local" "$NEW_FRONTEND_DIR/.env.local.example" 2>/dev/null || true

# Copy documentation
cp "$CURRENT_DIR/CLAUDE.md" "$NEW_FRONTEND_DIR/" 2>/dev/null || true
cp "$CURRENT_DIR/COMPREHENSIVE_APP_ANALYSIS.md" "$NEW_FRONTEND_DIR/" 2>/dev/null || true

echo "📝 Creating new package.json for frontend..."

# Update package.json to remove backend dependencies
cat > "$NEW_FRONTEND_DIR/package.json.new" << 'EOF'
{
  "name": "rigup-frontend",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit"
  },
EOF

# Append dependencies from original package.json
echo "  \"dependencies\": {" >> "$NEW_FRONTEND_DIR/package.json.new"
grep -A 1000 '"dependencies"' "$NEW_FRONTEND_DIR/package.json" | grep -B 1000 '},.*"devDependencies"' | tail -n +2 | head -n -1 >> "$NEW_FRONTEND_DIR/package.json.new" || true
echo "  }," >> "$NEW_FRONTEND_DIR/package.json.new"
echo "  \"devDependencies\": {" >> "$NEW_FRONTEND_DIR/package.json.new"
grep -A 1000 '"devDependencies"' "$NEW_FRONTEND_DIR/package.json" | tail -n +2 | sed 's/^}/  }/' >> "$NEW_FRONTEND_DIR/package.json.new" || true

echo "✅ Frontend migration complete!"
echo ""
echo "📋 Next steps:"
echo "1. cd rigup-v2/frontend"
echo "2. npm install"
echo "3. Update API endpoints in src/services/ to use new backend"
echo "4. npm run dev"