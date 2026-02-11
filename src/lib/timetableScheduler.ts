// Timetable Scheduling Engine with Faculty-Friendly Constraints
// Implements academic rules for B.Tech class timetable generation

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type DayOfWeek = typeof DAYS[number];

export interface TimeSlot {
  start: string;
  end: string;
  label: string;
  index: number;
  period: number;
  session: 'morning' | 'afternoon' | 'lunch';
  isLunch?: boolean;
}

// Time slots matching official college schedule
export const TIME_SLOTS: TimeSlot[] = [
  { start: '09:15', end: '10:05', label: '9:15 - 10:05', index: 0, period: 1, session: 'morning' },
  { start: '10:05', end: '10:55', label: '10:05 - 10:55', index: 1, period: 2, session: 'morning' },
  { start: '11:05', end: '11:55', label: '11:05 - 11:55', index: 2, period: 3, session: 'morning' },
  { start: '11:55', end: '12:45', label: '11:55 - 12:45', index: 3, period: 4, session: 'morning' },
  { start: '12:45', end: '13:25', label: '12:45 - 1:25', index: 4, isLunch: true, period: 0, session: 'lunch' },
  { start: '13:25', end: '14:15', label: '1:25 - 2:15', index: 5, period: 5, session: 'afternoon' },
  { start: '14:15', end: '15:05', label: '2:15 - 3:05', index: 6, period: 6, session: 'afternoon' },
  { start: '15:05', end: '15:55', label: '3:05 - 3:55', index: 7, period: 7, session: 'afternoon' },
];

export const CLASS_SLOTS = TIME_SLOTS.filter(s => !s.isLunch);
export const MORNING_SLOTS = TIME_SLOTS.filter(s => s.session === 'morning');
export const AFTERNOON_SLOTS = TIME_SLOTS.filter(s => s.session === 'afternoon');

export const ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202', 'Room 203'];
export const LABS = ['Lab 1', 'Lab 2', 'Lab 3', 'Lab 4'];

// Light days for seminars, soft skills, mini projects
export const LIGHT_DAYS: DayOfWeek[] = ['Friday', 'Saturday'];

// Core/heavy subjects should be scheduled in morning
// Core/heavy subjects should be scheduled in morning
export const CORE_SUBJECT_KEYWORDS = [
  // CSE / IT
  'Data Structures', 'Algorithms', 'Database', 'Operating Systems', 'Computer Networks', 'Machine Learning', 'Artificial Intelligence', 'Compiler Design', 'Theory of Computation',
  // ECE / EEE
  'Circuit', 'Signal', 'Control Systems', 'Digital Electronics', 'Analog', 'Communication Systems', 'Power Systems', 'Machines', 'Electromagnetic', 'Microprocessor', 'VLSI',
  // MECH / CIVIL
  'Thermodynamics', 'Mechanics', 'Fluid', 'Structural', 'Strength of Materials', 'Manufacturing', 'Kinematics', 'Dynamics', 'Heat Transfer', 'Hydraulics', 'Surveying',
  // MATH
  'Mathematics', 'Calculus', 'Probability', 'Statistics', 'Algebra', 'Geometry'
];

export interface ClassData {
  id: string;
  teacher_id: string;
  section: string;
  courses?: {
    name?: string;
    code?: string;
    credits?: number;
    department?: string;
  };
  profiles?: {
    full_name?: string;
  };
}

export interface SelectedClass {
  id: string;
  isLab: boolean;
  classesPerWeek: number;
  classData: ClassData;
}

export interface GeneratedSlot {
  class_id: string;
  teacher_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  room: string;
  courseName: string;
  courseCode: string;
  section: string;
  facultyName: string;
  isLab: boolean;
  slotIndices: number[];
}

export interface FacultyWorkload {
  teacherId: string;
  teacherName: string;
  periodsPerDay: Map<DayOfWeek, number>;
  totalPeriods: number;
  morningPeriods: number;
  afternoonPeriods: number;
  daySchedule: Map<DayOfWeek, GeneratedSlot[]>;
}

export interface ScheduleConstraints {
  maxTheoryPerFacultyPerDay: number;
  maxContinuousTheory: number;
  minFreePeriodPerFacultyPerDay: number;
  maxPeriodsPerSubjectPerDay: number; // New: limit same subject per day
  preferLabsInAfternoon: boolean;
  avoidTheoryAroundLabs: boolean;
  distributeWorkloadEvenly: boolean;
  coreSubjectsInMorning: boolean;
  lightSubjectsOnLightDays: boolean;
}

