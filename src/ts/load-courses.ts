import {currentURL, requestEndpoint, redirect} from "./url.js";
import {render} from "./xrender.js";
import {shake, writeErrors} from "./error.js";
import {PageinatedResponse, Course} from "./constants.js";


if (!localStorage.getItem("token")) {
    redirect(currentURL, "authenticate/");
}
const token = localStorage.getItem("token");


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

const getRequest = async (resultDataElement: HTMLDivElement, template: string, errorElement: HTMLParagraphElement) => {
    let [apiResponse, status]: [PageinatedResponse, number] = await requestEndpoint("courses/", token);
    if (200 <= status && status < 300) {
        renderResponse(resultDataElement, template, apiResponse.results);
    } else {
        errorElement.innerText = "Något gick fel när data hämtades.";
        shake(errorElement);
    }
}

const postRequest = async (resultDataElement: HTMLDivElement, template: string, requestData: Course, errorElement: HTMLParagraphElement) => {
    let [course, status]: [Course, number] = await requestEndpoint("courses/", token, "POST", requestData);
    if (200 <= status && status < 300) {
        if (resultDataElement.children.length < 20) {
            renderResponse(resultDataElement, template, [course]);
        }
    } else {
        writeErrors(course, errorElement);
        shake(errorElement);
    }
};


window.addEventListener("load", async () => {
    const resultDataElement = <HTMLDivElement>document.getElementById("result-data");
    const postElement = <HTMLInputElement>document.getElementById("post");
    const codeElement = <HTMLInputElement>document.getElementById("code");
    const nameElement = <HTMLInputElement>document.getElementById("name");
    const progressionElement = <HTMLInputElement>document.getElementById("progression");
    const planElement = <HTMLInputElement>document.getElementById("plan");
    const errorElement = <HTMLParagraphElement>document.getElementById("error");

    let response = await fetch("./templates/result-row.html");
    let template = await response.text();

    postElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await postRequest(resultDataElement, template, {
            code: codeElement.value,
            name: nameElement.value,
            progression: progressionElement.value,
            plan: planElement.value
        }, errorElement);

    });
    await getRequest(resultDataElement, template, errorElement);
});