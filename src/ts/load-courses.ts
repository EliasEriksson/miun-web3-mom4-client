import {currentURL, requestEndpoint, redirect, requestTemplate} from "./url.js";
import {render} from "./xrender.js";
import {shake, writeErrors} from "./error.js";
import {PageinatedResponse, Course} from "./constants.js";
import {logout} from "./triggers.js";


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

const renderPaginator = (count: number, next: string|null, previous: string|null, paginatorElement: HTMLDivElement, paginatorList: HTMLUListElement, trigger) =>  {
    let limit: number;
    let offset: number;

    while (paginatorList.children.length > 4) {
        paginatorList.removeChild(paginatorList.children[2]);
    }

    if (next) {
        let nextURL = new URL(next);
        limit = parseInt(nextURL.searchParams.get("limit"));
        offset = parseInt(nextURL.searchParams.get("offset"));
    } else if (previous) {
        let previousURL = new URL(previous);
        limit = parseInt(previousURL.searchParams.get("limit"));
        if (previousURL.searchParams.has("offset")) {
            offset = parseInt(previousURL.searchParams.get("offset"));
        } else {
            offset = 0;
        }
    } else {
        return;
    }

    let pageCount = Math.ceil(count / limit);
    let currentPageNumber = offset / limit;
    let page: HTMLLIElement;
    let paginatorNextNode = paginatorList.children[2]

    for (let i = Math.max(1, currentPageNumber - 2); i <= Math.min(currentPageNumber + 2, pageCount); i++) {
        page = document.createElement("li");
        page.addEventListener("click", async () => {
            console.log("clicked!")
            await trigger(`?offset=${offset * (i - 1)}&limit=${limit}`);
        });
        if (i === currentPageNumber) {
            page.classList.add("current-page");
        }
        page.innerHTML = `${i}`;
        paginatorList.insertBefore(page, paginatorNextNode)
    }
}

const getRequest = async (resultDataElement: HTMLDivElement, resultTemplate: string, paginatorElement: HTMLDivElement, paginatorList: HTMLUListElement, errorElement: HTMLParagraphElement, queryParams: string = "") => {
    console.log("requesting with: ", queryParams);
    resultDataElement.innerHTML = "";
    let [apiResponse, status]: [PageinatedResponse, number] = await requestEndpoint(`courses/${queryParams}`, token);
    if (200 <= status && status < 300) {
        renderPaginator(apiResponse.count, apiResponse.next, apiResponse.previous, paginatorElement, paginatorList, async (queryParams) => {
            await getRequest(resultDataElement, resultTemplate, paginatorElement, paginatorList, errorElement, queryParams);
        });
        renderResponse(resultDataElement, resultTemplate, apiResponse.results);
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
    const logoutElement = <HTMLInputElement>document.getElementById("logout");
    const paginatorElement = <HTMLDivElement>document.getElementById("paginator")
    const errorElement = <HTMLParagraphElement>document.getElementById("error");
    const paginatorUlElement = <HTMLUListElement>document.getElementById("pageinator-list");

    logoutElement.addEventListener("click", logout);

    const resultTemplate = await requestTemplate("./templates/result.html");

    postElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await postRequest(resultDataElement, resultTemplate, {
            code: codeElement.value,
            name: nameElement.value,
            progression: progressionElement.value,
            plan: planElement.value
        }, errorElement);

    });
    await getRequest(resultDataElement, resultTemplate, paginatorElement, paginatorUlElement, errorElement);
});