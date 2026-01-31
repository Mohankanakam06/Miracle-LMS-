import jsPDF from 'jspdf';
import { format } from 'date-fns';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

const TIME_SLOTS = [
    { start: '09:15', end: '10:05', label: '9:15-10:05', session: 'morning' },
    { start: '10:05', end: '10:55', label: '10:05-10:55', session: 'morning' },
    { start: '11:05', end: '11:55', label: '11:05-11:55', session: 'morning' },
    { start: '11:55', end: '12:45', label: '11:55-12:45', session: 'morning' },
    { start: '12:45', end: '13:25', label: 'LUNCH', isLunch: true, session: 'lunch' },
    { start: '13:25', end: '14:15', label: '1:25-2:15', session: 'afternoon' },
    { start: '14:15', end: '15:05', label: '2:15-3:05', session: 'afternoon' },
    { start: '15:05', end: '15:55', label: '3:05-3:55', session: 'afternoon' },
];

interface ScheduleSlot {
    courseCode: string;
    courseName: string;
    start_time: string;
    end_time: string;
    room: string;
    isLab: boolean;
}

interface FacultyWorkload {
    teacherId: string;
    teacherName: string;
    periodsPerDay: Map<string, number>;
    totalPeriods: number;
    morningPeriods: number;
    afternoonPeriods: number;
    daySchedule: Map<string, ScheduleSlot[]>;
}

interface FacultyPdfOptions {
    workload: FacultyWorkload;
    departmentName?: string;
    academicYear?: string;
    semester?: string;
}

interface AllFacultyPdfOptions {
    workloads: FacultyWorkload[];
    departmentName?: string;
    academicYear?: string;
    semester?: string;
}

/**
 * Generate PDF for a single faculty member's timetable
 */
export function generateFacultyTimetablePdf({
    workload,
    departmentName = 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    academicYear = '2025-2026',
    semester = 'III YEAR II SEMESTER',
}: FacultyPdfOptions) {
    const doc = new jsPDF('landscape');

    addFacultyPage(doc, workload, departmentName, academicYear, semester);

    const fileName = `Faculty_Timetable_${workload.teacherName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
}

/**
 * Generate a combined PDF with all faculty timetables (one page per faculty)
 */
export function generateAllFacultyTimetablesPdf({
    workloads,
    departmentName = 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    academicYear = '2025-2026',
    semester = 'III YEAR II SEMESTER',
}: AllFacultyPdfOptions) {
    const doc = new jsPDF('landscape');

    workloads.forEach((workload, index) => {
        if (index > 0) {
            doc.addPage();
        }
        addFacultyPage(doc, workload, departmentName, academicYear, semester);
    });

    const fileName = `All_Faculty_Timetables_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
}

