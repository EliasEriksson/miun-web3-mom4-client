import {currentURL, requestEndpoint, redirect} from "./url.js";
import {shake, writeErrors} from "./error.js";
import {Course} from "./constants.js";
import {logout} from "./triggers.js";

/**
 * if the user doesnt have a token they have no access right to this page so they are redirected to login
 */
if (!localStorage.getItem("token")) {
    if (currentURL.searchParams.has("code")) {
        currentURL.searchParams.delete("code");
    }
    redirect(currentURL, "../");
}

/**
 * if the get param code is missing from the URL the course to query is unknown and the user is redirected.
 */
if (!currentURL.searchParams.has("code")) {
    redirect(currentURL, "../");
}

/**
 * acquires the course that should be edited
 *
 * @param code: the course code
 * @param token: the authentication token
 */
const getRequest = async (code: string, token: string): Promise<Course> => {
    const [course, status]: [Course, number] = await requestEndpoint(`courses/${code}/`, token);
    if (200 <= status && status < 300) {
        return course;
    } else {
        redirect(currentURL, "../");
    }
}

/**
 * updates the course.
 *
 * @param course: the course code.
 * @param token: the authentication token.
 * @param errorElement: HTMLElement display errors.
 */
const updateRequest = async (course: Course, token: string, errorElement: HTMLParagraphElement) => {
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


/***
 * deletes the course.
 *
 * @param code: the course code.
 * @param token: the authentication token.
 */
const deleteRequest = async (code: string, token: string) => {
    if (confirm(`Kursen ${code} kommer att tas bort. Det går inte att ångra. Är du säker på att du vill ta bort kursen ${code}?`)) {
        await requestEndpoint(`courses/${code}/`, token, "DELETE", {
            code: code
        });
        currentURL.searchParams.delete("code");
        redirect(currentURL, "../");
    }
}

window.addEventListener("load", async () => {
    const updateElement = <HTMLInputElement>document.getElementById("update");
    const deleteElement = <HTMLInputElement>document.getElementById("delete");
    const errorElement = <HTMLParagraphElement>document.getElementById("error");

    const codeElement = <HTMLInputElement>document.getElementById("code");
    const nameElement = <HTMLInputElement>document.getElementById("name");
    const progressionElement = <HTMLInputElement>document.getElementById("progression");
    const planElement = <HTMLInputElement>document.getElementById("plan");
    const logoutElement = document.getElementById("logout");

    const token = localStorage.getItem("token");

    const course = await getRequest(currentURL.searchParams.get("code"), token);


    // fills the inputs with the course details
    codeElement.value = course.code;
    nameElement.value = course.name;
    progressionElement.value = course.progression;
    planElement.value = course.plan;

    logoutElement.addEventListener("click", (event) => {
        logout(event);
    });

    /**
     * if update is clicked the inputs are read and are send with an update request.
     */
    updateElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await updateRequest({
            code: codeElement.value,
            name: nameElement.value,
            progression: progressionElement.value,
            plan: planElement.value
        }, token, errorElement);
    });

    /**
     * if the delete is clicked a delete request is sent for the course id.
     */
    deleteElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await deleteRequest(course.code, token);
    });
});
