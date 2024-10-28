import { useFormik } from 'formik';
import { contactFormSchema } from '../utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import NavBar from '@/components/ui/navBar';  


export default function Contact() {
  const [formStatus, setFormStatus] = useState(null);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      contactNo: '',
      emailAddress: '',
      subject: '',
      message: ''
    },
    validationSchema: contactFormSchema,
    onSubmit: async (values) => {
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });

        if (res.ok) {
          setFormStatus('Success! Your inquiry was submitted.');
          formik.resetForm(); // Reset form after successful submission
        } else {
          setFormStatus('Something went wrong. Please try again.');
        }
      } catch (error) {
        setFormStatus('An error occurred. Please try again.');
      }
    }
  });

  return (
    <div style={pageStyles}>
      <NavBar />
      
      {/* Contact Form Section */}
      <div className="flex flex-col gap-5" style={{ marginTop: '20px' }}>
        <h1 className="text-center" style={contactHeaderStyles}>Contact</h1>
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4" style={formStyles}>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            placeholder="First Name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.firstName}
            style={inputStyles}
          />
          {formik.touched.firstName && formik.errors.firstName && (
            <p className="text-red-500">{formik.errors.firstName}</p>
          )}

          <Input
            id="lastName"
            name="lastName"
            type="text"
            placeholder="Last Name"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.lastName}
            style={inputStyles}
          />
          {formik.touched.lastName && formik.errors.lastName && (
            <p className="text-red-500">{formik.errors.lastName}</p>
          )}

          <Input
            id="contactNo"
            name="contactNo"
            type="tel"
            placeholder="Contact Number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.contactNo}
            style={inputStyles}
          />
          {formik.touched.contactNo && formik.errors.contactNo && (
            <p className="text-red-500">{formik.errors.contactNo}</p>
          )}

          <Input
            id="emailAddress"
            name="emailAddress"
            type="email"
            placeholder="Email Address"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.emailAddress}
            style={inputStyles}
          />
          {formik.touched.emailAddress && formik.errors.emailAddress && (
            <p className="text-red-500">{formik.errors.emailAddress}</p>
          )}

          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder="Subject"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.subject}
            style={inputStyles}
          />
          {formik.touched.subject && formik.errors.subject && (
            <p className="text-red-500">{formik.errors.subject}</p>
          )}

          <Textarea
            id="message"
            name="message"
            placeholder="Your Message"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.message}
            style={textareaStyles}
          />
          {formik.touched.message && formik.errors.message && (
            <p className="text-red-500">{formik.errors.message}</p>
          )}

          <Button type="submit" disabled={formik.isSubmitting} style={buttonStyles}>
            Submit
          </Button>
          {formStatus && <p style={statusStyles}>{formStatus}</p>}
        </form>
      </div>
    </div>
  );
}


// Styles
const pageStyles = {
  backgroundColor: '#fff',
  width: '225vh',   
  height: '150vh',           
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}
const contactHeaderStyles = {
  fontSize: '5rem',
  textTransform: 'uppercase',
  marginTop: '24px',
  color: '#000', 
};

const formStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  maxWidth: '500px',
  margin: 'auto',
};

const inputStyles = {
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#fff', 
  color: '#000', 
};

const textareaStyles = {
  padding: '12px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#fff', 
  color: '#000', 
  height: '150px',
};

const buttonStyles = {
  backgroundColor: '#28A745', 
  color: '#fff',              
  border: 'none',              
  padding: '10px 20px',       
  fontSize: '16px',            
  borderRadius: '5px',        
};
const statusStyles = {
  textAlign: 'center',
  marginTop: '16px',
  color: '#28A745',
};
