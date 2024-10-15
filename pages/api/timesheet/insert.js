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
      }

      return res.status(200).json({ message: 'Success', newEntry });
    } catch (error) {
      console.error('Error inserting timesheet entry:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Function to calculate total time for the day
async function calculateTotalTime(employeeId, today, currentTime, action) {
  const timeEntries = await prisma.timesheet.findMany({
    where: {
      employeeID: employeeId,
      time: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { time: 'asc' },
  });

  let totalTime = 0;
  let lastTimeIn = null;

  // Calculate the total time between TIME_IN and BREAK
  for (let i = 0; i < timeEntries.length; i++) {
    const entryTime = new Date(timeEntries[i].time);

    if (timeEntries[i].type === 'TIME_IN') {
      lastTimeIn = entryTime; // Store the time of TIME_IN
    } else if (lastTimeIn && (timeEntries[i].type === 'BREAK' || timeEntries[i].type === 'TIME_OUT')) {
      // If we have a TIME_IN and encounter BREAK or TIME_OUT, calculate the duration
      totalTime += (entryTime - lastTimeIn) / 1000; // Add time difference in seconds
      lastTimeIn = null; // Reset lastTimeIn after calculating
    }
  }

  // Update the daily summary with the total time
  await prisma.dailySummary.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    update: {
      totalTime, // Update total time
    },
    create: {
      employeeId,
      date: today,
      totalTime, // Create new daily summary with total time
    },
  });

  return totalTime; // Optionally return the total time calculated
}
