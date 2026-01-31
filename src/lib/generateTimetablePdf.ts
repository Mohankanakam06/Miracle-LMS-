import jsPDF from 'jspdf';
import { format } from 'date-fns';

interface TimetableEntry {
    id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room: string | null;
    classes?: {
        courses?: {
            name?: string;
            code?: string;
        };
        profiles?: {
            full_name?: string;
        };
    };
}

interface TimetablePdfOptions {
    timetableData: TimetableEntry[];
    departmentName?: string;
    academicYear?: string;
    semester?: string;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const TIME_SLOTS = [
    { start: '09:15', end: '10:05', label: '9:15-10:05' },
    { start: '10:05', end: '10:55', label: '10:05-10:55' },
    { start: '11:05', end: '11:55', label: '11:05-11:55' },
    { start: '11:55', end: '12:45', label: '11:55-12:45' },
    { start: '12:45', end: '13:25', label: 'LUNCH', isLunch: true },
    { start: '13:25', end: '14:15', label: '1:25-2:15' },
    { start: '14:15', end: '15:05', label: '2:15-3:05' },
    { start: '15:05', end: '15:55', label: '3:05-3:55' },
];

const getAbbreviation = (name?: string): string => {
    if (!name) return '---';
    const words = name.split(' ').filter(w => w.length > 2 && !['and', 'the', 'for', 'with'].includes(w.toLowerCase()));
    if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
};

export function generateTimetablePdf({
    timetableData,
    departmentName = 'DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING',
    academicYear = '2025-2026',
    semester = 'III YEAR II SEMESTER',
}: TimetablePdfOptions) {
    const doc = new jsPDF('landscape');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    let yPos = margin;

    // Header background
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Institution header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(departmentName, pageWidth / 2, 10, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${semester} TIME TABLE | A.Y: ${academicYear}`, pageWidth / 2, 18, { align: 'center' });

    yPos = 32;

    // Table dimensions
    const dayColWidth = 22;
    const slotWidth = (pageWidth - margin * 2 - dayColWidth) / TIME_SLOTS.length;
    const rowHeight = 18;

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
            doc.setFillColor(245, 158, 11); // Amber
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
        // Day cell
        doc.setFillColor(dayIndex % 2 === 0 ? 240 : 250, dayIndex % 2 === 0 ? 240 : 250, dayIndex % 2 === 0 ? 240 : 250);
        doc.rect(margin, yPos, dayColWidth, rowHeight, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.rect(margin, yPos, dayColWidth, rowHeight, 'S');

        doc.setTextColor(50, 50, 50);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(day, margin + dayColWidth / 2, yPos + rowHeight / 2 + 2, { align: 'center' });

        // Time slot cells
        TIME_SLOTS.forEach((slot, slotIndex) => {
            const x = margin + dayColWidth + slotIndex * slotWidth;

            if (slot.isLunch) {
                doc.setFillColor(254, 243, 199); // Light amber
                doc.rect(x, yPos, slotWidth, rowHeight, 'F');
                doc.setDrawColor(200, 200, 200);
                doc.rect(x, yPos, slotWidth, rowHeight, 'S');
                doc.setTextColor(180, 130, 50);
                doc.setFontSize(10);
                doc.text('🍽', x + slotWidth / 2, yPos + rowHeight / 2 + 3, { align: 'center' });
            } else {
                // Find schedule for this slot
                const schedule = timetableData?.find(entry => {
                    const entryStart = entry.start_time.substring(0, 5);
                    return entry.day_of_week.toUpperCase() === day && entryStart === slot.start;
                });

                if (schedule) {
                    // Color based on subject
                    const colors: Record<string, [number, number, number]> = {
                        'Data Structures': [219, 234, 254],
                        'Database': [237, 233, 254],
                        'Operating': [220, 252, 231],
                        'Networks': [254, 249, 195],
                        'Software': [207, 250, 254],
                        'Machine': [252, 231, 243],
                        'Artificial': [224, 231, 255],
                    };

                    const courseName = schedule.classes?.courses?.name || '';
                    let bgColor: [number, number, number] = [245, 245, 245];

                    for (const [key, color] of Object.entries(colors)) {
                        if (courseName.includes(key)) {
                            bgColor = color;
                            break;
                        }
                    }

                    doc.setFillColor(...bgColor);
                    doc.rect(x, yPos, slotWidth, rowHeight, 'F');
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(x, yPos, slotWidth, rowHeight, 'S');

                    const abbrev = schedule.classes?.courses?.code || getAbbreviation(courseName);

                    doc.setTextColor(50, 50, 50);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(abbrev, x + slotWidth / 2, yPos + rowHeight / 2, { align: 'center' });

                    if (schedule.room) {
                        doc.setFontSize(6);
                        doc.setFont('helvetica', 'normal');
                        doc.text(schedule.room, x + slotWidth / 2, yPos + rowHeight / 2 + 5, { align: 'center' });
                    }
                } else {
                    doc.setFillColor(dayIndex % 2 === 0 ? 250 : 255, dayIndex % 2 === 0 ? 250 : 255, dayIndex % 2 === 0 ? 250 : 255);
                    doc.rect(x, yPos, slotWidth, rowHeight, 'F');
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(x, yPos, slotWidth, rowHeight, 'S');
                }
            }
        });

        yPos += rowHeight;
    });

    yPos += 10;

    // Subject Legend
    const subjectMap = new Map<string, { code: string; faculty: string }>();
    timetableData?.forEach(t => {
        const name = t.classes?.courses?.name;
        const code = t.classes?.courses?.code;
        const faculty = t.classes?.profiles?.full_name;
        if (name && !subjectMap.has(name)) {
            subjectMap.set(name, {
                code: code || getAbbreviation(name),
                faculty: faculty || 'TBA',
            });
        }
    });

    if (subjectMap.size > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(50, 50, 50);
        doc.text('Subject & Faculty Details:', margin, yPos);
        yPos += 6;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        const legendColWidth = (pageWidth - margin * 2) / 3;
        let colIndex = 0;

        subjectMap.forEach((details, name) => {
            const x = margin + (colIndex % 3) * legendColWidth;
            const y = yPos + Math.floor(colIndex / 3) * 6;

            doc.setFont('helvetica', 'bold');
            doc.text(`${details.code}:`, x, y);
            doc.setFont('helvetica', 'normal');
            doc.text(` ${name} - ${details.faculty}`, x + 15, y);

            colIndex++;
        });

        yPos += Math.ceil(subjectMap.size / 3) * 6 + 8;
    }

    // Footer
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);

    const footerY = pageHeight - 12;
    doc.text('Time Table In-Charge: _______________', margin, footerY);
    doc.text('Class In-Charge: _______________', pageWidth / 2 - 40, footerY);
    doc.text('HOD: _______________', pageWidth - margin - 50, footerY);

    doc.setFontSize(7);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Save PDF
    const fileName = `Timetable_${academicYear.replace('-', '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
}
