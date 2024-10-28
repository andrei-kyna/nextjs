import React, { useState } from 'react';
import { useFormik } from 'formik';
import { registerFormSchema } from '@/utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import NavBar from '@/components/ui/navBar';  
import Link from 'next/link';

export default function Register() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter(); // Initialize Next.js router for redirection

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      gender: '',
      username: '',
      password: '',
    },
    validationSchema: registerFormSchema, // Use registerFormSchema for validation
    onSubmit: async (values) => {
      try {
        // Add action: 'create' field
        const postData = {
          action: 'create',  // Specify this is a create action
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender,
          username: values.username,
          password: values.password,
        };

        // Call registration API
        const res = await fetch('/api/auth/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          // Auto-login the user after registration
          const signInResponse = await signIn('credentials', {
            redirect: false, // Do not redirect automatically
            username: values.username,
            password: values.password,
          });

          if (signInResponse.ok) {
            // Redirect to home page after successful login
            router.push('/');
          } else {
            setFormStatus('Registered, but could not log in automatically.');
          }
        } else {
          const errorData = await res.json();
          setFormStatus(errorData.message || 'Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  // Styles
  const pageStyles = {
    backgroundColor: '#fff', // Background color
    width: '225vh',
    minHeight: '100vh',
    color: '#000',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
  };

  const formStyles = {
    backgroundColor: '#fff', // Form background color
    minWidth: '35rem',
    maxWidth: '35rem',
    padding: '2rem',
    borderRadius: '12px',
    border: '1px solid black', // Border color
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)', // Shadow for depth
  };

  return (
    <div style={pageStyles}>
      <NavBar />
      <div style={formStyles} className="space-y-4">
        <h1 className="text-center text-black text-[3rem] uppercase">Registration</h1>
        <form onSubmit={formik.handleSubmit}>
          <p className="text-center text-black">Already have an account? <Link href="/account/login" className="text-black hover:underline">Login</Link></p>

          {/* First Name Input */}
          <div className="mb-4">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.firstName}
              placeholder="First Name"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white) p-2]"
            />
            {formik.touched.firstName && formik.errors.firstName && (
              <p className="text-red-500">{formik.errors.firstName}</p>
            )}
          </div>

          {/* Last Name Input */}
          <div className="mb-4">
            <Input
              id="lastName"
              name="lastName"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.lastName}
              placeholder="Last Name"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white) p-2]"
            />
            {formik.touched.lastName && formik.errors.lastName && (
              <p className="text-red-500">{formik.errors.lastName}</p>
            )}
          </div>

          {/* Gender Select Input */}
          <div className="mb-4">
            <Select onValueChange={(value) => formik.setFieldValue("gender", value)} value={formik.values.gender}>
              <SelectTrigger className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent className="bg-[#fff]  rounded">
                <SelectItem className="hover:bg-[#444] text-black" value="MALE">Male</SelectItem>
                <SelectItem className="hover:bg-[#444] text-black" value="FEMALE">Female</SelectItem>
                <SelectItem className="hover:bg-[#444] text-black" value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {formik.touched.gender && formik.errors.gender && (
              <p className="text-red-500">{formik.errors.gender}</p>
            )}
          </div>

          {/* Username Input */}
          <div className="mb-4">
            <Input
              id="username"
              name="username"
              type="text"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.username}
              placeholder="Username"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.username && formik.errors.username && (
              <p className="text-red-500">{formik.errors.username}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <Input
              id="password"
              name="password"
              type="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              placeholder="Password"
              className="rounded focus-visible:ring-2 focus-visible:ring-[var(--twentyfive-opacity-white)]"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500">{formik.errors.password}</p>
            )}
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-500 rounded p-2" type="submit" disabled={formik.isSubmitting}>
            Register
          </Button>

          {formStatus && <p className='text-center'>{formStatus}</p>}
        </form>
      </div>
    </div>
  );
}
