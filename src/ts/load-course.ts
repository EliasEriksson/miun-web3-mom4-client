import {currentURL, requestEndpoint, redirect} from "./url.js";


type Course = {
    code: string,
    name: string,
    progression: string,
    plan: string
}

if (!currentURL.searchParams.has("token")) {
    redirect(currentURL, "authenticate/");
}
const token = currentURL.searchParams.get("token");

if (!currentURL.searchParams.has("code")) {
    redirect(currentURL, "../");
}


const getRequest = async (
    code: string,
    codeElement: HTMLInputElement,
    nameElement: HTMLInputElement,
    progressionElement: HTMLInputElement,
    planElement: HTMLInputElement): Promise<Course> => {
    const course: Course = await requestEndpoint(`courses/${code}/`, token);
    codeElement.value = course.code;
    nameElement.value = course.name;
    progressionElement.value = course.progression;
    planElement.value = course.plan;
    return course;
}


const updateRequest = async (course: Course) => {
    await requestEndpoint(`courses/${course.code}/`, token, "PUT", course);
    currentURL.searchParams.delete("code");
    redirect(currentURL, "../");
}


const deleteRequest = async (code: string) => {
    await requestEndpoint(`courses/${code}/`, token, "DELETE", {
        code: code
    });
    currentURL.searchParams.delete("code");
    redirect(currentURL, "../");
}


window.addEventListener("load", async () => {
    const updateElement = document.getElementById("update");
    const deleteElement = document.getElementById("delete");

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
        });
    });

    deleteElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await deleteRequest(course.code);
    });
});