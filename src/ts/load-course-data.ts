import {render} from "./xrender.js";
render("", {});
type Callable = () => void;

class MediaQuery {
    private query: MediaQueryList;
    private readonly activate: Callable;
    private readonly deactivate: Callable;
    private active: boolean;

    constructor(query: string, activate: Callable, deactivate = activate) {
        this.query = window.matchMedia(query);
        this.activate = activate;
        this.deactivate = deactivate;
    }

    check = () => {
        if (this.query.matches && !this.active) {
            this.active = false;
            this.deactivate();
        } else if (!this.query.matches && this.active) {
            this.active = true;
            this.activate();
        }
    }

    init = async () => {
        this.check();

        window.addEventListener("resize", () => {
            this.check();
        });
    }
}


class DataLoader {
    private templates: {
        "result-heading-desktop": string,
        "result-row-desktop": string,
        "result-row-mobile": string
    };
    
    private readonly query: string;
    private mediaQuery: MediaQuery;

    constructor(query: string) {
        this.query = query;
    }

    fetchTemplate = async (url) => {
        let response = await fetch(url);
        this.templates[url.split("/")[1].split(".")[0]] = await response.text();
    }

    init = async () => {
        await Promise.allSettled([
            this.fetchTemplate("templates/result-heading-desktop.html"),
            this.fetchTemplate("templates/result-row-desktop.html"),
            this.fetchTemplate("templates/result-row-mobile.html")
        ]);
        this.mediaQuery = new MediaQuery(this.query,
            () => {
                let row = render(this.templates["result-row-mobile"], {

                });
            },
            () => {
                render(this.templates["result-heading-desktop"], {});
                render(this.templates["result-row-desktop"], {

                });
            }
        );
    }
}

// window.addEventListener("load", async () => {
//     let dl = new DataLoader("screen and (max-width: 500px)");
//     await dl.init();
// });
