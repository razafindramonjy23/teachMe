// Matricule format: PA-{LOCATION}-{USER_TYPE}-{YEAR_MONTH}-{SEQUENCE}
// Example: PA-010-STU-2603-045

export const LOCATIONS = {
  ALAROBIA: '010',
  AMBOHIBAO: '020',
  ANDOHARANOFOTSY: '030',
} as const

export const USER_TYPES = {
  STUDENT: 'STU',
  ONLINE: 'ONL',
  TEACHER: 'TEA',
  ADMIN: 'ADM',
  INTERNSHIP: 'INT',
  PEDAGOGY: 'PED',
} as const

export const USER_TYPE_LABELS = {
  student: 'Étudiant',
  staff: 'Personnel',
} as const

export const COURSE_LEVELS = ['BEPC', 'BAC'] as const

export const LOCATION_NAMES: Record<string, string> = {
  '010': 'Alarobia',
  '020': 'Ambohibao',
  '030': 'Andoharanofotsy',
}

type Location = typeof LOCATIONS[keyof typeof LOCATIONS]
type UserType = typeof USER_TYPES[keyof typeof USER_TYPES]

/**
 * Generate a matricule for students
 * Format: PA-{LOCATION}-STU-{YEAR_MONTH}-{SEQUENCE}
 */
export function generateMatricule(location: Location, sequence: number): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2) // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const yearMonth = year + month
  const sequenceStr = String(sequence).padStart(3, '0')

  return `PA-${location}-${USER_TYPES.STUDENT}-${yearMonth}-${sequenceStr}`
}

/**
 * Parse a matricule and extract its components
 */
export function parseMatricule(matricule: string): {
  prefix: string
  location: string
  userType: string
  yearMonth: string
  sequence: string
} | null {
  const parts = matricule.split('-')
  if (parts.length !== 5) return null

  return {
    prefix: parts[0],
    location: parts[1],
    userType: parts[2],
    yearMonth: parts[3],
    sequence: parts[4],
  }
}

/**
 * Validate a matricule format
 */
export function isValidMatricule(matricule: string): boolean {
  const parsed = parseMatricule(matricule)
  if (!parsed) return false

  const { prefix, location, userType, yearMonth, sequence } = parsed
  const locationValues = Object.values(LOCATIONS)

  return (
    prefix === 'PA' &&
    locationValues.includes(location as Location) &&
    userType === USER_TYPES.STUDENT &&
    /^\d{4}$/.test(yearMonth) &&
    /^\d{3}$/.test(sequence)
  )
}

/**
 * Get location name from code
 */
export function getLocationName(code: string): string {
  return LOCATION_NAMES[code] || 'Unknown'
}