export const DEFAULT_CONSTRAINTS: ScheduleConstraints = {
  maxTheoryPerFacultyPerDay: 3,
  maxContinuousTheory: 2,
  minFreePeriodPerFacultyPerDay: 1,
  maxPeriodsPerSubjectPerDay: 2, // Max 2 periods of same subject per day
  preferLabsInAfternoon: true,
  avoidTheoryAroundLabs: true,
  distributeWorkloadEvenly: true,
  coreSubjectsInMorning: true,
  lightSubjectsOnLightDays: true,
};

// Track faculty schedules
class FacultyScheduleTracker {
  private schedules: Map<string, Map<DayOfWeek, Set<number>>> = new Map();
  private theoryCountPerDay: Map<string, Map<DayOfWeek, number>> = new Map();
  private continuousTheoryCount: Map<string, Map<DayOfWeek, number[]>> = new Map();

  constructor() {
    // Initialize for each day
  }

  canAssign(
    teacherId: string,
    day: DayOfWeek,
    slotIndices: number[],
    isLab: boolean,
    constraints: ScheduleConstraints
  ): boolean {
    // Check if slots are free for this faculty
    const daySchedule = this.getDaySchedule(teacherId, day);
    for (const idx of slotIndices) {
      if (daySchedule.has(idx)) return false;
    }

    // For theory classes, check constraints
    if (!isLab) {
      const currentTheoryCount = this.getTheoryCount(teacherId, day);
      if (currentTheoryCount >= constraints.maxTheoryPerFacultyPerDay) {
        return false;
      }

      // Check continuous theory constraint
      if (!this.canAddWithoutExceedingContinuous(teacherId, day, slotIndices[0], constraints.maxContinuousTheory)) {
        return false;
      }
    }

    return true;
  }

  private getDaySchedule(teacherId: string, day: DayOfWeek): Set<number> {
    if (!this.schedules.has(teacherId)) {
      this.schedules.set(teacherId, new Map());
    }
    const teacherSchedule = this.schedules.get(teacherId)!;
    if (!teacherSchedule.has(day)) {
      teacherSchedule.set(day, new Set());
    }
    return teacherSchedule.get(day)!;
  }

  private getTheoryCount(teacherId: string, day: DayOfWeek): number {
    if (!this.theoryCountPerDay.has(teacherId)) {
      this.theoryCountPerDay.set(teacherId, new Map());
    }
    return this.theoryCountPerDay.get(teacherId)!.get(day) || 0;
  }

  private canAddWithoutExceedingContinuous(
    teacherId: string,
    day: DayOfWeek,
    slotIndex: number,
    maxContinuous: number
  ): boolean {
    const daySchedule = this.getDaySchedule(teacherId, day);

    // Count continuous slots including this one
    let count = 1;

    // Check before
    let checkIdx = slotIndex - 1;
    while (checkIdx >= 0 && daySchedule.has(checkIdx) && checkIdx !== 4) { // 4 is lunch
      count++;
      checkIdx--;
    }

    // Check after
    checkIdx = slotIndex + 1;
    while (checkIdx < TIME_SLOTS.length && daySchedule.has(checkIdx) && checkIdx !== 4) {
      count++;
      checkIdx++;
    }

    return count <= maxContinuous;
  }

  assignSlot(teacherId: string, day: DayOfWeek, slotIndices: number[], isLab: boolean): void {
    const daySchedule = this.getDaySchedule(teacherId, day);
    slotIndices.forEach(idx => daySchedule.add(idx));

    if (!isLab) {
      if (!this.theoryCountPerDay.has(teacherId)) {
        this.theoryCountPerDay.set(teacherId, new Map());
      }
      const current = this.theoryCountPerDay.get(teacherId)!.get(day) || 0;
      this.theoryCountPerDay.get(teacherId)!.set(day, current + 1);
    }
  }

  getFacultyPeriodsPerDay(teacherId: string, day: DayOfWeek): number {
    return this.getDaySchedule(teacherId, day).size;
  }

  getFreePeriods(teacherId: string, day: DayOfWeek): number {
    return CLASS_SLOTS.length - this.getFacultyPeriodsPerDay(teacherId, day);
  }

  getTotalPeriods(teacherId: string): number {
    let total = 0;
    if (this.schedules.has(teacherId)) {
      this.schedules.get(teacherId)!.forEach((slots) => {
        total += slots.size;
      });
    }
    return total;
  }

