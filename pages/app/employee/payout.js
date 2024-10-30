import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { Formik, Form, ErrorMessage } from 'formik';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { DatePickerWithRange } from '@/components/ui/date-range';
import { payoutFormSchema } from "@/utils/validation-schema";
import { useRouter } from 'next/router';

export default function Payout() {
  const { data: session } = useSession();
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('payRate'); 
  const router = useRouter();

  useEffect(() => {
    if (router.pathname === '/app/employee') {
      setActiveSection('payRate');
    } else if (router.pathname === '/app/employee/payout') {
      setActiveSection('payout');
    }
  }, [router.pathname]); 

  // Function to fetch payment records based on selected payout options
  const fetchPaymentRecords = useCallback(async (payoutMethod, payoutFrequency, dateRange) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/employee/get-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutMethod,
          payoutFrequency,
          dateRange,
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Merge the `groupedRecords` with actual `paymentRecords` ID references
        const groupedRecordsWithIds = data.groupedRecords.map((group, index) => ({
          ...group,
          paymentRecordIds: data.paymentRecords.map(record => record.id) // Collect all IDs
        }));
  
        setPaymentRecords(groupedRecordsWithIds);
        console.log("Fetched Payment Records:", groupedRecordsWithIds);
      } else {
        console.error('Error fetching payment records:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  

  const markAsPaid = async () => {
    const recordIds = paymentRecords.flatMap(record => record.paymentRecordIds || []);
  
    console.log("Record IDs to mark as paid:", recordIds); // Log filtered IDs for verification
  
    if (recordIds.length === 0) {
      console.warn("No valid record IDs to mark as paid.");
      return;
    }
  
    try {
      const response = await fetch('/api/employee/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: recordIds }),
      });
  
      if (response.ok) {
        console.log("Successfully marked records as paid.");
        setPaymentRecords(prevRecords => 
          prevRecords.map(record => ({ ...record, status: 'Paid' }))
        );
      } else {
        console.error('Error marking records as paid:', response.statusText);
      }
    } catch (error) {
      console.error('Error marking records as paid:', error);
    }
  };

  // UI Design
  return (
    <div className="flex flex-col gap-8 mt-20 items-center">
      <div className="flex flex-col">
      <p className="text-[var(--grey-white)] text-center text-[3rem] font-[600] uppercase">
      Employee: {session ? session.user.username : "Guest"}
      </p>
        </div>

        {/* Navigation for Pay rate and payout */}
        <div className="flex gap-10 mb-5 item center">
          <h2
            className={`cursor-pointer text-[1.5rem] text-center font-semibold ${activeSection === 'payRate' ? 'underline' : ''}`}
            onClick={() => {
              setActiveSection('payRate');
              router.push('/app/employee'); 
            }}
          >
            Pay Rate
          </h2>
          <h2
            className={`cursor-pointer text-[1.5rem] font-semibold text-center ${activeSection === 'payout' ? 'underline' : ''}`}
            onClick={() => {
              setActiveSection('payout');
              router.push('/app/employee/payout'); 
            }}
          >
            Payout
          </h2>
        </div>
      

      {/* Pay Rate Section */}
      <div className="flex flex-col gap-5 bg-background min-w-[65rem] min-h-[20rem] p-10 rounded-xl border-[1px] border-zinc-700 space-y-4">
        <div className='flex flex-row gap-10 items-start justify-between'>
          <div className='flex flex-col gap-7'>
            <div className="flex flex-col">
              <h1 className="text-left text-xl font-semibold text-balance">
                Set payout schedule.
              </h1>
              <p className="text-gray-600">Select a method to set the payout schedule</p>
            </div>
            {/* Formik Form for Payout Options */}
            <Formik
              initialValues={{
                payoutMethod: '',
                payoutFrequency: '',
                dateRange: { startDate: '', endDate: '' },
              }}
              validationSchema={payoutFormSchema}
              validate={(values) => {
                const errors = {};
            
                if (values.payoutMethod === 'Automatic' && !values.payoutFrequency) {
                  errors.payoutFrequency = 'Please select a payout frequency';
                }
                
                if (values.payoutMethod === 'Manual') {
                  if (!values.dateRange.startDate) {
                    errors.dateRange = errors.dateRange || {};
                    errors.dateRange.startDate = 'Start date is required';
                  }
                  if (!values.dateRange.endDate) {
                    errors.dateRange = errors.dateRange || {};
                    errors.dateRange.endDate = 'End date is required';
                  } else if (values.dateRange.startDate && values.dateRange.endDate < values.dateRange.startDate) {
                    errors.dateRange = errors.dateRange || {};
                    errors.dateRange.endDate = 'End date must be after start date';
                  }
                }
                console.log("Validation errors:", errors);
                return errors;
              }}
              onSubmit={(values) => {
                if (values.payoutMethod === 'Manual') {
                  console.log("Manual Submission Data:", {
                    payoutMethod: values.payoutMethod,
                    dateRange: values.dateRange,
                  });
                }
                
                // This logs for all submissions regardless of method
                console.log("Form is submitting with values:", values);
                const { payoutMethod, payoutFrequency, dateRange } = values;
                fetchPaymentRecords(payoutMethod, payoutFrequency, dateRange);
              }}
            >
              {({ values, setFieldValue }) => (
                <Form className="flex flex-col gap-10">
                  <div className='flex flex-col gap-3'>

                    {/* Select Payout Method */}
                    <Select value={values.payoutMethod} onValueChange={(value) => setFieldValue('payoutMethod', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Payout Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Automatic">Automatic</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="payoutMethod" component="div" className="text-red-500 text-sm" />
                  </div>
                  
                  {/* Conditional Rendering Based on Selected Payout Method */}
                  {values.payoutMethod === 'Automatic' && (
                    <div className='flex flex-col gap-5'>
                      <div className='flex flex-col gap-2'>
                        <h1>Choose a Payout Interval</h1>
                        <Select value={values.payoutFrequency} onValueChange={(value) => setFieldValue('payoutFrequency', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a Payout Interval" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Daily">Daily</SelectItem>
                            <SelectItem value="Bi-Monthly">Bi-Monthly</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <ErrorMessage name="payoutFrequency" component="div" className="text-red-500 text-sm" />
                      </div>
                    </div>
                  )}

                  {values.payoutMethod === 'Manual' && (
                    <div className='flex flex-col gap-2'>
                      <h1>Choose a Start Date and End Date</h1>
                      <DatePickerWithRange
                        value={values.dateRange}
                        onChange={(range) => {
                        console.log("Selected Date Range:", range); // Log the selected range
                        setFieldValue('dateRange', range);
                      }}/>
                      <div className='flex flex-row gap-3'>
                        <ErrorMessage name="dateRange.startDate" component="div" className="text-red-500 text-sm" />
                        <ErrorMessage name="dateRange.endDate" component="div" className="text-red-500 text-sm" />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button type="submit">
                   Submit
                  </Button>
                </Form>
              )}
            </Formik>
          </div>

          {/* Payout Records */}
          <div className='flex flex-col min-w-96 gap-2'>
            <div className="flex flex-row justify-between items-center">
              <h1 className="text-left text-xl font-semibold text-balance">Payout Records</h1>
            </div>
            <div className="flex flex-col gap-7">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-36">Payroll Amount</TableHead>
                    <TableHead className="min-w-36">Duration</TableHead>
                    <TableHead className="min-w-36">Date</TableHead>
                    <TableHead className="min-w-36">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan="4" className="text-center py-10">Loading...</TableCell>
                    </TableRow>
                  ) : paymentRecords.length > 0 ? (
                    paymentRecords.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell>${record.payAmount.toFixed(2)}</TableCell>                       
                        <TableCell>{record.duration
                        ? `${Math.floor(record.duration)} hrs${
                        record.duration % 1 !== 0 ? ` and ${Math.round((record.duration % 1) * 60)} minutes` : ""
                        }` : 'N/A'}
                        </TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.status}</TableCell> 
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan="4" className="text-center py-10">No payouts have been made.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}