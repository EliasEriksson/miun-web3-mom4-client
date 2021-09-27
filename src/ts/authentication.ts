import {apiURL, currentURL, redirect} from "./url.js";

if (currentURL.searchParams.has("token")) {
    redirect(currentURL, "../");
}

window.addEventListener("load", () => {
    let usernameElement = <HTMLInputElement>document.getElementById("username");
    let passwordElement = <HTMLInputElement>document.getElementById("password");
    let loginButtonElement = document.getElementById("submit");

    loginButtonElement.addEventListener("click", async (event) => {
        event.preventDefault();
        let response = await fetch(`${apiURL.href}token/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: usernameElement.value,
                password: passwordElement.value
            })
        });
        let token: {token: string} = await response.json();
        if (currentURL.searchParams.has("token")) {
            currentURL.searchParams.set("token", token.token);
        } else {
            currentURL.searchParams.append("token", token.token);
        }

        redirect(currentURL, "../");
    });
});