export type Course = {
    code: string,
    name: string,
    progression: string,
    plan: string
}

export const translate: Course = {
    code: "Kurskod",
    name: "Kursnamn",
    progression: "Progression",
    plan: "Kursplan"
}

export type PageinatedResponse = {
    count: number,
    next: string|null,
    previous: string|null,
    results: Course[]
}

let banana = "banana";
let bananaArr = [...banana];
console.log(bananaArr);