  getDayWithLeastLoad(teacherId: string, excludeDays: DayOfWeek[] = []): DayOfWeek {
    let minLoad = Infinity;
    let bestDay: DayOfWeek = 'Monday';

    for (const day of DAYS) {
      if (excludeDays.includes(day)) continue;
      const load = this.getFacultyPeriodsPerDay(teacherId, day);
      if (load < minLoad) {
        minLoad = load;
        bestDay = day;
      }
    }

    return bestDay;
  }

  hasMorningClass(teacherId: string, day: DayOfWeek): boolean {
    const daySchedule = this.getDaySchedule(teacherId, day);
    return MORNING_SLOTS.some(slot => daySchedule.has(slot.index));
  }

  hasAfternoonClass(teacherId: string, day: DayOfWeek): boolean {
    const daySchedule = this.getDaySchedule(teacherId, day);
    return AFTERNOON_SLOTS.some(slot => daySchedule.has(slot.index));
  }
}

// Track room/lab usage
class RoomScheduleTracker {
  private schedules: Map<string, Map<DayOfWeek, Set<number>>> = new Map();

  isAvailable(room: string, day: DayOfWeek, slotIndices: number[]): boolean {
    if (!this.schedules.has(room)) return true;
    const roomSchedule = this.schedules.get(room)!;
    if (!roomSchedule.has(day)) return true;

    const daySchedule = roomSchedule.get(day)!;
    return !slotIndices.some(idx => daySchedule.has(idx));
  }

  assignSlot(room: string, day: DayOfWeek, slotIndices: number[]): void {
    if (!this.schedules.has(room)) {
      this.schedules.set(room, new Map());
    }
    const roomSchedule = this.schedules.get(room)!;
    if (!roomSchedule.has(day)) {
      roomSchedule.set(day, new Set());
    }
    slotIndices.forEach(idx => roomSchedule.get(day)!.add(idx));
  }

  getAvailableRoom(rooms: string[], day: DayOfWeek, slotIndices: number[]): string | null {
    for (const room of rooms) {
      if (this.isAvailable(room, day, slotIndices)) {
        return room;
      }
    }
    return null;
  }
}

// Track subject (class) schedules per day - to enforce max periods per subject per day
class SubjectScheduleTracker {
  private subjectPeriodsPerDay: Map<string, Map<DayOfWeek, number>> = new Map();

  getPeriodsForSubject(classId: string, day: DayOfWeek): number {
    if (!this.subjectPeriodsPerDay.has(classId)) return 0;
    return this.subjectPeriodsPerDay.get(classId)!.get(day) || 0;
  }

  canAssign(classId: string, day: DayOfWeek, periodsToAdd: number, maxPerDay: number): boolean {
    const current = this.getPeriodsForSubject(classId, day);
    return (current + periodsToAdd) <= maxPerDay;
  }

  assignPeriods(classId: string, day: DayOfWeek, periods: number): void {
    if (!this.subjectPeriodsPerDay.has(classId)) {
      this.subjectPeriodsPerDay.set(classId, new Map());
    }
    const current = this.subjectPeriodsPerDay.get(classId)!.get(day) || 0;
    this.subjectPeriodsPerDay.get(classId)!.set(day, current + periods);
  }
}

// Main class slot tracker
class SlotTracker {
  private usedSlots: Map<DayOfWeek, Set<number>> = new Map();

  constructor() {
    DAYS.forEach(day => {
      const slots = new Set<number>();
      // Mark lunch as always used
      const lunchSlot = TIME_SLOTS.find(s => s.isLunch);
      if (lunchSlot) slots.add(lunchSlot.index);
      this.usedSlots.set(day, slots);
    });
  }

  markExistingSchedule(existingTimetable: any[]): void {
    existingTimetable?.forEach(entry => {
      const day = entry.day_of_week as DayOfWeek;
      const slots = this.usedSlots.get(day);
      if (slots) {
        const slotIndex = TIME_SLOTS.findIndex(s => s.start === entry.start_time.substring(0, 5));
        if (slotIndex !== -1) {
          slots.add(slotIndex);
        }
      }
    });
  }

  isAvailable(day: DayOfWeek, slotIndex: number): boolean {
    return !this.usedSlots.get(day)?.has(slotIndex);
  }

  areAvailable(day: DayOfWeek, slotIndices: number[]): boolean {
    return slotIndices.every(idx => this.isAvailable(day, idx));
  }

  markUsed(day: DayOfWeek, slotIndices: number[]): void {
    slotIndices.forEach(idx => this.usedSlots.get(day)?.add(idx));
  }

