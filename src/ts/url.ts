export const apiURL = new URL("https://web3mom5rest.eliaseriksson.eu/");
export const currentURL = new URL(document.location.href);

type RequestMethods = "GET" | "POST" | "PUT" | "DELETE";


/**
 * adds the path 'to' to the 'from' url
 *
 * modifies the given URL in place and returns the URL object as well.
 *
 * @param from: a URL object, this will almost always be set to currentURL.
 * @param to: a string to add onto the URL pathname.
 */
export const updateURL = (from: URL, to: string): URL => {
    if (to.startsWith("/")) {
        // absolute URL
        from.pathname = to;
    } else {
        // relative URL
        if (from.pathname.endsWith("/")) {
            // to did not specify a file (.../) in the request
            // so the to location can simply be added on top of it.
            from.pathname += to;
        } else {
            // to does specify a specific file (.../index.html) in the request
            // so teh location is added onto before the file.
            // hopefully the file was index.html otherwise it most likely will fail.
            let pathParts = from.pathname.split("/");
            if (to.endsWith("/")) {
                pathParts[pathParts.length - 2] += `/${to.substring(0, to.length - 1)}`
            } else {
                pathParts[pathParts.length - 2] += `/${to}`;
            }
            from.pathname = pathParts.join("/");
        }
    }
    return from;
}


/**
 * redirects the user from one page to another.
 *
 * @param from: a URL object
 * @param to: where to redirect to.
 */
export const redirect = (from: URL, to: string): never => {
    document.location.href = updateURL(from, to).href;
    throw "Redirecting"; // adding this so ts understands this function never returns
}

/**
 * requests an api key for a specific user.
 *
 * @param username: the users username
 * @param password: the users password.
 */
export const requestToken = async (username: string, password: string): Promise<{ token: string }> => {
    let response =  await fetch(`${apiURL.href}token/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    });
    return await response.json();
}

/**
 * a general function to preform GET / POST / PUT / DELETE request.
 *
 * necessary headers will be set as needed.
 *
 * @param endpoint: the api endpoint to request
 * @param token: the authentication token. required for POST / PUT / DELETE.
 * @param method: the request method.
 * @param data: general data to be sent with the request.
 */
export const requestEndpoint = async (
    endpoint: string,
    token: string|null,
    method: RequestMethods = "GET",
    data: object|undefined = undefined): Promise<[any, number]> => {
    let init: RequestInit = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        }
    }
    if (token) {
        init.headers["Authorization"] = `Token ${token}`;
    }
    if (data) {
        init["body"] = JSON.stringify(data);
    }

    let response = await fetch(`${apiURL.href}${endpoint}`, init);
    if (method === "DELETE") {
        return null;
    }
    return [await response.json(), response.status];
}

/**
 * request file from the template directory.
 *
 * this template will be used with the render function in xrender.ts
 *
 * @param templateName: filename of the template.
 */
export const requestTemplate = async (templateName: string) => {
    let response = await fetch(`./templates/${templateName}`);
    return  await response.text();
}