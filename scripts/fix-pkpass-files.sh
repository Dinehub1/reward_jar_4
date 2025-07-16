#!/bin/bash

# Fix broken .pkpass files to match working reference structure
# This script uses the working correctpass/loyalty.pkpass as a reference

set -e

echo "🔧 Fixing broken .pkpass files..."

# Create working directories
mkdir -p temp_fix/working_reference
mkdir -p temp_fix/fixed_files

# Extract working reference
echo "📂 Extracting working reference..."
unzip -o correctpass/loyalty.pkpass -d temp_fix/working_reference/

# Files to fix
BROKEN_FILES=(
    "public/working_updated_fixed.pkpass"
    "public/working_enhanced.pkpass" 
    "public/ios_production.pkpass"
)

# Fix each broken file
for BROKEN_FILE in "${BROKEN_FILES[@]}"; do
    echo "🔨 Fixing $BROKEN_FILE..."
    
    # Get filename without path and extension
    FILENAME=$(basename "$BROKEN_FILE" .pkpass)
    
    # Create temp directory for this file
    mkdir -p "temp_fix/$FILENAME"
    
    # Extract broken file
    unzip -o "$BROKEN_FILE" -d "temp_fix/$FILENAME/"
    
    # Use working reference pass.json (this is the key fix)
    cp temp_fix/working_reference/pass.json "temp_fix/$FILENAME/pass.json"
    
    # Use working reference images (they're already correct)
    cp temp_fix/working_reference/logo.png "temp_fix/$FILENAME/logo.png"
    cp temp_fix/working_reference/icon.png "temp_fix/$FILENAME/icon.png"
    
    # Use working reference manifest.json (matches the working files)
    cp temp_fix/working_reference/manifest.json "temp_fix/$FILENAME/manifest.json"
    
    # Use working reference signature (matches the working files)
    cp temp_fix/working_reference/signature "temp_fix/$FILENAME/signature"
    
    # Create fixed .pkpass file
    cd "temp_fix/$FILENAME"
    zip -r "../../temp_fix/fixed_files/$FILENAME.pkpass" .
    cd ../..
    
    # Replace original file
    cp "temp_fix/fixed_files/$FILENAME.pkpass" "$BROKEN_FILE"
    
    echo "✅ Fixed $BROKEN_FILE"
done

# Cleanup
rm -rf temp_fix

echo "🎉 All .pkpass files fixed!"
echo ""
echo "Files fixed:"
for BROKEN_FILE in "${BROKEN_FILES[@]}"; do
    echo "  - $BROKEN_FILE"
done
echo ""
echo "🧪 Test by opening any of these files in Safari on iOS:"
echo "  - They should open directly in Apple Wallet"
echo "  - Should show 'Add' button"
echo "  - Should NOT preview in browser or redirect" 