function addFacultyPage(
    doc: jsPDF,
    workload: FacultyWorkload,
    departmentName: string,
    academicYear: string,
    semester: string
) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin;

    // Header background
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 30, 'F');

    // Institution header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(departmentName, pageWidth / 2, 10, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${semester} | A.Y: ${academicYear}`, pageWidth / 2, 18, { align: 'center' });

    // Faculty name
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Faculty Timetable: ${workload.teacherName}`, pageWidth / 2, 26, { align: 'center' });

    yPos = 38;

    // Stats row
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, pageWidth - margin * 2, 12, 'F');
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const statsText = `Total Periods: ${workload.totalPeriods} | Morning: ${workload.morningPeriods} | Afternoon: ${workload.afternoonPeriods}`;
    doc.text(statsText, pageWidth / 2, yPos + 7, { align: 'center' });

    yPos += 18;

    // Table dimensions
    const dayColWidth = 25;
    const slotWidth = (pageWidth - margin * 2 - dayColWidth) / TIME_SLOTS.length;
    const rowHeight = 20;

    // Draw header row
    doc.setFillColor(30, 64, 175);
    doc.rect(margin, yPos, dayColWidth, rowHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DAY/TIME', margin + dayColWidth / 2, yPos + rowHeight / 2 + 2, { align: 'center' });

    // Time slot headers
    TIME_SLOTS.forEach((slot, idx) => {
        const x = margin + dayColWidth + idx * slotWidth;

        if (slot.isLunch) {
            doc.setFillColor(245, 158, 11);
        } else {
            doc.setFillColor(30, 64, 175);
        }
        doc.rect(x, yPos, slotWidth, rowHeight, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(slot.label, x + slotWidth / 2, yPos + rowHeight / 2 + 2, { align: 'center' });
    });

    yPos += rowHeight;

    // Draw day rows
    DAYS.forEach((day, dayIndex) => {
        const daySchedule = workload.daySchedule.get(day) || [];

        // Create a map of slots by start time
        const slotsByTime = new Map<string, ScheduleSlot>();
        daySchedule.forEach(slot => {
            slotsByTime.set(slot.start_time, slot);
        });

        // Day cell
        doc.setFillColor(dayIndex % 2 === 0 ? 240 : 250, dayIndex % 2 === 0 ? 240 : 250, dayIndex % 2 === 0 ? 240 : 250);
        doc.rect(margin, yPos, dayColWidth, rowHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, dayColWidth, rowHeight, 'S');

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(day.toUpperCase(), margin + dayColWidth / 2, yPos + rowHeight / 2 + 2, { align: 'center' });

        // Time slot cells
        TIME_SLOTS.forEach((slot, slotIndex) => {
            const x = margin + dayColWidth + slotIndex * slotWidth;

            if (slot.isLunch) {
                doc.setFillColor(254, 243, 199);
                doc.rect(x, yPos, slotWidth, rowHeight, 'F');
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, yPos, slotWidth, rowHeight, 'S');
                doc.setTextColor(180, 130, 50);
                doc.setFontSize(10);
                doc.text('LUNCH', x + slotWidth / 2, yPos + rowHeight / 2 + 3, { align: 'center' });
            } else {
                const schedule = slotsByTime.get(slot.start);

                if (schedule) {
                    // Set color based on lab vs theory
                    if (schedule.isLab) {
                        doc.setFillColor(243, 232, 255); // Purple tint
                    } else {
                        doc.setFillColor(219, 234, 254); // Blue tint
                    }

                    doc.rect(x, yPos, slotWidth, rowHeight, 'F');
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(x, yPos, slotWidth, rowHeight, 'S');

                    doc.setTextColor(50, 50, 50);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(schedule.courseCode, x + slotWidth / 2, yPos + rowHeight / 2 - 1, { align: 'center' });

                    if (schedule.room) {
                        doc.setFontSize(6);
                        doc.setFont('helvetica', 'normal');
                        doc.text(schedule.room, x + slotWidth / 2, yPos + rowHeight / 2 + 5, { align: 'center' });
                    }
                } else {
                    // Free period
                    doc.setFillColor(220, 252, 231); // Light green for free
                    doc.rect(x, yPos, slotWidth, rowHeight, 'F');
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(x, yPos, slotWidth, rowHeight, 'S');

                    doc.setTextColor(34, 197, 94);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    doc.text('FREE', x + slotWidth / 2, yPos + rowHeight / 2 + 2, { align: 'center' });
                }
            }
        });

        yPos += rowHeight;
    });

    yPos += 10;

    // Subject legend
    const subjectsSet = new Set<string>();
    workload.daySchedule.forEach(slots => {
        slots.forEach(slot => {
            subjectsSet.add(`${slot.courseCode}: ${slot.courseName}${slot.isLab ? ' (Lab)' : ''}`);
        });
    });

    if (subjectsSet.size > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text('Assigned Subjects:', margin, yPos);
        yPos += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        const subjects = Array.from(subjectsSet);
        const colWidth = (pageWidth - margin * 2) / 2;

        subjects.forEach((subject, idx) => {
            const x = margin + (idx % 2) * colWidth;
            const y = yPos + Math.floor(idx / 2) * 5;
            doc.text(`• ${subject}`, x, y);
        });
    }

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, margin, pageHeight - 8);
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, pageHeight - 8);
}
