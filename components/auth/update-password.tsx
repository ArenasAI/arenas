"use client"

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, updatePasswordFormData } from '@/utils/form-schema'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<updatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema)
  })

  const onSubmit = async (data: updatePasswordFormData) => {
    try {
      setIsLoading(true)
      
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        throw error
      }

      toast.success('Password updated successfully')
      reset()
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full sm:w-[350px] mx-auto">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Update Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Input
            {...register('password')}
            type="password"
            placeholder="New password"
            disabled={isLoading}
            className={errors.password ? 'border-red-500' : ''}
          />
          {errors.password && (
            <p className="text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Input
            {...register('confirmPassword')}
            type="password"
            placeholder="Confirm new password"
            disabled={isLoading}
            className={errors.confirmPassword ? 'border-red-500' : ''}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </Button>
      </form>

      {/* Optional security notice */}
      <p className="text-xs text-muted-foreground text-center">
        Make sure your new password is at least 6 characters long and contains a mix of characters
      </p>
    </div>
  )
}


