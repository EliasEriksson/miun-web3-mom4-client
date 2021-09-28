import {translate, Course} from "./constants.js";

export const shake = (element: HTMLElement, duration: number = 500) => {
    element.classList.add("error-shake");
    setTimeout(() => {
        element.classList.remove("error-shake");
    }, duration);
}

export const writeErrors = (course: Course, errorElement: HTMLParagraphElement) => {
    let errors: string[] = [];
    for (const attribute in course) {
        errors.push(`${translate[attribute]}: ${course[attribute].join(" ")} `);
    }
    errorElement.innerText = errors.join(" ");
}