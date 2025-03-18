"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from "@/components/ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form'
import { updatePasswordSchema, updatePasswordFormData } from '@/utils/form-schema'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UpdatePasswordError {
  message: string;
  code?: string;
}

export function UpdatePasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<updatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const handleUpdatePassword = async (data: updatePasswordFormData) => {
    if (isLoading) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        setErrorMessage(error.message)
      } else {
        toast.success('Password updated successfully')
        router.push('/login')
      }
    } catch (error: unknown) {
      const updateError = error as UpdatePasswordError
      setErrorMessage(updateError.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md px-4 py-8 sm:px-6">
        <div className="text-center">
          <h1 className="mb-6 text-3xl font-bold tracking-tight">Update Password</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleUpdatePassword)} className="space-y-4">
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">New Password</FormLabel>
                  <FormControl>
                    <Input
                      id="password"
                      type="password"
                      placeholder="********"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="confirmPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="********"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-md"
              disabled={isLoading}
              isLoading={isLoading}
            >
              Update Password
            </Button>

            {errorMessage && (
              <p className="text-center text-red-500">{errorMessage}</p>
            )}
          </form>
        </Form>
      </div>
    </section>
  )
}


