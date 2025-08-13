'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Upload, X, CheckCircle, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIconUpload } from '@/lib/hooks/use-icon-upload'
import { cn } from '@/lib/utils'

interface IconUploadProps {
  onIconUploaded?: (iconUrl: string, publicUrl: string) => void
  currentIcon?: string
  className?: string
  bucketName?: string
  path?: string
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function IconUpload({ 
  onIconUploaded, 
  currentIcon,
  className,
  bucketName = 'card-icons',
  path = 'business-icons'
}: IconUploadProps) {
  const {
    getRootProps,
    getInputProps,
    files,
    loading,
    errors,
    successes,
    uploadResults,
    isSuccess,
    isDragActive,
    isDragReject,
    onUpload,
    removeFile,
    reset,
    maxFileSize
  } = useIconUpload({
    bucketName,
    path,
    maxFiles: 1,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
  })

  const isActive = isDragActive
  const isInvalid = (isDragActive && isDragReject) || 
                   (errors.length > 0 && !isSuccess) ||
                   files.some(file => errors.some(error => error.name === file.name))

  // Handle successful upload
  React.useEffect(() => {
    if (isSuccess && uploadResults.length > 0) {
      const result = uploadResults[0]
      onIconUploaded?.(result.url, result.publicUrl)
    }
  }, [isSuccess, uploadResults, onIconUploaded])

  if (isSuccess && uploadResults.length > 0) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">Icon uploaded successfully!</p>
            <p className="text-xs text-green-700">Your custom icon is ready to use</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Upload Another
          </Button>
        </div>

        {/* Preview uploaded icon */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
            <img 
              src={uploadResults[0].publicUrl} 
              alt="Uploaded icon" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              Custom Icon
            </p>
            <p className="text-xs text-gray-500">
              Ready for use on cards
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
          'hover:border-gray-400 hover:bg-gray-50',
          isActive && 'border-blue-500 bg-blue-50',
          isInvalid && 'border-red-500 bg-red-50',
          loading && 'pointer-events-none opacity-60'
        )}
      >
        <input {...getInputProps()} />
        
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Uploading your icon...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isActive ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-2"
              >
                <Upload className="h-8 w-8 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Drop your icon here</p>
              </motion.div>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Drop an icon here, or <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, SVG, WebP up to {formatBytes(maxFileSize)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Current Icon Preview */}
      {currentIcon && !files.length && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
            <img 
              src={currentIcon} 
              alt="Current icon" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">Current Icon</p>
            <p className="text-xs text-gray-500">Upload a new one to replace</p>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => {
            const fileError = errors.find(e => e.name === file.name)
            const isUploaded = successes.includes(file.name)
            const preview = URL.createObjectURL(file)

            return (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="w-10 h-10 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                  <img 
                    src={preview} 
                    alt={file.name}
                    className="w-full h-full object-cover"
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  {fileError ? (
                    <p className="text-xs text-red-600">{fileError.message}</p>
                  ) : loading && !isUploaded ? (
                    <p className="text-xs text-blue-600">Uploading...</p>
                  ) : isUploaded ? (
                    <p className="text-xs text-green-600">Upload complete</p>
                  ) : (
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  )}
                </div>

                {!loading && !isUploaded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.name)}
                    className="shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            )
          })}

          {/* Upload Button */}
          {files.length > 0 && !loading && !isSuccess && (
            <Button
              onClick={onUpload}
              disabled={files.some(file => errors.some(error => error.name === file.name))}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Icon{files.length > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}

      {/* Error Display */}
      {errors.length > 0 && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-medium text-red-900 mb-1">Upload Error</p>
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-red-700">
              {error.name}: {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}