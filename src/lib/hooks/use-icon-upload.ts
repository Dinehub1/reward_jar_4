'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'

interface IconUploadResult {
  url: string
  publicUrl: string
  path: string
}

interface IconUploadError {
  name: string
  message: string
}

interface UseIconUploadProps {
  bucketName?: string
  path?: string
  maxFileSize?: number
  maxFiles?: number
  allowedMimeTypes?: string[]
}

export function useIconUpload({
  bucketName = 'card-icons',
  path = 'business-icons',
  maxFileSize = 2 * 1024 * 1024, // 2MB
  maxFiles = 1,
  allowedMimeTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
}: UseIconUploadProps = {}) {
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [successes, setSuccesses] = useState<string[]>([])
  const [errors, setErrors] = useState<IconUploadError[]>([])
  const [uploadResults, setUploadResults] = useState<IconUploadResult[]>([])
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
    setIsSuccess(false)
    setErrors([])
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejectedErrors = rejectedFiles.map(({ file, errors }) => ({
        name: file.name,
        message: errors.map((e: any) => e.message).join(', ')
      }))
      setErrors(rejectedErrors)
    }
  }, [])

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: allowedMimeTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize,
    maxFiles,
    multiple: maxFiles > 1
  })

  const uploadIcon = useCallback(async (file: File): Promise<IconUploadResult> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${path}/${fileName}`

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      throw new Error(error.message)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    return {
      url: data.path,
      publicUrl: publicUrlData.publicUrl,
      path: filePath
    }
  }, [supabase, bucketName, path])

  const onUpload = useCallback(async () => {
    if (files.length === 0) return

    setLoading(true)
    setErrors([])
    setSuccesses([])
    setUploadResults([])

    try {
      const results = await Promise.allSettled(
        files.map(async (file) => {
          try {
            const result = await uploadIcon(file)
            setSuccesses(prev => [...prev, file.name])
            return result
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed'
            setErrors(prev => [...prev, { name: file.name, message: errorMessage }])
            throw error
          }
        })
      )

      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<IconUploadResult> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value)

      setUploadResults(successfulResults)
      
      if (successfulResults.length === files.length) {
        setIsSuccess(true)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setLoading(false)
    }
  }, [files, uploadIcon])

  const removeFile = useCallback((fileName: string) => {
    setFiles(files => files.filter(file => file.name !== fileName))
    setErrors(errors => errors.filter(error => error.name !== fileName))
    setSuccesses(successes => successes.filter(name => name !== fileName))
  }, [])

  const reset = useCallback(() => {
    setFiles([])
    setErrors([])
    setSuccesses([])
    setUploadResults([])
    setIsSuccess(false)
    setLoading(false)
  }, [])

  return {
    // Dropzone props
    getRootProps,
    getInputProps,
    inputRef,
    
    // State
    files,
    setFiles,
    loading,
    errors,
    successes,
    uploadResults,
    isSuccess,
    isDragActive,
    isDragReject,
    
    // Actions
    onUpload,
    removeFile,
    reset,
    
    // Config
    maxFileSize,
    maxFiles,
    allowedMimeTypes
  }
}