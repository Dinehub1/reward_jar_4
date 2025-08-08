# DEPRECATED ENDPOINT

**Endpoint**: `/api/admin/cards-simple`  
**Deprecation Date**: January 2, 2025  
**Reason**: Replaced by unified `/api/admin/cards` endpoint with enhanced functionality  
**Last Used Check**: No runtime references found in codebase (grep search completed)  
**Replacement**: Use `/api/admin/cards` for all card operations  

## Migration Path
- All card creation flows now use the unified `/api/admin/cards` endpoint
- The cards-simple endpoint provided limited card data without full schema
- The new unified endpoint supports both stamp and membership cards

## Safe for Removal
✅ No runtime references found  
✅ No imports in active code  
✅ Only documented in audit reports  
✅ Functionality replaced by better endpoint  

**Status**: Ready for removal in cleanup/admin-cleanup-wallet PR