  getAvailableSlots(day: DayOfWeek, session?: 'morning' | 'afternoon'): number[] {
    const available: number[] = [];
    const slots = session
      ? TIME_SLOTS.filter(s => s.session === session)
      : CLASS_SLOTS;

    for (const slot of slots) {
      if (this.isAvailable(day, slot.index)) {
        available.push(slot.index);
      }
    }
    return available;
  }

  // Find consecutive available slots for labs
  getConsecutiveSlots(day: DayOfWeek, count: number, preferAfternoon: boolean = true): number[][] {
    const pairs: number[][] = [];

    // Afternoon pairs (preferred for labs)
    if (preferAfternoon) {
      const afternoonPairs = [[5, 6], [6, 7]];
      for (const pair of afternoonPairs) {
        if (this.areAvailable(day, pair)) {
          pairs.push(pair);
        }
      }
    }

    // Morning pairs (not crossing lunch)
    const morningPairs = [[0, 1], [1, 2], [2, 3]];
    for (const pair of morningPairs) {
      if (this.areAvailable(day, pair)) {
        pairs.push(pair);
      }
    }

    // If afternoon not preferred, add them at the end
    if (!preferAfternoon) {
      const afternoonPairs = [[5, 6], [6, 7]];
      for (const pair of afternoonPairs) {
        if (this.areAvailable(day, pair) && !pairs.some(p => p[0] === pair[0])) {
          pairs.push(pair);
        }
      }
    }

    return pairs;
  }
}

// Utility functions
export function getAbbreviation(name?: string): string {
  if (!name) return '---';
  const words = name.split(' ').filter(w => w.length > 2 && !['and', 'the', 'for', 'with'].includes(w.toLowerCase()));
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 4);
}

export function isCoreSubject(courseName: string): boolean {
  return CORE_SUBJECT_KEYWORDS.some(keyword =>
    courseName.toLowerCase().includes(keyword.toLowerCase())
  );
}

