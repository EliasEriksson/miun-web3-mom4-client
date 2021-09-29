import {currentURL, requestEndpoint, redirect, requestTemplate} from "./url.js";
import {render} from "./xrender.js";
import {shake, writeErrors} from "./error.js";
import {PageinatedResponse, Course} from "./constants.js";
import {logout} from "./triggers.js";


if (!localStorage.getItem("token")) {
    redirect(currentURL, "authenticate/");
}

class CourseLoader {
    private readonly token: string;
    private readonly template: string;

    private readonly resultDataElement: HTMLDivElement;
    private readonly errorElement: HTMLParagraphElement;

    private codeElement: HTMLInputElement;
    private nameElement: HTMLInputElement;
    private progressionElement: HTMLInputElement;
    private planElement: HTMLInputElement;

    private paginatorElement: HTMLDivElement;
    private paginatorList: HTMLUListElement;

    private courseCount: number;
    private pageLimit: number;
    private pageOffset: number;

    constructor(token: string, template: string) {
        this.token = token;
        this.resultDataElement = <HTMLDivElement>document.getElementById("result-data");
        this.codeElement = <HTMLInputElement>document.getElementById("code");
        this.nameElement = <HTMLInputElement>document.getElementById("name");
        this.progressionElement = <HTMLInputElement>document.getElementById("progression");
        this.planElement = <HTMLInputElement>document.getElementById("plan");
        this.paginatorElement = <HTMLDivElement>document.getElementById("paginator")
        this.errorElement = <HTMLParagraphElement>document.getElementById("error");
        this.paginatorList = <HTMLUListElement>document.getElementById("pageinator-list");

        this.template = template;
        this.courseCount = 0;
        this.pageLimit = 10;
        this.pageOffset = 0;
    }

    static create = async (token) => {
        const template = await requestTemplate("./templates/result.html");
        return new CourseLoader(token, template);
    }

    updatePageDetails = (apiResponse: PageinatedResponse) => {
        this.courseCount = apiResponse.count;
        console.log(apiResponse)
        if (apiResponse.next) {
            let nextURL = new URL(apiResponse.next);
            this.pageLimit = parseInt(nextURL.searchParams.get("limit"));
            // current offset must be 'limit' less than next
            this.pageOffset = parseInt(nextURL.searchParams.get("offset")) - this.pageLimit;
        } else if (apiResponse.previous) {
            let previousURL = new URL(apiResponse.previous);
            this.pageLimit = parseInt(previousURL.searchParams.get("limit"));
            // if a previous link exist the current offset is 'limit' more than that
            // if the previous link have no offset we are on the last page
            if (previousURL.searchParams.has("offset")) {
                this.pageOffset = parseInt(previousURL.searchParams.get("offset")) + this.pageLimit;
            } else {
                this.pageOffset = Math.floor(this.courseCount / this.pageLimit) * this.pageLimit;
            }
        }
    }

    insertCourse = (course: Course) => {
        let results = this.resultDataElement;

        let codes: string[] = Array.from(results.children).filter((child) => {
            return !!child.children[0];
        }).map((child) => {
            return child.children[0].children[0].children[1].innerHTML.toUpperCase();
        });
        codes.push(course.code.toUpperCase());

        let index = codes.sort().indexOf(course.code.toUpperCase());
        if (index < this.pageLimit - 1) {
            this.resultDataElement.insertBefore(
                render(this.template, this.prepareCourse(course)),
                this.resultDataElement.children[index * 2 + 1]
            );
            this.resultDataElement.removeChild(this.resultDataElement.lastChild);
            this.resultDataElement.insertBefore(
                this.resultDataElement.lastChild, this.resultDataElement.children[index * 2 + 2]
            )
        }
    }

    prepareCourse = (course: Course): Course => {
        const code_href = new URL(currentURL.href);
        code_href.pathname += "edit/";
        code_href.searchParams.append("code", course.code);
        course["code_href"] = code_href.href;
        return course;
    }

    renderResponse = (courses: Course[]) => {
        let spacer = document.createElement("div");
        spacer.classList.add("spacer");

        for (const course of courses) {
            this.resultDataElement.appendChild(spacer.cloneNode());
            this.resultDataElement.appendChild(render(
                this.template, this.prepareCourse(course)
            ));
        }
    }

    renderPaginator = () => {
        this.paginatorElement.style.display = "none";
        this.paginatorList.innerHTML = "";

        this.paginatorElement.style.display = "flex";
        let pageCount = Math.ceil(this.courseCount / this.pageLimit);
        let currentPageNumber = this.pageOffset / this.pageLimit;
        let page: HTMLLIElement;

        const start = Math.max(0, currentPageNumber - 2);
        const end = Math.min(currentPageNumber + 3, pageCount);
        for (let pageNumber = start; pageNumber < end; pageNumber++) {
            page = document.createElement("li");
            page.addEventListener("click", async () => {
                await this.getRequest(
                    `?offset=${this.pageLimit * (pageNumber)}&limit=${this.pageLimit}`
                );
            });

            if (pageNumber === currentPageNumber) {
                page.classList.add("current-page");
            }
            page.innerHTML = `${pageNumber + 1}`;
            this.paginatorList.appendChild(page);
        }
    }

    getRequest = async (queryParams: string = "") => {
        this.resultDataElement.innerHTML = "";
        let [apiResponse, status]: [PageinatedResponse, number] = await requestEndpoint(
            `courses/${queryParams}`, this.token
        );
        if (200 <= status && status < 300) {
            this.updatePageDetails(apiResponse)
            if (this.courseCount > this.pageLimit) {
                this.renderPaginator();
            }
            this.renderResponse(apiResponse.results);
        } else {
            this.errorElement.innerText = "Något gick fel när data hämtades.";
            shake(this.errorElement);
        }
    }

    postRequest = async () => {
        let [course, status]: [Course, number] = await requestEndpoint(
            "courses/", this.token, "POST", {
                code: this.codeElement.value,
                name: this.nameElement.value,
                progression: this.progressionElement.value,
                plan: this.planElement.value
            });
        if (200 <= status && status < 300) {
            this.courseCount += 1;
            this.insertCourse(course);
            if (this.resultDataElement.children.length < this.pageLimit * 2) {
            } else {
                this.renderPaginator();
            }
        } else {
            writeErrors(course, this.errorElement);
            shake(this.errorElement);
        }
    }
}

window.addEventListener("load", async () => {
    const token = localStorage.getItem("token");
    const postElement = <HTMLInputElement>document.getElementById("post");
    const logoutElement = <HTMLInputElement>document.getElementById("logout");
    logoutElement.addEventListener("click", logout);

    const loader = await CourseLoader.create(token);

    postElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await loader.postRequest();
    });

    await loader.getRequest();
});