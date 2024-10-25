import { Formik, Form, ErrorMessage } from 'formik';
import { employeePayrateFormSchema } from '@/utils/validation-schema';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Poppins } from 'next/font/google';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { DatePicker } from '@/components/ui/date-picker';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '300'],
});

export default function Employee() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const { data: session } = useSession();
  const [filter, setFilter] = useState('daily');

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
      } else {
        console.error('Error calculating payrate');
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
    }
    setIsSubmitting(false);
    setSubmitting(false);
  };

  const fetchPaymentRecords = async () => {
    try {
      const response = await fetch(`/api/employee/summary?filter=${filter}`);
      const data = await response.json();
      if (response.ok) {
        setPaymentRecords(data);
      } else {
        console.error('Error fetching payment records:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching payment records:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchPaymentRecords();
    }
  }, [session, filter]);

  return (
    <div className="flex flex-col gap-10 min-h-screen bg-[#fff] text-black px-5" style={{ width: '225vh', height: '200vh' }}>
      <div className="flex flex-col items-center mt-10">
        <h1 className={`${poppins.className} text-center text-[5rem] font-[900] uppercase `}>
          Employee
        </h1>
      </div>

      {/* Pay Rate Form */}
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col gap-2 max-w-[35rem] w-full">
          <h1 className={`${poppins.className} text-left text-[1.5rem] font-[700] text-balance uppercase`}>
          Set Pay Rate
          </h1>
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
              <Form onSubmit={handleSubmit} className="flex flex-col gap-7 bg-[#fff] border-[1px] border-gray-600 p-10 rounded-ss-xl rounded-ee-xl space-y-4">
                <div className="flex flex-col gap-5">
                  {/* Pay Rate */}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row items-center gap-2 text-black">
                      <p>Pay Rate</p>
                      <ErrorMessage name="payRate" component="div" className="text-red-500 text-sm" />
                    </div>
                    <Input
                      id="payRate"
                      name="payRate"
                      type="number"
                      placeholder="Enter a Pay Rate"
                      value={values.payRate}
                      onChange={(e) => setFieldValue('payRate', Number(e.target.value))} 
                    />
                  </div>
                  {/* Pay Rate Schedule */}
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-row items-center gap-2 text-black">
                      <p>Pay Period</p>
                      <ErrorMessage name="payRateSchedule" component="div" className="text-red-500 text-sm" />
                    </div>
                    <Select
                      value={values.payRateSchedule}
                      onValueChange={(value) => setFieldValue('payRateSchedule', value)}
                    >
                      <SelectTrigger className="rounded">
                        <SelectValue placeholder="Select Pay Period"/>
                      </SelectTrigger>
                      <SelectContent className="bg-[#fff]">
                        <SelectItem value="Hourly" className="text-black">Hourly</SelectItem>
                        <SelectItem value="Daily" className="text-black">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Effective Date */}
                  <div className="flex flex-col gap-1 text-black">
                    <p>Effective Date</p>
                    <DatePicker
                      date={values.effectiveDate}
                      onChange={(date) => {
                        setFieldValue('effectiveDate', date);
                      }}
                    />
                    <ErrorMessage name="effectiveDate" component="div" className="text-red-500 text-sm" />
                  </div>
                </div>
                {/* Submit Button */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-500 rounded" 
                  type="submit" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Form>
            )}
          </Formik>
        </div>

        {/* Payment Records */}
        <div className="flex flex-col w-full gap-5 mt-10">
          <div className="flex flex-row justify-between items-center">
            <h1 className={`${poppins.className} text-left text-[1.5rem] font-[700] text-balance uppercase`}>Payment Records</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="flex flex-row gap-2 bg-green-600 hover:bg-green-500 rounded">
                  <p>Filter by:</p>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex flex-col gap-1 p-4 rounded bg-white border-gray-600 shadow-black shadow-sm">
                <Button
                  className="bg-green-600 hover:bg-green-500 rounded"
                  onClick={() => {
                    setFilter('daily');
                  }}
                >
                  Daily
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-500 rounded"
                  onClick={() => {
                    setFilter('weekly');
                  }}
                >
                  Weekly
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-500 rounded"
                  onClick={() => {
                    setFilter('monthly');
                  }}
                >
                  Monthly
                </Button>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex bg-white rounded-ss-xl rounded-ee-xl p-5 border-[1px] border-gray-600">
            <Table classname="bg-white">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-36 text-black">Date</TableHead>
                  <TableHead className="min-w-36 text-black">Payroll Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentRecords.length > 0 ? (
                  paymentRecords.map((record) => (
                    <TableRow key={record.date}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>${record.payAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan="2">No payment records found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
