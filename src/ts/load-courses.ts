import {currentURL, requestEndpoint, redirect, updateURL, requestTemplate} from "./url.js";
import {render} from "./xrender.js";
import {shake, writeErrors} from "./error.js";
import {PageinatedResponse, Course} from "./constants.js";
import {logout} from "./triggers.js";


class CourseLoader {
    private readonly token: string;
    private readonly template: string;

    // i/o elements for results / errors
    private readonly resultDataElement: HTMLDivElement;
    private readonly errorElement: HTMLParagraphElement;

    // form elements
    private codeElement: HTMLInputElement;
    private nameElement: HTMLInputElement;
    private progressionElement: HTMLInputElement;
    private planElement: HTMLInputElement;

    //paginator elements
    private paginatorElement: HTMLDivElement;
    private paginatorList: HTMLUListElement;

    // helps to keep track on where in the list of courses to add a new course.
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
        let requireAuthForms = document.getElementsByClassName("require-auth");
        let loginForm = document.getElementsByClassName("acquire-auth");
        let loginElement = document.getElementById("login")

        loginElement.addEventListener("click", (event) => {
            event.preventDefault();
            redirect(currentURL, "authenticate/");
        })

        if (token) {
            // user is logged in so forms that requires authentication can be viewed.
            for (let i = 0; i < requireAuthForms.length; i++) {
                (<HTMLElement>requireAuthForms.item(i)).style.display = "grid";
            }
        } else {
            // user is not logged in. viewing forms for login.
            for (let i = 0; i < loginForm.length; i++) {
                (<HTMLElement>loginForm.item(i)).style.display = "grid";
            }
        }

        this.template = template;
        this.courseCount = 0;
        this.pageLimit = 10;
        this.pageOffset = 0;
    }

    /**
     * an "asynchronous constructor" for load-courses.
     *
     * this method is fully capable of properly initializing this class.
     */
    static create = async () => {
        let token = localStorage.getItem("token");
        let templateName = "result-no-auth.html";
        if (token) {
            templateName = "result.html"
        }
        const template = await requestTemplate(templateName);
        return new CourseLoader(token, template);
    }

    /**
     * updates the private properties: pageLimit, pageOffset and courseCount.
     *
     * the initial value for pageLimit is a "guess" on how many results the service prefers to serve
     * the service preferred value for pages will be knows as soon there is at least 2 pages worth of entries
     * in the database and getRequest is called.
     *
     * @param apiResponse: an ApiResponse structured object.
     */
    updatePageDetails = (apiResponse: PageinatedResponse) => {
        this.courseCount = apiResponse.count;
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

    /**
     * insert a course into the table of courses.
     *
     * the courses are sorted alphabetically and if a new course is created with a
     * POST request its inserted in the list of courses that is currently being viewed if
     * it fits into it alphabetically.
     *
     * @param course
     */
    insertCourse = (course: Course) => {
        let results = this.resultDataElement;

        let codes: string[] = Array.from(results.children).filter((child) => {
            // filters out the spacing linves from actual datarows
            return !!child.children[0];
        }).map((child) => {
            // gets the course codes in all uppercase
            return child.children[0].children[0].children[1].innerHTML.toUpperCase();
        });
        // adds the course code of the course to be inserted.
        codes.push(course.code.toUpperCase());
        // sort the list
        let index = codes.sort().indexOf(course.code.toUpperCase());
        // if the index is not last the new course should be inserted.
        if (index < this.pageLimit) {
            if (index === codes.length - 1) {
                if (codes.length > this.pageLimit) {
                    this.resultDataElement.removeChild(this.resultDataElement.lastChild);
                } else {
                    let spacer = document.createElement("div");
                    spacer.classList.add("spacer");
                    this.resultDataElement.appendChild(spacer);
                }
                this.resultDataElement.appendChild(
                    render(this.template, this.prepareCourse(course))
                )
            } else {
                this.resultDataElement.insertBefore(
                    render(this.template, this.prepareCourse(course)),
                    this.resultDataElement.children[index * 2 + 1]
                );
                if (index === codes.length - 1) {
                    this.resultDataElement.removeChild(this.resultDataElement.lastChild);
                    this.resultDataElement.insertBefore(
                        this.resultDataElement.lastChild, this.resultDataElement.children[index * 2 + 2]
                    );
                } else {
                    let spacer = document.createElement("div");
                    spacer.classList.add("spacer");
                    this.resultDataElement.insertBefore(
                        spacer, this.resultDataElement.children[index * 2 + 2]
                    )
                }

            }
        }
    }

    /**
     * prepares the course to be rendered.
     *
     * a code_href attribute is added that contains the api endpoint
     * for the specific course.
     *
     * @param course
     */
    prepareCourse = (course: Course): { [key: string]: string } => {
        const code_href = updateURL(new URL(currentURL.href), "edit/");
        updateURL(new URL(currentURL.href), "edit/");
        code_href.searchParams.append("code", course.code);
        course["code_href"] = code_href.href;
        course.code = course.code.toUpperCase()
        return course;
    }

    /**
     * renders a list of courses to HTML.
     *
     * @param courses: a list of courses to be rendered.
     */
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

    /**
     * renders the paginator to the page.
     */
    renderPaginator = () => {
        this.paginatorList.innerHTML = "";
        this.paginatorElement.style.display = "flex";

        let pageCount = Math.ceil(this.courseCount / this.pageLimit);
        let currentPageNumber = this.pageOffset / this.pageLimit;
        let page: HTMLLIElement;

        const start = Math.max(0, currentPageNumber - 2);
        const end = Math.min(currentPageNumber + 3, pageCount);
        for (let pageNumber = start; pageNumber < end; pageNumber++) {
            page = document.createElement("li");

            //if a page on the paginator i clicked a new get request is made.
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

    /**
     * makes a GET request to the service.
     *
     * the received courses are then rendered onto the page.
     * @param queryParams: query params for accessing different pages (used by renderPaginator)
     */
    getRequest = async (queryParams: string = "") => {
        this.resultDataElement.innerHTML = "";
        let [apiResponse, status]: [PageinatedResponse, number] = await requestEndpoint(
            `courses/${queryParams}`, this.token
        );
        if (200 <= status && status < 300) {
            this.updatePageDetails(apiResponse);
            if (this.courseCount > this.pageLimit) {
                this.renderPaginator();
            }
            this.renderResponse(apiResponse.results);
        } else {
            this.errorElement.innerText = "Något gick fel när data hämtades.";
            shake(this.errorElement);
        }
    }

    /**
     * creates a new course.
     *
     * if successful an attempt to insert it onto the page is made if it sorts lower alphabetically
     * than the the currently displayed courses.
     */
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
            if (this.courseCount > this.pageLimit) {
                this.renderPaginator();
            }
            this.codeElement.value = "";
            this.nameElement.value = "";
            this.progressionElement.value = "";
            this.planElement.value = "";
            this.codeElement.focus();
            this.errorElement.innerText = "";
        } else {
            writeErrors(course, this.errorElement);
            shake(this.errorElement);
        }
    }
}

window.addEventListener("load", async () => {
    const postElement = <HTMLInputElement>document.getElementById("post");
    const logoutElement = <HTMLInputElement>document.getElementById("logout");
    logoutElement.addEventListener("click", logout);

    const loader = await CourseLoader.create();

    postElement.addEventListener("click", async (event) => {
        event.preventDefault();
        await loader.postRequest();
    });

    await loader.getRequest();
});