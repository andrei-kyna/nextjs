import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { employeePayrateFormSchema } from '@/utils/validation-schema'; 

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Validate data
    const validatedData = await employeePayrateFormSchema.validate(req.body);
    const { payRate, payRateSchedule, effectiveDate } = validatedData;

    // Get the current user and employeeId.
    const session = await getServerSession(req, res, authOptions);
    const employeeNo = session?.user.employeeID;
    const employee = await prisma.employee.findUnique({
      where: { employeeNo },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // send the data to PayRate table in database with only 1 record.
    const employeeId = employee.id;
    await prisma.payRate.upsert({
      where: { employeeId },
      update: {
        payRate,
        payRateSchedule,
        effectiveDate: effectiveDate,
        updatedAt: new Date(),
      },
      create: {
        employeeId,
        payRate,
        payRateSchedule,
        effectiveDate: effectiveDate,
      },
    });

    // Fetch all daily summaries of this employee where date is the effectiveDate
    const dailySummaries = await prisma.dailySummary.findMany({
      where: {
        employeeId: employeeId,
        date: {
          gte: effectiveDate
        }
      }
    });  

    // Process the payroll calculations.
    const paymentRecords = [];

    for (const summary of dailySummaries) {
      // Get the totalTime in hours
      const totalHours = Math.floor(summary.totalTime / 3600); 

      // Determine the rate
      let payAmount = 0;

      if (payRateSchedule === 'Hourly') {
        payAmount = totalHours * payRate;
      } 
      else if (payRateSchedule === 'Daily') {
        payAmount = payRate; 
      } 
      else {
        return res.status(400).json({ error: 'Invalid payRateSchedule' });
      }
      console.log("Upsert Data:", {
        employeeId: employeeId,
        date: summary.date,
        dailySummaryId: summary.id,
        payAmount: payAmount,
      });
      
      // Upsert the calculated payment.
      const paymentRecord = await prisma.paymentRecord.upsert({
        where: {
          employeeId_date: {
            employeeId: employeeId,
            date: summary.date,
          },
        },
        update: {
          payAmount: payAmount,
          updatedAt: new Date(),
        },
        create: {
          employeeId: employeeId,
          date: summary.date,
          dailySummaryId: summary.id,
          payAmount: payAmount,
        },
      });

      paymentRecords.push(paymentRecord);
    }

    return res.status(200).json({ paymentRecords });
  } 
  catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  } 
  finally {
    await prisma.$disconnect();
  }
}