import {currentURL, requestEndpoint, redirect} from "./url.js";
import {shake, writeErrors} from "./error.js";
import {Course} from "./constants.js";


if (!localStorage.getItem("token")) {
    redirect(currentURL, "authenticate/");
}

const token = localStorage.getItem("token");

if (!currentURL.searchParams.has("code")) {
    redirect(currentURL, "../");
}


const getRequest = async (
    code: string,
    codeElement: HTMLInputElement,
    nameElement: HTMLInputElement,
    progressionElement: HTMLInputElement,
    planElement: HTMLInputElement): Promise<Course> => {
    const [course, status]: [Course, number] = await requestEndpoint(`courses/${code}/`, token);
    if (200 <= status && status < 300) {
        codeElement.value = course.code;
        nameElement.value = course.name;
        progressionElement.value = course.progression;
        planElement.value = course.plan;
        return course;
    } else {
        redirect(currentURL, "../");
    }

}

const updateRequest = async (course: Course, errorElement: HTMLParagraphElement) => {
    let [newCourse, status]: [Course, number] = await requestEndpoint(
        `courses/${course.code}/`, token, "PUT", course
    );
    if (200 <= status && status < 300) {
        currentURL.searchParams.delete("code");
        redirect(currentURL, "../");
    } else {
        writeErrors(newCourse, errorElement);
        shake(errorElement);
    }
}

const deleteRequest = async (code: string) => {
    if (confirm(`Kursen ${code} kommer att tas bort. Det går inte att ångra. Är du säker på att du vill ta bort kursen ${code}?`)) {
        await requestEndpoint(`courses/${code}/`, token, "DELETE", {
            code: code
        });
        currentURL.searchParams.delete("code");
        redirect(currentURL, "../");
    }
}

window.addEventListener("load", async () => {
    const updateElement = document.getElementById("update");
    const deleteElement = document.getElementById("delete");
    const errorElement = <HTMLParagraphElement>document.getElementById("error");

    const codeElement = <HTMLInputElement>document.getElementById("code");
    const nameElement = <HTMLInputElement>document.getElementById("name");
    const progressionElement = <HTMLInputElement>document.getElementById("progression");
    const planElement = <HTMLInputElement>document.getElementById("plan");

    const course = await getRequest(
        currentURL.searchParams.get("code"),
        codeElement, nameElement, progressionElement, planElement
    );

    updateElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await updateRequest({
            code: codeElement.value,
            name: nameElement.value,
            progression: progressionElement.value,
            plan: planElement.value
        }, errorElement);
    });

    deleteElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await deleteRequest(course.code);
    });
});