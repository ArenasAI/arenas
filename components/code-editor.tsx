'use client';

import { useCallback, useRef, useState } from 'react'
import { Editor, OnValidate, OnMount } from '@monaco-editor/react'
import { editor } from 'monaco-editor'
import { Button } from './ui/button'
import { toast } from 'sonner'

interface CodeEditorProps {
  initialValue: string;
  language: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

interface EditorError {
  message: string;
  lineNumber: number;
  column: number;
}

export function CodeEditor({
  initialValue,
  language,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const [value, setValue] = useState(initialValue)
  const [errors, setErrors] = useState<EditorError[]>([])
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount: OnMount = useCallback((editor) => {
    editorRef.current = editor
  }, [])

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setValue(value)
      onChange?.(value)
    }
  }, [onChange])

  const handleEditorValidation: OnValidate = useCallback((markers) => {
    setErrors(markers.map(marker => ({
      message: marker.message,
      lineNumber: marker.startLineNumber,
      column: marker.startColumn
    })))
  }, [])

  const handleFormat = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run()
      toast.success('Code formatted successfully')
    }
  }, [])

  return (
    <div className="relative w-full">
      <div className="absolute right-2 top-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleFormat}
          disabled={readOnly}
        >
          Format
        </Button>
      </div>
      <Editor
        height="500px"
        defaultLanguage={language}
        defaultValue={initialValue}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        onValidate={handleEditorValidation}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          readOnly,
          automaticLayout: true,
        }}
      />
      {errors.length > 0 && (
        <div className="mt-2 text-sm text-red-500">
          {errors.map((error, index) => (
            <div key={index}>
              Line {error.lineNumber}: {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
