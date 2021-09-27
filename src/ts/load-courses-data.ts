import {currentURL, requestEndpoint, redirect} from "./url.js";
import {render} from "./xrender.js";


export type Course = {
    code: string,
    name: string,
    progression: string,
    plan: string
}

export type ApiResponse = {
    count: number,
    next: string|null,
    previous: string|null,
    results: Course[]
}


if (!currentURL.searchParams.has("token")) {
    redirect(currentURL, "authenticate/");
}

const token = currentURL.searchParams.get("token");


const renderResponse = (resultDataElement: HTMLDivElement, template: string, courses: Course[]) => {
    let spacer = document.createElement("div");
    spacer.classList.add("spacer");

    const code_href = new URL(currentURL.href);
    code_href.pathname += "edit/";
    code_href.searchParams.append("code", null);

    for (const course of courses) {
        code_href.searchParams.set("code", course.code);
        resultDataElement.appendChild(spacer.cloneNode());
        course["code_href"] = code_href.href;
        resultDataElement.appendChild(render(template, course));
    }
}

const getRequest = async (resultDataElement: HTMLDivElement, template: string) => {
    let apiResponse: ApiResponse = await requestEndpoint("courses/", token);
    renderResponse(resultDataElement, template, apiResponse.results);
}

const postRequest = async (resultDataElement: HTMLDivElement, template: string, requestData: Course) => {
    let course: Course = await requestEndpoint("courses/", token, "POST", requestData);
    renderResponse(resultDataElement, template, [course]);
};


window.addEventListener("load", async () => {
    const resultDataElement = <HTMLDivElement>document.getElementById("result-data");
    const postElement = <HTMLInputElement>document.getElementById("post");
    const codeElement = <HTMLInputElement>document.getElementById("code");
    const nameElement = <HTMLInputElement>document.getElementById("name");
    const progressionElement = <HTMLInputElement>document.getElementById("progression");
    const planElement = <HTMLInputElement>document.getElementById("plan");

    let response = await fetch("./templates/result-row.html");
    let template = await response.text();

    postElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await postRequest(resultDataElement, template, {
            code: codeElement.value,
            name: nameElement.value,
            progression: progressionElement.value,
            plan: planElement.value
        });

    });
    await getRequest(resultDataElement, template);
});