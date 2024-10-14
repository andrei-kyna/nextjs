// api/timesheet/insert.js

import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/pages/api/auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const employeeNo = session?.user.employeeID;
  const { action } = req.body;

  if (!employeeNo) {
    return res.status(401).json({ message: 'Unauthorized, employee not found' });
  }

  if (req.method === 'POST') {
    try {
      // Fetch employee details using employeeNo
      const employee = await prisma.employee.findUnique({
        where: { employeeNo },
      });

      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      const employeeId = employee.id;
      const currentTime = new Date(); // Use current date and time

      // Get today's date (reset time to midnight)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const latestEntry = await prisma.timesheet.findFirst({
        where: {
          employeeID: employeeId,
          time: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { time: 'desc' },
      });

      let newEntry;

      // Handle different action types (TIME_IN, BREAK, TIME_OUT)
      if (action === 'TIME_IN') {
        if (latestEntry && latestEntry.type === 'TIME_OUT') {
          return res.status(400).json({ message: 'You cannot Time In after Time Out for today' });
        }

        // Create a TIME_IN entry
        newEntry = await prisma.timesheet.create({
          data: {
            type: 'TIME_IN',  // Use column name `type`
            employeeID: employeeId,
            time: currentTime,  // Use column name `time`
          },
        });

        // Upsert daily summary with initial totalTime = 0
        await prisma.dailySummary.upsert({
          where: { employeeId_date: { employeeId, date: today } },
          update: {}, // No update on totalTime yet
          create: {
            employeeId,
            date: today,
            totalTime: 0,  // Initialize totalTime to 0
          },
        });

      } else if (action === 'BREAK') {
        if (!latestEntry || latestEntry.type !== 'TIME_IN') {
          return res.status(400).json({ message: 'You must Time In before taking a Break' });
        }

        // Create a BREAK entry
        newEntry = await prisma.timesheet.create({
          data: {
            type: 'BREAK',  // Use column name `type`
            employeeID: employeeId,
            time: currentTime,  // Use column name `time`
          },
        });

        // Calculate total time from TIME_IN to BREAK
        await calculateTotalTime(employeeId, today, currentTime, 'BREAK');

      } else if (action === 'TIME_OUT') {
        if (!latestEntry || latestEntry.type !== 'TIME_IN') {
          return res.status(400).json({ message: 'You must Time In before Time Out' });
        }
        
        // Create a TIME_OUT entry
        newEntry = await prisma.timesheet.create({
          data: {
            type: 'TIME_OUT',  // Use column name `type`
            employeeID: employeeId,
            time: currentTime,  // Use column name `time`
          },
        });

        // Calculate the total time for the entire day
        await calculateTotalTime(employeeId, today, currentTime, 'TIME_OUT');
      } else {
        return res.status(400).json({ message: 'Invalid action' });
      }

      return res.status(201).json({ message: `${action} logged`, timesheet: newEntry });
    } catch (error) {
      console.error('Error logging timesheet:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Helper function to calculate total time and update daily summary
async function calculateTotalTime(employeeId, today, currentTime, actionType) {
  try {
    // Fetch all timesheet entries for today
    const timesheetEntries = await prisma.timesheet.findMany({
      where: {
        employeeID: employeeId,
        time: {
          gte: today,  // Get entries from the start of today
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),  // Until the end of today
        },
      },
      orderBy: { time: 'asc' },  // Order by time ascending
    });

    let totalTime = 0;
    let lastTimeIn = null;

    // Loop through timesheet entries and calculate totalTime
    timesheetEntries.forEach((entry) => {
      if (entry.type === 'TIME_IN') {
        lastTimeIn = new Date(entry.time);
      } else if (lastTimeIn && (entry.type === 'BREAK' || entry.type === 'TIME_OUT')) {
        totalTime += (new Date(entry.time) - lastTimeIn) / 1000;  // Calculate duration in seconds
        lastTimeIn = null;  // Reset after calculating duration
      }
    });

    // Upsert daily summary with updated total time
    await prisma.dailySummary.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      update: {
        totalTime: totalTime,  // Update totalTime in seconds
      },
      create: {
        employeeId,
        date: today,
        totalTime: totalTime,  // If no record exists, create one with the calculated totalTime
      },
    });

    return totalTime;
  } 
  catch (error) {
    console.error(`Error calculating total time for ${actionType}:`, error);
    throw new Error('Error calculating total time');
  }
}