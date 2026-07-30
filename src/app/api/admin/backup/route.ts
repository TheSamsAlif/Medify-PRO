import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [
      totalUsers, totalPatients, totalGuardians, totalDoctors, totalAdmins,
      totalMedicines, totalPrescriptions, totalAppointments, totalHealthRecords,
      totalChatMessages, totalNotifications, totalFeedbacks, totalAuditLogs,
      totalSOSAlerts, totalEmergencyAlerts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.guardian.count(),
      prisma.user.count({ where: { role: "DOCTOR" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.medicine.count(),
      prisma.prescription.count(),
      prisma.appointment.count(),
      prisma.healthRecord.count(),
      prisma.chatMessage.count(),
      prisma.notification.count(),
      prisma.feedback.count(),
      prisma.auditLog.count(),
      prisma.sOSAlert.count(),
      prisma.emergencyAlert.count(),
    ])

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      data: {
        users: totalUsers,
        patients: totalPatients,
        guardians: totalGuardians,
        doctors: totalDoctors,
        admins: totalAdmins,
        medicines: totalMedicines,
        prescriptions: totalPrescriptions,
        appointments: totalAppointments,
        healthRecords: totalHealthRecords,
        chatMessages: totalChatMessages,
        notifications: totalNotifications,
        feedbacks: totalFeedbacks,
        auditLogs: totalAuditLogs,
        sosAlerts: totalSOSAlerts,
        emergencyAlerts: totalEmergencyAlerts,
      },
    })
  } catch (error) {
    console.error("Admin backup error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
