#!/bin/bash

# Fix broken .pkpass files by removing extra files not in manifest.json
# Issue: ios_production.pkpass and working_enhanced.pkpass have extra @2x/@3x files
# that are not listed in manifest.json, causing Apple Wallet to reject them

set -e

echo "🔧 Fixing broken PKPass files with extra unlisted files..."

# Files to fix
BROKEN_FILES=(
    "public/ios_production.pkpass"
    "public/working_enhanced.pkpass"
)

# Create working directory
mkdir -p temp_fix_extra

for BROKEN_FILE in "${BROKEN_FILES[@]}"; do
    echo "🔨 Fixing $BROKEN_FILE..."
    
    # Get filename without path and extension
    FILENAME=$(basename "$BROKEN_FILE" .pkpass)
    
    # Create temp directory for this file
    mkdir -p "temp_fix_extra/$FILENAME"
    
    # Extract broken file
    unzip -o "$BROKEN_FILE" -d "temp_fix_extra/$FILENAME/"
    
    echo "   Original files:"
    ls -la "temp_fix_extra/$FILENAME/"
    
    # Remove extra files that are NOT in manifest.json
    # Only keep: pass.json, manifest.json, signature, icon.png, logo.png
    cd "temp_fix_extra/$FILENAME"
    
    # Remove @2x and @3x variants (they're not in manifest.json)
    rm -f icon@2x.png icon@3x.png logo@2x.png logo@3x.png
    
    echo "   Files after cleanup:"
    ls -la .
    
    # Verify we have exactly the files listed in manifest.json
    echo "   Verifying manifest matches files..."
    if [ -f pass.json ] && [ -f manifest.json ] && [ -f signature ] && [ -f icon.png ] && [ -f logo.png ]; then
        echo "   ✅ All required files present"
    else
        echo "   ❌ Missing required files"
        exit 1
    fi
    
    # Create fixed .pkpass file
    zip -r "../../$BROKEN_FILE" .
    cd ../..
    
    echo "✅ Fixed $BROKEN_FILE"
done

# Cleanup
rm -rf temp_fix_extra

echo "🎉 All broken PKPass files fixed!"
echo ""
echo "Issues fixed:"
echo "  - ios_production.pkpass: Removed extra @2x/@3x image files not in manifest"
echo "  - working_enhanced.pkpass: Removed extra @2x/@3x image files not in manifest"
echo ""
echo "🧪 Test by opening these files in Safari on iOS:"
echo "  - Should now open directly in Apple Wallet"
echo "  - Should NOT show 'Safari cannot download this file'"
echo ""
echo "Root cause: Apple Wallet requires ALL files in .pkpass to be listed in manifest.json"
echo "Extra files (even valid images) will cause rejection if not in manifest." 