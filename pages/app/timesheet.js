import { useState, useEffect, useCallback } from "react"; 
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { useFormik } from 'formik';
import { Poppins } from 'next/font/google';
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '900'],
});

export default function Timesheet() {
  const { data: session, status } = useSession();
  const [lastAction, setLastAction] = useState(''); 
  const [dailySummary, setDailySummary] = useState(null); 
  const [loading, setLoading] = useState(true); 

  // Memoize fetchTimesheetData using useCallback
  const fetchTimesheetData = useCallback(async () => {
    if (session) {
      const res = await fetch('/api/timesheet/summary');
      const data = await res.json();
      setLastAction(data.lastAction || ''); 
      setDailySummary(data.dailySummary || null); 
      setLoading(false); 
    }
  }, [session]); // Include session as a dependency

  useEffect(() => {
    fetchTimesheetData();
  }, [session, fetchTimesheetData]); // You no longer need fetchTimesheetData here as a dependency

  // Convert UTC time span string (e.g., "04:34 AM to 04:35 AM") to local time
function convertTimeSpanToLocal(timeSpan) {
  // Split the timeSpan into two parts (start and end times)
  const [startTimeUTC, endTimeUTC] = timeSpan.split(' to ');

  // Convert start time from UTC to the user's local time
  const localStartTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}+8:00`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // If there's no end time, return only the start time
  if (!endTimeUTC) {
    return localStartTime; // Return only the local start time
  }

  // Convert end time from UTC to the user's local time
  const localEndTime = new Date(`1970-01-01T${convertTo24HourFormat(endTimeUTC)}+8:00`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Return the local time span as a string (start to end)
  return `${localStartTime} to ${localEndTime}`;
}
  const convertTo24HourFormat = (timeString) => {
    if (!timeString || !timeString.includes(' ')) {
      console.error("Invalid time format:", timeString);
      return "00:00:00";
    }

    const [time, period] = timeString.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours < 12) {
      hours += 12; 
    } else if (period === 'AM' && hours === 12) {
      hours = 0; 
    }

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

// Convert UTC date string (e.g., "Mon, Oct 14, 2024") to local date
function convertDateToLocal(utcDateString) {
  const utcDate = new Date(utcDateString + 'T00:00:00+08:00'); // Add 'UTC' to parse correctly
  return utcDate.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

  const formik = useFormik({
    initialValues: {
      action: '',
    },
    onSubmit: async (values) => {
      try {
        if (!session && status !== 'loading') {
          console.error("No session found");
          return;
        }
        const res = await fetch('/api/timesheet/insert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: values.action,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json();
          console.error('Failed to log timesheet', errorData);
          return;
        }

        await fetchTimesheetData();
      } catch (error) {
        console.error('Error submitting timesheet:', error);
      }
    },
  });

  const isTimeInDisabled = lastAction === 'TIME_IN' || lastAction === 'TIME_OUT';
  const isBreakDisabled = lastAction !== 'TIME_IN' || lastAction === 'TIME_OUT';
  const isTimeOutDisabled = lastAction === 'TIME_OUT' || lastAction === '' || lastAction === 'BREAK';
  const isInitialState = lastAction === '';

  if (loading) {
    return <p className="text-center text-[1.25rem] font-black mt-96">Loading Timesheets...</p>;
  }

  return (
    <div className='flex flex-col items-center gap-10 bg-[#111] text-white min-h-screen w-full' style={{ height: '770px', width: '1370px' }}>
      <h1 className={`${poppins.className} mt-10 text-center text-[3rem] font-[900] uppercase`}>Daily Timesheet</h1>

      <div className='flex flex-col gap-3 mt-10'>
        <h1 className={`${poppins.className} ml-5 text-[var(--white)] text-[1.5rem] font-[900] uppercase`}>Summary:</h1>
        <div className="container mb-10 bg-[var(--dark)] p-5 rounded-ss-xl rounded-ee-xl border-[var(--ten-opacity-white)] border-[1px]">
          <Table className="min-w-[50rem]">
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time Span</TableHead>
            </TableRow>
            <TableBody>
              {dailySummary ? (
                <TableRow>
                  <TableCell>{dailySummary.fullName}</TableCell>
                  <TableCell>{(convertDateToLocal)}{dailySummary.date}</TableCell>
                  <TableCell>{dailySummary.totalTime}</TableCell>
                  <TableCell>{(convertTimeSpanToLocal)}{dailySummary.timeSpan}</TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center pt-10 pb-5">
                    You have no records for today.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Time In/Out/Break Form */}
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-row justify-center items-center gap-5 bg-[#111] p-10 rounded-xl mt-10 w-full"
      >
        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-md transform transition-transform hover:scale-105"
          onClick={async () => {
            await formik.setFieldValue('action', 'TIME_IN');
            formik.submitForm();
          }}
          disabled={!isInitialState && isTimeInDisabled} 
        >
          Time In
        </Button>

        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-md transform transition-transform hover:scale-105"
          onClick={async () => {
            await formik.setFieldValue('action', 'BREAK');
            formik.submitForm();
          }}
          disabled={isBreakDisabled} 
        >
          Break
        </Button>

        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-gray-800 hover:bg-gray-700 text-white rounded-lg shadow-md transform transition-transform hover:scale-105"
          onClick={async () => {
            await formik.setFieldValue('action', 'TIME_OUT');
            formik.submitForm();
          }}
          disabled={isTimeOutDisabled} 
        >
          Time Out
        </Button>
      </form>
    </div>
  );
}
