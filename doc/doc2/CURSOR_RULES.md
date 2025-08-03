# 🔧 FINAL SPEC: Cursor Prompting Guidelines - RewardJar 4.0

**Status**: ✅ **DOCUMENTATION STANDARD** - Enforces Consistent Style & Structure  
**Generated**: December 29, 2024  
**Purpose**: Unified documentation patterns and prompting guidelines  
**Scope**: All RewardJar 4.0 documentation files

⸻

## 📋 Documentation Standards

### File Header Format
All documentation files must follow this exact header pattern:

```markdown
# 🔧 FINAL SPEC: [Document Title] - RewardJar 4.0

**Status**: ✅ [STATUS_DESCRIPTION]  
**Generated**: December 29, 2024  
**[Additional_Context]**: [Value]  
**[Version/Architecture/Scope]**: [Details]

⸻
```

### Section Separator Rules
- **Primary Sections**: Use `⸻` (U+2E3B) for major section breaks
- **Subsections**: Use standard `###` heading hierarchy
- **Never Use**: `---` (triple dashes) for consistency with the new standard
- **Content Flow**: Each major section must be separated by the primary separator

### Heading Hierarchy
```markdown
## 🔧 Main Section (with emoji + descriptive title)
### Subsection Title (clean, descriptive)
#### Sub-subsection (when needed)
```

### Status & Quality Indicators
Use consistent status formatting:
- **✅ WORKING** - Functional features
- **⏳ PENDING** - In development
- **❌ DEPRECATED** - No longer used
- **🚨 CRITICAL** - Urgent attention needed
- **⚠️ WARNING** - Important notes

⸻

## 🎯 Content Structure Guidelines

### Technical Documentation Pattern
1. **Status Overview**: Clear project state and completion level
2. **Architecture**: High-level technical structure
3. **Implementation Details**: Specific code patterns and examples
4. **API Documentation**: Endpoints, parameters, responses
5. **Testing & Validation**: Verification procedures
6. **Troubleshooting**: Common issues and solutions

### Code Examples Format
```typescript
// ✅ CORRECT - Include context and explanation
import { use } from 'react'

export default function Component({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // ✅ Next.js 15+ - Unwrap params Promise
  const { id } = use(params)
  return <div>Component content</div>
}

// ❌ INCORRECT - Avoid outdated patterns
export default function Component({ params }: { params: { id: string } }) {
  const id = params.id // TypeError in Next.js 15+
}
```

### Table Formatting Standards
All tables must be properly aligned and complete:

| Category | Component | Status | Performance |
|----------|-----------|--------|-------------|
| **Feature Name** | Description | ✅ Working | Performance metric |
| **Feature Name** | Description | ⏳ Pending | Development status |

⸻

## 📝 Writing Style Guidelines

### Terminology Consistency
- **Admin Dashboard** (not "admin panel" or "admin interface")
- **Business Journey** (not "business workflow" or "business process")
- **Customer Cards** (unified term, not "loyalty cards" vs "membership cards")
- **Stamp Cards** vs **Membership Cards** (when distinguishing types)
- **API Endpoints** (not "API routes" unless specifically referring to Next.js files)
- **Service Role Key** (Supabase terminology, always emphasize security)

### Security Language Requirements
When documenting Supabase service role usage:
```markdown
**🚨 CRITICAL SECURITY NOTE**: `SUPABASE_SERVICE_ROLE_KEY` bypasses ALL security (RLS, auth, permissions) and must ONLY be used in server components and API routes. NEVER expose to client-side code.
```

### Next.js 15+ Compatibility Notes
Always include migration guidance:
```markdown
#### Next.js 15+ Compatibility
- **Route Params**: Now returned as Promises, must be unwrapped properly
- **Server Components**: Use `await params` to access route parameters
- **Client Components**: Use `React.use(params)` to access route parameters
```

⸻

## 🔍 Quality Assurance Standards

### Documentation Completeness Checklist
- [ ] Proper file header with status and metadata
- [ ] Section separators (`⸻`) used consistently
- [ ] All code examples include context and explanations
- [ ] Security notes included where relevant
- [ ] Next.js 15+ compatibility addressed
- [ ] Consistent terminology throughout
- [ ] No broken internal references
- [ ] All tables properly formatted
- [ ] Status indicators accurate and current

### Review Process
1. **Technical Accuracy**: All code examples must be tested and verified
2. **Style Consistency**: Headers, formatting, and terminology aligned
3. **Completeness**: No missing sections or incomplete information
4. **Security Review**: Service role usage properly documented
5. **Performance Notes**: Include relevant metrics and benchmarks

⸻

## 🚀 Prompting Best Practices

### Effective Cursor Prompts
```markdown
Update the [specific_file.md] to align with the RewardJar 4.0 documentation standards:
1. Apply consistent header format with status and metadata
2. Replace all `---` section breaks with `⸻` 
3. Ensure Next.js 15+ compatibility notes are included
4. Verify security documentation for service role usage
5. Standardize terminology according to the style guide
6. Add missing status indicators and quality metrics
```

### Prompt Structure for Documentation Updates
1. **Clear Objective**: Specify what needs to be updated
2. **File Scope**: List specific files or sections
3. **Style Requirements**: Reference the documentation standards
4. **Technical Focus**: Highlight critical areas (security, compatibility)
5. **Quality Gates**: Include verification steps

### Avoiding Common Mistakes
- **Don't**: Mix documentation styles within a single file
- **Don't**: Use outdated Next.js patterns without migration notes
- **Don't**: Reference service role keys without security warnings
- **Don't**: Create incomplete API documentation
- **Do**: Include working code examples with context
- **Do**: Maintain consistent section hierarchy
- **Do**: Provide clear status indicators

⸻

## 📊 Documentation Metrics

### Quality Indicators
- **Completeness**: 100% sections documented
- **Accuracy**: All code examples tested and verified
- **Consistency**: Unified terminology and formatting
- **Security**: All sensitive operations properly documented
- **Performance**: Relevant metrics and benchmarks included

### Maintenance Schedule
- **Weekly**: Review for accuracy and completeness
- **Per Feature**: Update affected documentation
- **Per Release**: Comprehensive review and validation
- **Security Updates**: Immediate review of all affected docs

⸻

## 🔧 Implementation Guidelines

### For New Documentation
1. Start with the standard header template
2. Use the prescribed section hierarchy
3. Include relevant code examples with explanations
4. Add security notes where applicable
5. Verify all technical details
6. Apply consistent formatting throughout

### For Documentation Updates
1. Audit existing content for compliance
2. Update headers to match the standard
3. Replace section separators consistently
4. Verify technical accuracy
5. Update terminology to match the style guide
6. Add missing quality indicators

### For Review and Maintenance
1. Check header format and metadata accuracy
2. Verify section separator consistency
3. Validate all code examples
4. Ensure security documentation is complete
5. Confirm terminology alignment
6. Update status indicators as needed

⸻

**Status**: ✅ **READY FOR IMPLEMENTATION** - Complete documentation standard established for consistent, high-quality RewardJar 4.0 documentation across all files and future contributions.