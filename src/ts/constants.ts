/**
 * type for a javascript course
 */
export type Course = {
    code: string,
    name: string,
    progression: string,
    plan: string
}

/**
 * an object used to at least translate the table columns to swedish
 */
export const translate: Course = {
    code: "Kurskod",
    name: "Kursnamn",
    progression: "Progression",
    plan: "Kursplan"
}

/**
 * type for a get response from the service.
 */
export type PageinatedResponse = {
    count: number,
    next: string|null,
    previous: string|null,
    results: Course[]
}