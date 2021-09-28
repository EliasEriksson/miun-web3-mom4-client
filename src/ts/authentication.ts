import {currentURL, redirect, requestToken} from "./url.js";
import {shake} from "./error.js";


if (localStorage.getItem("token")) {
    redirect(currentURL, "../");
}

window.addEventListener("load", () => {
    let usernameElement = <HTMLInputElement>document.getElementById("username");
    let passwordElement = <HTMLInputElement>document.getElementById("password");
    let loginButtonElement = document.getElementById("submit");
    let errorElement = document.getElementById("error");
    let loginFormElement = document.getElementById("login-form");

    loginButtonElement.addEventListener("click", async (event) => {
        event.preventDefault();
        let token: {token: string} = await requestToken(
            usernameElement.value, passwordElement.value
        );
        if (token.token) {
            localStorage.setItem("token", token.token);
            redirect(currentURL, "../");
        } else {
            errorElement.innerText = "Inloggning misslyckates. Skrev du rätt användarnamn och lösenord?"
            shake(loginFormElement);
            shake(errorElement);
        }
    });
});