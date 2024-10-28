import { useState, useEffect, useCallback } from "react"; 
import { useSession } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { useFormik } from 'formik';
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";

export default function Timesheet() {
  const { data: session, status } = useSession();
  const [lastAction, setLastAction] = useState(''); 
  const [dailySummaries, setDailySummaries] = useState([]); 
  const [loading, setLoading] = useState(true); 

  // Individual loading states for each button
  const [isTimeInLoading, setIsTimeInLoading] = useState(false);
  const [isBreakLoading, setIsBreakLoading] = useState(false);
  const [isTimeOutLoading, setIsTimeOutLoading] = useState(false);

  // Memoize fetchTimesheetData using useCallback
  const fetchTimesheetData = useCallback(async () => {
    if (session) {
      try {
        const res = await fetch('/api/timesheet/summary');
        if (!res.ok) {
          throw new Error('Failed to fetch timesheet summary');
        }
        const data = await res.json();
        setLastAction(data.lastAction || ''); 
        setDailySummaries(data.dailySummaries || []); 
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
      } finally {
        setLoading(false); 
      }
    }
  }, [session]);

  useEffect(() => {
    fetchTimesheetData();
  }, [session, fetchTimesheetData]); // You no longer need fetchTimesheetData here as a dependency

  // Convert UTC time span string (e.g., "04:34 AM to 04:35 AM") to local time
function convertTimeSpanToLocal(timeSpan) {
  // Split the timeSpan into two parts (start and end times)
  if (!timeSpan) return '';

  // Check if the timeSpan includes ' to ' indicating a range
  if (timeSpan.includes(' to ')) {
    const [startTimeUTC, endTimeUTC] = timeSpan.split(' to ').map(time => time.trim());

  // If start and end times are the same, return only one time
  if (startTimeUTC === endTimeUTC) {
    const localTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}Z`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return localTime;
  }
  
  // Convert start time from UTC to the user's local time
  const localStartTime = new Date(`1970-01-01T${convertTo24HourFormat(startTimeUTC)}Z`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Convert end time from UTC to the user's local time
  const localEndTime = new Date(`1970-01-01T${convertTo24HourFormat(endTimeUTC)}Z`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Return the local time span as a string (start to end)
  return `${localStartTime} to ${localEndTime}`;
} else {
  // Only one time present, convert and return it
  const localTime = new Date(`1970-01-01T${convertTo24HourFormat(timeSpan)}Z`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return localTime;
}
}

// Helper function to convert 12-hour format (e.g., "04:34 AM") to 24-hour format for Date parsing
function convertTo24HourFormat(timeString) {
if (!timeString || !timeString.includes(' ')) {
  console.error("Invalid time format:", timeString);
  return "00:00:00"; // Return default value in case of invalid format
}

const [time, period] = timeString.split(' ');
let [hours, minutes] = time.split(':').map(Number);

if (period === 'PM' && hours < 12) {
  hours += 12; // Convert PM times
} else if (period === 'AM' && hours === 12) {
  hours = 0; // Handle midnight case
}

return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

// Convert UTC date string (e.g., "Mon, Oct 14, 2024") to local date
function convertDateToLocal(utcDateString) {
const utcDate = new Date(utcDateString + ' UTC'); // Add 'UTC' to parse correctly
return utcDate.toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
});
}

// Form handling for timesheet actions
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

    // Refetch the timesheet data to update lastAction and daily summaries (including total time)
    await fetchTimesheetData();
  } 
  catch (error) {
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
    <div className='flex flex-col items-center gap-10 bg-[#fff] text-black min-h-screen w-full' style={{ height: '770px', width: '1370px' }}>
      <h1 className="mt-10 text-center text-[3rem] uppercase">Daily Timesheet</h1>

    {/* Status Message */}
    {lastAction === 'TIME_OUT' ? (
          <p className="text-xl text-black">
            You have logged a total of <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> hours today.
          </p>
        ) : lastAction === 'BREAK' ? (
          <p className="text-xl black">
            You have worked for <b>{dailySummaries[0]?.totalTime || '00:00:00'}</b> so far. Ready to resume?
          </p>
        ) : lastAction === 'TIME_IN' ? (
          <p className="text-xl text-black">
            Your timer is active. Click <b>Break</b> to pause or <b>Time Out</b> to stop.
          </p>
        ) : (
          <p className="text-xl text-black">
            Click <b>Time In</b> to start tracking your work hours.
          </p>
        )}
      <div className='flex flex-col gap-3 mt-10'>
        <h1 className="{ml-5 text-black text-[1.5rem] uppercase">Summary:</h1>
        <div className="container mb-10 bg-[var(--dark)] p-5 rounded-ss-xl rounded-ee-xl border-[var(--ten-opacity-white)] border-[1px]">
          <Table className="min-w-[50rem]">
            <TableRow>
              <TableHead>Employee Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time Span</TableHead>
            </TableRow>
            <TableBody>
              {dailySummaries.length > 0 ? (
                dailySummaries.map((summary, index) => (
                  <TableRow key={index}>
                  <TableCell>{summary.fullName}</TableCell>
                  <TableCell>{convertDateToLocal(summary.date)}</TableCell>
                  <TableCell>{summary.totalTime}</TableCell>
                  <TableCell>{convertTimeSpanToLocal(summary.timeSpan)}</TableCell>
                </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center pt-10 pb-5 text-black">
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
        className="flex flex-row justify-center items-center gap-5 bg-[#fff] p-10 rounded-xl mt-10 w-half border border-black"
      >
        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-md transform transition-transform hover:scale-105"
          onClick={async () => {
            setIsTimeInLoading(true);
            await formik.setFieldValue('action', 'TIME_IN');
            await formik.submitForm();
            setIsTimeInLoading(false);
          }}
          disabled={isTimeInLoading || (!isInitialState && isTimeInDisabled)} 
        >
          {isTimeInLoading ? 'Processing...' : 'Time In'}
        </Button>

        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-md transform transition-transform hover:scale-105"
          onClick={async () => {
            setIsBreakLoading(true);
            await formik.setFieldValue('action', 'BREAK');
            await formik.submitForm();
            setIsBreakLoading(false);
          }}
          disabled={isBreakLoading || isBreakDisabled} 
        >
          {isBreakLoading ? 'Processing...' : 'Break'}
        </Button>

        <Button
          variant="default"
          type="button"
          className="min-w-28 bg-green-600 hover:bg-green-500 text-white rounded-lg shadow-md transform transition-transform hover:scale-105"
          onClick={async () => {
            setIsTimeOutLoading(true);
            await formik.setFieldValue('action', 'TIME_OUT');
            await formik.submitForm();
            setIsTimeOutLoading(false);
          }}
          disabled={isTimeOutLoading || isTimeOutDisabled} 
        >
          {isTimeOutLoading ? 'Processing...' : 'Time Out'}
        </Button>
      </form>
    </div>
  );
}