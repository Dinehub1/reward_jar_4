# DEPRECATED ENDPOINT

**Endpoint**: `/api/admin/cards-data`  
**Deprecation Date**: January 2, 2025  
**Reason**: Replaced by unified `/api/admin/cards` endpoint with enhanced data validation  
**Last Used Check**: No runtime references found in codebase (grep search completed)  
**Replacement**: Use `/api/admin/cards` for all card data operations  

## Migration Path
- Cards data validation now handled by unified `/api/admin/cards` endpoint
- Enhanced schema validation and type safety in replacement
- Better error handling and response format

## Safe for Removal
✅ No runtime references found  
✅ No imports in active code  
✅ Only documented in audit reports  
✅ Functionality replaced by better endpoint  

**Status**: Ready for removal in cleanup/admin-cleanup-wallet PR