export function isLightSubject(courseName: string): boolean {
  const lightKeywords = [
    'seminar', 'soft skills', 'mini project', 'project work', 'internship',
    'logic', 'ethics', 'constitution', 'environmental', 'evs', 'english',
    'communication', 'management', 'economics', 'finance', 'entrepreneurship'
  ];
  return lightKeywords.some(keyword =>
    courseName.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Main scheduling function
export function generateOptimizedTimetable(
  selectedClasses: SelectedClass[],
  existingTimetable: any[] = [],
  constraints: ScheduleConstraints = DEFAULT_CONSTRAINTS
): { schedule: GeneratedSlot[]; facultyWorkloads: FacultyWorkload[]; justification: string[] } {
  const schedule: GeneratedSlot[] = [];
  const justification: string[] = [];

  const slotTracker = new SlotTracker();
  const facultyTracker = new FacultyScheduleTracker();
  const roomTracker = new RoomScheduleTracker();
  const subjectTracker = new SubjectScheduleTracker(); // Track subject periods per day

  // Mark existing slots
  slotTracker.markExistingSchedule(existingTimetable);

  // Separate labs and theory classes
  const labs = selectedClasses.filter(c => c.isLab);
  const theory = selectedClasses.filter(c => !c.isLab);

  // Further categorize theory
  const coreTheory = theory.filter(c => isCoreSubject(c.classData.courses?.name || ''));
  const lightTheory = theory.filter(c => isLightSubject(c.classData.courses?.name || ''));
  const regularTheory = theory.filter(c =>
    !isCoreSubject(c.classData.courses?.name || '') &&
    !isLightSubject(c.classData.courses?.name || '')
  );

  justification.push(`📚 Identified ${coreTheory.length} core subjects for morning priority`);
  justification.push(`📝 Identified ${lightTheory.length} light subjects for Friday/Saturday preference`);
  justification.push(`🔬 Scheduling ${labs.length} lab sessions in afternoon slots`);

  // 1. Schedule labs first (they need consecutive slots)
  for (const lab of labs) {
    const teacherId = lab.classData.teacher_id;
    const courseName = `${lab.classData.courses?.name || 'Unknown'} LAB`;
    const courseCode = `${lab.classData.courses?.code || '---'}-LAB`;
    const facultyName = lab.classData.profiles?.full_name || 'TBA';
    let assignedCount = 0;

    // Shuffle days for fair distribution
    const shuffledDays = shuffle([...DAYS]);

    for (const day of shuffledDays) {
      if (assignedCount >= lab.classesPerWeek) break;

      // Get consecutive slots (prefer afternoon)
      const consecutivePairs = slotTracker.getConsecutiveSlots(day, 2, constraints.preferLabsInAfternoon);

      for (const pair of consecutivePairs) {
        if (assignedCount >= lab.classesPerWeek) break;

        // Check faculty availability
        if (!facultyTracker.canAssign(teacherId, day, pair, true, constraints)) continue;

        // Check subject-per-day constraint (labs count as 2 periods)
        if (!subjectTracker.canAssign(lab.id, day, 2, constraints.maxPeriodsPerSubjectPerDay)) continue;

        // Find available lab room
        const room = roomTracker.getAvailableRoom(LABS, day, pair);
        if (!room) continue;

        // Assign the lab
        slotTracker.markUsed(day, pair);
        facultyTracker.assignSlot(teacherId, day, pair, true);
        roomTracker.assignSlot(room, day, pair);
        subjectTracker.assignPeriods(lab.id, day, 2); // Track lab periods

        schedule.push({
          class_id: lab.id,
          teacher_id: teacherId,
          day_of_week: day,
          start_time: TIME_SLOTS[pair[0]].start,
          end_time: TIME_SLOTS[pair[1]].end,
          room,
          courseName,
          courseCode,
          section: lab.classData.section,
          facultyName,
          isLab: true,
          slotIndices: pair,
        });

        assignedCount++;
        break;
      }
    }

    if (assignedCount < lab.classesPerWeek) {
      justification.push(`⚠️ Could only assign ${assignedCount}/${lab.classesPerWeek} sessions for ${courseName}`);
    }
  }

  justification.push(`✅ Labs scheduled in ${constraints.preferLabsInAfternoon ? 'afternoon' : 'available'} slots with 2 consecutive periods`);

  // Helper to schedule a theory class
  const scheduleTheoryClass = (
    classItem: SelectedClass,
    preferredDays: DayOfWeek[],
    preferMorning: boolean
  ) => {
    const teacherId = classItem.classData.teacher_id;
    const courseName = classItem.classData.courses?.name || 'Unknown';
    const courseCode = classItem.classData.courses?.code || '---';
    const facultyName = classItem.classData.profiles?.full_name || 'TBA';
    let assignedCount = 0;

    // Days ordered by preference, then shuffled within preference groups
    const orderedDays = preferredDays.length > 0
      ? [...preferredDays, ...DAYS.filter(d => !preferredDays.includes(d))]
      : shuffle([...DAYS]);

    // For even distribution, sort by faculty's current load
    const daysByLoad = orderedDays.sort((a, b) => {
      if (constraints.distributeWorkloadEvenly) {
        return facultyTracker.getFacultyPeriodsPerDay(teacherId, a) -
          facultyTracker.getFacultyPeriodsPerDay(teacherId, b);
      }
      return 0;
    });

    for (const day of daysByLoad) {
      if (assignedCount >= classItem.classesPerWeek) break;

      // Check faculty constraints
      if (facultyTracker.getFreePeriods(teacherId, day) < constraints.minFreePeriodPerFacultyPerDay + 1) {
        continue; // Need at least one free period after this assignment
      }

      // Check subject-per-day constraint before trying this day
      if (!subjectTracker.canAssign(classItem.id, day, 1, constraints.maxPeriodsPerSubjectPerDay)) {
        continue; // Already at max periods for this subject today
      }

      // Get available slots (prefer morning for core subjects)
      let availableSlots: number[];
      if (preferMorning && constraints.coreSubjectsInMorning) {
        availableSlots = [
          ...slotTracker.getAvailableSlots(day, 'morning'),
          ...slotTracker.getAvailableSlots(day, 'afternoon'),
        ];
      } else {
        availableSlots = slotTracker.getAvailableSlots(day);
      }

      // Avoid slots adjacent to labs if constraint is set
      if (constraints.avoidTheoryAroundLabs) {
        const labSlots = schedule
          .filter(s => s.isLab && s.day_of_week === day && s.teacher_id === teacherId)
          .flatMap(s => s.slotIndices);

        availableSlots = availableSlots.filter(idx => {
          const isAdjacentToLab = labSlots.some(labIdx =>
            Math.abs(idx - labIdx) === 1 || idx === labIdx
          );
          return !isAdjacentToLab;
        });
      }

      for (const slotIdx of availableSlots) {
        if (assignedCount >= classItem.classesPerWeek) break;

        // Re-check subject constraint (in case we already assigned one this day in this loop)
        if (!subjectTracker.canAssign(classItem.id, day, 1, constraints.maxPeriodsPerSubjectPerDay)) break;

        // Check faculty can take this slot
        if (!facultyTracker.canAssign(teacherId, day, [slotIdx], false, constraints)) continue;

        // Find available room
        const room = roomTracker.getAvailableRoom(ROOMS, day, [slotIdx]);
        if (!room) continue;

        // Assign
        slotTracker.markUsed(day, [slotIdx]);
        facultyTracker.assignSlot(teacherId, day, [slotIdx], false);
        roomTracker.assignSlot(room, day, [slotIdx]);
        subjectTracker.assignPeriods(classItem.id, day, 1); // Track subject period

        schedule.push({
          class_id: classItem.id,
          teacher_id: teacherId,
          day_of_week: day,
          start_time: TIME_SLOTS[slotIdx].start,
          end_time: TIME_SLOTS[slotIdx].end,
          room,
          courseName,
          courseCode,
          section: classItem.classData.section,
          facultyName,
          isLab: false,
          slotIndices: [slotIdx],
        });

        assignedCount++;
      }
    }

    return assignedCount >= classItem.classesPerWeek;
  };

  // 2. Schedule core subjects (prefer morning)
  for (const classItem of coreTheory) {
    const success = scheduleTheoryClass(classItem, [], true);
    if (!success) {
      justification.push(`⚠️ Could not fully schedule ${classItem.classData.courses?.name}`);
    }
  }
  justification.push(`✅ Core subjects prioritized for morning sessions`);

  // 3. Schedule light subjects (prefer Friday/Saturday)
  for (const classItem of lightTheory) {
    const success = scheduleTheoryClass(classItem, constraints.lightSubjectsOnLightDays ? LIGHT_DAYS : [], false);
    if (!success) {
      justification.push(`⚠️ Could not fully schedule ${classItem.classData.courses?.name}`);
    }
  }
  if (lightTheory.length > 0) {
    justification.push(`✅ Light subjects (seminar, soft skills) placed on Friday/Saturday`);
  }

  // 4. Schedule regular theory
  for (const classItem of regularTheory) {
    scheduleTheoryClass(classItem, [], false);
  }

  // Build faculty workloads
  const facultyMap = new Map<string, FacultyWorkload>();

  for (const slot of schedule) {
    if (!facultyMap.has(slot.teacher_id)) {
      facultyMap.set(slot.teacher_id, {
        teacherId: slot.teacher_id,
        teacherName: slot.facultyName,
        periodsPerDay: new Map(),
        totalPeriods: 0,
        morningPeriods: 0,
        afternoonPeriods: 0,
        daySchedule: new Map(),
      });
    }

    const workload = facultyMap.get(slot.teacher_id)!;
    const periodCount = slot.slotIndices.length;

    // Update periods per day
    const currentDayPeriods = workload.periodsPerDay.get(slot.day_of_week) || 0;
    workload.periodsPerDay.set(slot.day_of_week, currentDayPeriods + periodCount);

    // Update totals
    workload.totalPeriods += periodCount;

    // Morning vs afternoon
    const isMorning = slot.slotIndices.some(idx => idx <= 3);
    if (isMorning) {
      workload.morningPeriods += periodCount;
    } else {
      workload.afternoonPeriods += periodCount;
    }

    // Add to day schedule
    if (!workload.daySchedule.has(slot.day_of_week)) {
      workload.daySchedule.set(slot.day_of_week, []);
    }
    workload.daySchedule.get(slot.day_of_week)!.push(slot);
  }

  // Add workload justification
  facultyMap.forEach((workload, _) => {
    const maxPeriodsAnyDay = Math.max(...Array.from(workload.periodsPerDay.values()), 0);
    if (maxPeriodsAnyDay <= constraints.maxTheoryPerFacultyPerDay + 2) { // +2 for labs
      justification.push(`✅ ${workload.teacherName}: Max ${maxPeriodsAnyDay} periods/day, balanced across week`);
    }
  });

  justification.push(`📊 Faculty constraints: Max ${constraints.maxTheoryPerFacultyPerDay} theory/day, ≤${constraints.maxContinuousTheory} continuous`);
  justification.push(`📊 Subject constraint: Max ${constraints.maxPeriodsPerSubjectPerDay} periods of same subject per day`);
  justification.push(`✅ Generated ${schedule.length} total time slots`);

  return {
    schedule,
    facultyWorkloads: Array.from(facultyMap.values()),
    justification,
  };
}
