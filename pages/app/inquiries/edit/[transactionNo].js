import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useFormik } from "formik";
import { contactFormSchema } from "@/utils/validation-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Assuming Select component exists in Shadcn

// Styles
const pageStyles = {
    backgroundColor: '#fff',
    width: '100vw',  // Set width to full viewport width
    minHeight: '100vh',
    color: '#000',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'center',
    position: 'relative', // To position the button relative to this container
};

const formStyles = {
    backgroundColor: '#fff',
    minWidth: '35rem',
    maxWidth: '35rem',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid black',
    margin: '20px auto',
    position: 'relative',
};

const titleContainerStyles = {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
};

const titleStyles = {
    fontSize: '5rem',
    textTransform: 'uppercase',
    marginTop: '20px',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
};

// Updated button styles
const buttonStyles = {
  position: 'absolute',
  top: '60px', // Position it 20px from the top
  right: '20px', // Position it 20px from the right side
  backgroundColor: '#28A745',
  color: '#fff',
  padding: '10px 15px',
  borderRadius: '5px',
  cursor: 'pointer',
  textDecoration: 'none',
  border: 'none',
};

export default function EditInquiry() {
    const router = useRouter();
    const { transactionNo } = router.query;

    const [inquiry, setInquiry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formStatus, setFormStatus] = useState(null);

    // Fetch inquiry details by transactionNo
    const fetchInquiryDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/inquiries/view/${transactionNo}`);
            if (!response.ok) {
                throw new Error(`Error fetching inquiry details: ${response.status}`);
            }
            const data = await response.json();
            setInquiry(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [transactionNo]); // useCallback to memoize and avoid unnecessary re-creation

    // Call fetch function when transactionNo is available
    useEffect(() => {
        if (transactionNo) {
            fetchInquiryDetails();
        }
    }, [transactionNo, fetchInquiryDetails]); // Added fetchInquiryDetails to the dependency array

    const handleGoBack = () => {
        router.push("/app/inquiries");  // Redirect to the inquiries list page
    };

    // Handle form submission
    const formik = useFormik({
        enableReinitialize: true, // Allow form to be reinitialized with fetched data
        initialValues: {
            firstName: inquiry?.firstName || "",
            lastName: inquiry?.lastName || "",
            contactNo: inquiry?.contactNo || "",
            emailAddress: inquiry?.emailAddress || "",
            subject: inquiry?.subject || "",
            message: inquiry?.message || "",
            status: inquiry?.status || "pending", // Default to pending
        },
        validationSchema: contactFormSchema,
        onSubmit: async (values) => {
            try {
                const res = await fetch(`/api/inquiries/manage`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(values),
                });
                if (res.ok) {
                    setFormStatus('Inquiry updated successfully.');
                } else {
                    setFormStatus('Failed to update inquiry.');
                }
            } catch (error) {
                setFormStatus('An error occurred. Please try again.');
            }
        }
    });

    if (loading) {
        return <div className="text-center mt-24">Loading inquiry details...</div>;
    }

    if (error) {
        return <div className="text-center mt-24 text-red-500">Error: {error}</div>;
    }

    return (
        <div style={pageStyles}>
            {/* Title Container */}
            <div style={titleContainerStyles}>
                <h1 style={titleStyles}>Edit Inquiry</h1>
            </div>

            {/* Form Container */}
            <div className="mt-5 flex flex-col items-center gap-3">
                <form onSubmit={formik.handleSubmit} style={formStyles} className="space-y-4 relative">
                    {/* Form Fields */}
                    {['firstName', 'lastName', 'contactNo', 'emailAddress', 'subject', 'message'].map((field, index) => (
                        <div key={index}>
                            {field === 'message' ? (
                                <Textarea
                                    id={field}
                                    name={field}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values[field]}
                                    placeholder="Your message"
                                    className="rounded bg-[#fff] text-[#000] placeholder-black focus-visible:ring-2 focus-visible:ring-[#000]"
                                />
                            ) : (
                                <Input
                                    id={field}
                                    name={field}
                                    type={field === 'emailAddress' ? 'email' : 'text'}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values[field]}
                                    placeholder={field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                                    className="rounded bg-[#fff] text-[#000] placeholder-gray-500 focus-visible:ring-2 focus-visible:ring-[#000]"
                                />
                            )}
                            {formik.touched[field] && formik.errors[field] && (
                                <p className="text-red-500">{formik.errors[field]}</p>
                            )}
                        </div>
                    ))}
                    
                    {/* Status Select */}
                    <div>
                        <Select onValueChange={(value) => formik.setFieldValue("status", value)} value={formik.values.status}>
                            <SelectTrigger className="rounded bg-[#fff] text-[#000]">
                                <SelectValue placeholder="Select Status" className="text-black"/>
                            </SelectTrigger>
                            <SelectContent className="bg-[#fff] rounded">
                                <SelectItem className="hover:bg-[#fff] text-black" value="Pending">Pending</SelectItem>
                                <SelectItem className="hover:bg-[#fff] text-black" value="Read">Read</SelectItem>
                            </SelectContent>
                        </Select>
                        {formik.touched.status && formik.errors.status && (
                            <p className="text-red-500">{formik.errors.status}</p>
                        )}
                    </div>
                    
                    {/* Submit Button */}
                    <Button className="w-full bg-green-600 hover:bg-green-500 rounded" type="submit" disabled={formik.isSubmitting}>Update Inquiry</Button>
                    {formStatus && <p className="text-center">{formStatus}</p>}
                </form>
            </div>

            {/* Back to Inquiries Button */}
            <Button 
                onClick={handleGoBack} 
                style={buttonStyles}
            >
                ← Back to Inquiries
            </Button>
        </div>
    );
}
