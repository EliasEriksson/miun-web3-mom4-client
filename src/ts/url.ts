export const apiURL = new URL("https://web3mom5rest.eliaseriksson.eu/");
export const currentURL = new URL(document.location.href);

type RequestMethods = "GET" | "POST" | "PUT" | "DELETE";

export const redirect = (from: URL, to: string): never => {
    if (to.startsWith("/")) {
        from.pathname = to;
    } else {
        from.pathname += to;
    }
    document.location.href = from.href;
    throw "Redirecting"; // adding this so ts understands this function never returns
}


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


export const requestEndpoint = async (
    endpoint: string,
    token: string,
    method: RequestMethods = "GET",
    data: object|undefined = undefined): Promise<[any, number]> => {
    let init: RequestInit = {
        method: method,
        headers: {
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json"
        }
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

export const requestTemplate = async (templateName: string) => {
    let response = await fetch("./templates/result.html");
    return  await response.text();
}