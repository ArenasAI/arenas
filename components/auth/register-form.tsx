'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { login, signInWithOAuth } from '@/app/(auth)/actions'
import { Button } from "@/components/ui/button"
import { zodResolver } from '@hookform/resolvers/zod';
import { Provider } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '../ui/form'
import { registerFormData, registerSchema } from '@/utils/form-schema'
import { GoogleLogoColored, GitHubLogo } from '../ui/icons'
import { useToggle } from 'usehooks-ts'
import { toast } from 'sonner';
import Link from 'next/link'
import { Checkbox } from '../ui/checkbox'


export function Register() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<registerFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleRegister = async (data: registerFormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("password", data.password);

      const response = await login(formData);
      if (response?.error) {
        setErrorMessage(response.error);
      } else {
        form.reset();
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false);
      }
    };

    const handleOAuthSignIn = async (provider: Provider) => {
      setErrorMessage(null);
      try {
        await signInWithOAuth(provider);
      } catch (error) {
        console.error(error)
        toast.error("An unexpected error occured, please try again")
      }
    };

    const [isPasswordVisible, togglePasswordVisibility] = useToggle(false);    

    return (
      <section className="relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="pb-12 pt-32 md:pb-20 md:pt-40">
            <div className="md: pb-17 mx-auto mx-w-3xl pb-10 text-center">
            <h1>Sign up with us!</h1>
            </div>

            <div className="mx-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOAuthSignIn("google");
              }}
            >
              <Button
                type="submit"
                size="lg"
                variant="authgroup"
                className="relative flex w-full items-center rounded-md px-0"
              >
                <GoogleLogoColored className="text-white mx-1 h-4 w-4 shrink-0" />
                <span className="">Sign in with Google</span>
              </Button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleOAuthSignIn("github");
              }}
            >
              <div className="-mx-3 flex flex-wrap">
                <div className="mt-3 w-full px-3">
                  <Button
                    type="submit"
                    size="lg"
                    variant="authgroup"
                    className="relative flex w-full items-center rounded-md px-0"
                  >
                    <GitHubLogo className="mx-1 h-4 w-4 shrink-0 text-gray-700" />
                    <span className="">Sign in with GitHub</span>
                  </Button>
                </div>
              </div>
            </form>


          <div className="my-6 flex items-center">
              <div
                className="mr-3 grow border-t border-dotted border-gray-400"
                aria-hidden="true"
              />
              <div className="text-gray-400">Or, sign in with your email</div>
              <div
                className="ml-3 grow border-t border-dotted border-gray-400"
                aria-hidden="true"
              />
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleRegister)}
                className="space-y-4"
              >
                <FormField
                  name="email"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="email">Email</FormLabel>
                      <FormControl>
                        <Input
                          id="email"
                          type="email"
                          placeholder="helloworld@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  name="password"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="password">Password</FormLabel>
                      <FormControl>
                        <Input
                          id="password"
                          type={isPasswordVisible ? "text" : "password"}
                          placeholder="********"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Label className="flex items-center">
                  <Checkbox
                    className="rounded"
                    checked={isPasswordVisible}
                    onCheckedChange={togglePasswordVisibility}
                  />
                  <span className="ml-2 cursor-pointer text-gray-600">
                    Show Password
                  </span>
                </Label>
                <div className="flex justify-between">
                  <Label className="flex items-center">
                    <Checkbox className="rounded" />
                    <span className="ml-2 cursor-pointer text-gray-600">
                      Keep me signed in
                    </span>
                  </Label>
                  <Link
                    href="/reset-password"
                    className="text-gray-600 transition duration-150 ease-in-out"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-md"
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </Button>

                {errorMessage && (
                  <p className="text-center text-red-500">{errorMessage}</p>
                )}
              </form>
            </Form>

            <div className="mt-6 text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-gray-800 transition duration-150 ease-in-out hover:text-primary-800"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
      </section>

    )
}
