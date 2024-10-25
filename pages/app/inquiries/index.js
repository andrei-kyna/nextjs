import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import NavBar from '@/components/ui/navBar'; 
import routes from '@/routes';

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['400', '300'], 
});

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchInquiries = async () => {
    try {
      setLoading(true);  
      const response = await fetch("/api/inquiries");

      if (!response.ok) {
        throw new Error(`Error fetching inquiries: ${response.status}`);
      }

      const data = await response.json();
      setInquiries(data);  
    } 
    catch (err) {
      setError(err.message);  
    } 
    finally {
      setLoading(false);  
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleViewDetails = (transactionNo) => {
    router.push(routes.viewInquiries.replace("[transactionNo]", transactionNo));
  };
  const handleEditInquiry = (transactionNo) => {
    router.push(routes.editInquiries.replace("[transactionNo]", transactionNo));
  };


  if (loading) {
    return <div className="text-center mt-24">Loading inquiries...</div>;
  }

  if (error) {
    return <div className="text-center mt-24 text-red-500">Error: {error}</div>;
  }

  return (
    <div style={pageStyles}>
     <NavBar />
      <h1 className={`${poppins.className} text-center`} style={homepageTitleStyles}>
        Inquiries
      </h1>

      <div style={containerStyles}>
        <Table style={tableStyles}>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>First Name</TableHead>
              <TableHead>Last Name</TableHead>
              <TableHead>Contact No</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Transaction No</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Modified</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => (
              <TableRow key={inquiry.transactionNo}>
                <TableCell>{inquiry.id}</TableCell>
                <TableCell>{inquiry.firstName}</TableCell>
                <TableCell>{inquiry.lastName}</TableCell>
                <TableCell>{inquiry.contactNo}</TableCell>
                <TableCell>{inquiry.emailAddress}</TableCell>
                <TableCell>{inquiry.subject}</TableCell>
                <TableCell>{inquiry.message.length > 100 ? inquiry.message.substr(0, 100) + '...' : inquiry.message}</TableCell>
                <TableCell>{inquiry.status}</TableCell>
                <TableCell>{inquiry.transactionNo}</TableCell>
                <TableCell>{new Date(inquiry.created).toLocaleString()}</TableCell>
                <TableCell>{new Date(inquiry.modified).toLocaleString()}</TableCell>
                <TableCell style={actionCellStyles}>
                  <Button
                    style={buttonStyles}
                    onClick={() => handleViewDetails(inquiry.transactionNo)}
                  >
                    View Details
                  </Button>
                  <Button
                    style={{ ...buttonStyles, marginTop: '10px' }} // Space between buttons
                    onClick={() => handleEditInquiry(inquiry.transactionNo)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Styles for the Inquiries page
const pageStyles = {
  backgroundColor: '#fff', 
  minHeight: '100vh',
  color: '#000',
  padding: '20px',
};
const homepageTitleStyles = {
  fontSize: '5rem',      
  fontWeight: 900,       
  textTransform: 'uppercase', 
  marginTop: '80px',     
  color: '#000',         
  textAlign: 'center',
};

const containerStyles = {
  marginTop: '120px',  
  padding: '20px',  
  backgroundColor: '#fff',
  borderRadius: '8px',
  maxWidth: '100%',
  margin: '0 auto',
};

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse',
  border: '1px solid #fff',
};

const buttonStyles = {
  backgroundColor: '#28A745',
  color: '#fff',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  textAlign: 'center',
  display: 'block', // Ensures that buttons are block elements
  width: '100%',   // Makes the buttons take the full width of the cell
};

const actionCellStyles = {
  display: 'flex',
  flexDirection: 'column', // Stack buttons vertically
  alignItems: 'center',    // Center the buttons horizontally
};
