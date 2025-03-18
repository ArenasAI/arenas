"use client"

import Link from 'next/link'
import { useState } from 'react'
import { resetPassword } from '@/app/(auth)/actions'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, resetPasswordFormData } from '@/utils/form-schema'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<resetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmit = async (data: resetPasswordFormData) => {
    try {
      setIsLoading(true)
      const formData = new FormData()
      formData.append('email', data.email)
      
      const result = await resetPassword(formData)

      if (result?.error) {
        throw new Error(result.error)
      }

      toast.success('Password reset link sent to your email')
      reset() // Clear form
    } catch (error) {
      toast.error('Failed to send reset link')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset Password
        </h1>
        <p className="text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Input
            {...register('email')}
            type="email"
            placeholder="name@example.com"
            disabled={isLoading}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link 
          href="/login"
          className="hover:text-primary underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}
