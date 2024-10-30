import { Formik, Form, ErrorMessage } from 'formik';
import { employeePayrateFormSchema } from '@/utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { useState, useEffect, useCallback} from 'react';
import { useSession } from "next-auth/react";
import { DatePicker } from '@/components/ui/date-picker';
import { useRouter } from 'next/router';

export default function Employee() {
  // State to handle form submission and button disable logic
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const { data: session } = useSession();
  const [filter, setFilter] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [initialPayRate, setInitialPayRate] = useState({
    payRate: '',
    payRateSchedule: '',
    effectiveDate: '',
  });
  const router = useRouter(); 
  const [activeSection, setActiveSection] = useState('payRate');
  
  const handleSubmit = async (values, { setSubmitting }) => {
    setIsSubmitting(true);
    try {
      console.log("Request JSON: ", JSON.stringify(values, null, 2));

      const response = await fetch('/api/employee/payroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), 
      });

      if (response.ok) {
        console.log('Payrate calculation successful');
        fetchPaymentRecords();
      } 
      else {
        console.error('Error calculating payrate');
      }
    } 
    catch (error) {
      console.error('Error submitting the form:', error);
    }
    setIsSubmitting(false);
    setSubmitting(false);
  };

  const fetchPaymentRecords = useCallback(async () => {
    setPaymentRecords([]); 
    
    try {
      const response = await fetch(`/api/employee/summary?filter=${filter}`);
      const data = await response.json();
      if (response.ok && data) {
        setInitialPayRate({
          payRate: data.payRate || '',
          payRateSchedule: data.payRateSchedule || '',
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : '',
        });
        setPaymentRecords(data.groupedRecords || []);  // Ensure groupedRecords is an array
      } 
      else {
        console.error('Error fetching payment records:', response.statusText);
      }
    } 
    catch (error) {
      console.error('Error fetching payment records:', error);
    }
    finally {
      setLoading(false);
     }
  }, [filter]);

  // Fetch Payment Records
  useEffect(() => {
    if (session) 
      fetchPaymentRecords();
  }, [session, filter, fetchPaymentRecords]);
  
  // UI Design
  return (
    <div className="flex flex-col gap-8 items-center min-h-screen bg-[#f5f5f5] text-black mt-20" style={{ width: '225vh' }}>
      <p className="text-[var(--grey-white)] text-center text-[3rem] font-[600] uppercase">
      Employee: {session ? session.user.username : "Guest"}
      </p>
      {/* Section Navigation */}
      <div className="flex gap-10 mb-5">
        <h2
          className={`cursor-pointer text-[1.5rem] font-semibold ${activeSection === 'payRate' ? 'underline' : ''}`}
          onClick={() => {
            setActiveSection('payRate');
            router.push('/app/employee'); 
          }}
        >
          Pay Rate
        </h2>
        <h2
          className={`cursor-pointer text-[1.5rem] font-semibold ${activeSection === 'payout' ? 'underline' : ''}`}
          onClick={() => {
            setActiveSection('payout');
            router.push('/app/employee/payout'); 
          }}
        >
          Payout
        </h2>
      </div>

      <div className="flex flex-row gap-10 w-full max-w-[80rem]">
        {/* Pay Rate Section */}
        {activeSection === 'payRate' && (
          <div className="flex flex-col gap-6 bg-white p-8 rounded-lg shadow-md border w-1/2">
            <h2 className="text-left text-[1.5rem] font-semibold text-black uppercase">
              Set Pay Rate
            </h2>
            <Formik
              initialValues={{
                payRate: '',
                payRateSchedule: '',
                effectiveDate: '',
              }}
              validationSchema={employeePayrateFormSchema}
              onSubmit={handleSubmit}
            >
              {({ handleSubmit, setFieldValue, values }) => (
                <Form onSubmit={handleSubmit} className="space-y-6">
                  {/* Pay Rate Input */}
                  <div className="flex flex-col gap-2">
                    <label htmlFor="payRate" className="text-gray-700">Pay Rate</label>
                    <Input
                      id="payRate"
                      name="payRate"
                      type="number"
                      placeholder="Enter Pay Rate"
                      value={values.payRate}
                      onChange={(e) => setFieldValue('payRate', Number(e.target.value))}
                      className="rounded border-gray-300"
                    />
                    <ErrorMessage name="payRate" component="div" className="text-red-500 text-sm" />
                  </div>

                  {/* Pay Rate Schedule */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-700">Pay Period</label>
                    <Select
                      value={values.payRateSchedule}
                      onValueChange={(value) => setFieldValue('payRateSchedule', value)}
                    >
                      <SelectTrigger className="rounded border-gray-300">
                        <SelectValue placeholder="Select Pay Period" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Hourly">Hourly</SelectItem>
                        <SelectItem value="Daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="payRateSchedule" component="div" className="text-red-500 text-sm" />
                  </div>

                  {/* Effective Date */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-700">Effective Date</label>
                    <DatePicker
                      date={values.effectiveDate}
                      onChange={(date) => setFieldValue('effectiveDate', date)}
                      className="rounded border-gray-300"
                    />
                    <ErrorMessage name="effectiveDate" component="div" className="text-red-500 text-sm" />
                  </div>

                  {/* Submit Button */}
                  <Button
                    className="w-full bg-gray-800 hover:bg-gray-700 rounded text-white py-2"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                </Form>
              )}
            </Formik>
          </div>
        )}

      {/* Payment Records */}
      <div className="flex flex-col w-1/2 bg-white p-8 rounded-lg shadow-md border">
          <div className="flex flex-row justify-between items-center mb-5">
            <h2 className="text-[1.5rem] font-semibold text-black uppercase">Payment Records</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded py-1 px-4">
                  Filter by:
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-4 bg-white rounded shadow border border-gray-300 space-y-2">
                <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded py-1 w-full" onClick={() => setFilter('daily')}>Daily</Button>
                <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded py-1 w-full" onClick={() => setFilter('weekly')}>Weekly</Button>
                <Button className="bg-gray-800 hover:bg-gray-700 text-white rounded py-1 w-full" onClick={() => setFilter('monthly')}>Monthly</Button>
              </PopoverContent>
            </Popover>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payroll Amount</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {paymentRecords.length > 0 ? (
                paymentRecords.map((record) => (
              <TableRow key={record.date}>
              <TableCell>${record.payAmount.toFixed(2)}</TableCell>
              <TableCell>{record.duration
                ? `${Math.floor(record.duration)} hrs${
                record.duration % 1 !== 0 ? ` and ${Math.round((record.duration % 1) * 60)} minutes` : ""
                }` : 'N/A'}
              </TableCell>
              <TableCell>{record.date}</TableCell>
              </TableRow>
              ))
            ) : (
            <TableRow>
                  <TableCell colSpan="3" className="text-center">No payment records found.</TableCell>
                </TableRow>
                )}  
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

