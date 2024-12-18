import React, { useState } from 'react';
import { useFormik } from 'formik';
import { loginFormSchema } from '@/utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/router'; 
import { signIn } from 'next-auth/react'; 
import NavBar from '@/components/ui/navBar'; 
import Link from 'next/link';

// Page container style
const pageStyles = {
  backgroundColor: '#fff', // Background color
  width: '225vh',
  minHeight: '100vh',
  color: '#fff',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
};

// Form container style
const formStyles = {
  backgroundColor: '#fff', // Form background color
  minWidth: '35rem',
  maxWidth: '35rem',
  padding: '2rem',
  borderRadius: '12px',
  border: '1px solid black', // Border color
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)', // Shadow for depth
};

export default function Login() {
  const [formStatus, setFormStatus] = useState(null);
  const router = useRouter(); // Initialize router for redirection

  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema: loginFormSchema,
    onSubmit: async (values) => {
      try {
        // Call the manage API with the read action for login
        const res = await fetch('/api/auth/manage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'read',
            username: values.username,
            password: values.password
          }),
        });

        const data = await res.json();

        if (res.ok) {
          // Sign the user in using NextAuth if login was successful
          const signInResponse = await signIn('credentials', {
            redirect: false, // No auto-redirect
            username: values.username,
            password: values.password,
          });

          if (signInResponse.ok) {
            // Redirect the user to the homepage
            router.push('/');
          } else {
            setFormStatus('Login failed. Please try again.'); // Display error if NextAuth signIn failed
          }
        } else {
          // Set form status based on the API response
          setFormStatus(data.message || 'Login failed. Please try again.'); 
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div style={pageStyles}>
      <NavBar />
      <form onSubmit={formik.handleSubmit} style={formStyles}>
        <h1 className="text-center text-center text-[3rem] uppercase text-black">Login</h1>
        <p className="text-center mt-4 text-black">Don&#39;t have an account? <Link href="/account/register" style={{ color: '#000', textDecoration: 'underline' }}>Register</Link></p>

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
            className="rounded text-black focus-visible:ring-2 focus-visible:ring-[rgba(255, 255, 255, 0.5) p-2]"
          />
          {formik.touched.username && formik.errors.username && (
            <p className="text-red-500">{formik.errors.username}</p>
          )}
        </div>

        <div className="mb-4">
          <Input
            id="password"
            name="password"
            type="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
            placeholder="Password"
            className="rounded text-black focus-visible:ring-2 focus-visible:ring-[rgba(255, 255, 255, 0.5) p-2]"
          />
          {formik.touched.password && formik.errors.password && (
            <p className="text-red-500">{formik.errors.password}</p>
          )}
        </div>

        <Button className="w-full bg-gray-800 hover:bg-gray-700 rounded p-2" type="submit" disabled={formik.isSubmitting}>Login</Button>
        
        {formStatus && <p className='text-center'>{formStatus}</p>}
      </form>
    </div>
  );
}
