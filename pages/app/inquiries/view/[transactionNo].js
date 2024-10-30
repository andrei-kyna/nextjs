import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";


export default function InquiryDetails() {
  const router = useRouter();
  const { transactionNo } = router.query; // Extract the transactionNo from the URL

  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch inquiry details using the transactionNo
  const fetchInquiryDetails = useCallback(async () => {
    try {
      setLoading(true); // Set loading state
      const response = await fetch(`/api/inquiries/view/${transactionNo}`);

      if (!response.ok) {
        throw new Error(`Error fetching inquiry details: ${response.status}`);
      }

      const data = await response.json();
      setInquiry(data); // Set the inquiry details data
    } catch (err) {
      setError(err.message); // Set error state
    } finally {
      setLoading(false); // Always set loading to false after request
    }
  }, [transactionNo]); // Adding transactionNo as dependency

  // Call the fetch function when the transactionNo is available
  useEffect(() => {
    if (transactionNo) {
      fetchInquiryDetails();
    }
  }, [transactionNo, fetchInquiryDetails]); // Adding fetchInquiryDetails as dependency

  // Navigate back to the inquiries list
  const handleGoBack = () => {
    router.push("/app/inquiries"); // Redirect to the inquiries list page
  };

  // Render loading message
  if (loading) {
    return <div className="text-center mt-24">Loading inquiry details...</div>;
  }

  // Render error message
  if (error) {
    return <div className="text-center mt-24 text-red-500">Error: {error}</div>;
  }

  // Render inquiry details when data is available
  return (
    <div style={pageStyles}>
      <h1 style={inquiryTitleStyles}>
        Inquiry Details
      </h1>
      <Button 
        className="bg-[#333] hover:bg-[#444] rounded" 
        onClick={handleGoBack}
        style={backButtonStyles}>
          ← Back to Inquiries
      </Button>
      <div style={containerStyles}>
        {inquiry && (
          <div style={inquiryDetailsStyles}>
            <h1><strong>Transaction No:</strong> {inquiry.transactionNo}</h1>
            <p><strong>First Name:</strong> {inquiry.firstName}</p>
            <p><strong>Last Name:</strong> {inquiry.lastName}</p>
            <p><strong>Contact No:</strong> {inquiry.contactNo}</p>
            <p><strong>Email Address:</strong> {inquiry.emailAddress}</p>
            <p><strong>Subject:</strong> {inquiry.subject}</p>
            <p><strong>Message:</strong> {inquiry.message}</p>
            <p><strong>Status:</strong> {inquiry.status}</p>
            <p><strong>Created:</strong> {new Date(inquiry.created).toLocaleString()}</p>
            <p><strong>Modified:</strong> {new Date(inquiry.modified).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles for the Inquiry Details page
const pageStyles = {
  backgroundColor: '#fff',
  width: '225vh',
  minHeight: '100vh',
  color: '#000',
  padding: '20px',
  position: 'relative', // Relative position for absolute positioning of the button
};

const inquiryTitleStyles = {
  fontSize: '4rem',
  textTransform: 'uppercase',
  marginTop: '80px',
  color: '#000',
  textAlign: 'center',
};

const containerStyles = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: '20px',
};

const backButtonStyles = {
  position: 'absolute',
  top: '60px', // Position it 20px from the top
  right: '20px', // Position it 20px from the right side
  backgroundColor: '#1F2937',
  color: '#fff',
  padding: '10px 15px',
  borderRadius: '5px',
  cursor: 'pointer',
  textDecoration: 'none',
  border: 'none',
};

const inquiryDetailsStyles = {
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '10px',
  border: '1px solid black',
  maxWidth: '800px',
  width: '100%',
  color: '#000',
};
