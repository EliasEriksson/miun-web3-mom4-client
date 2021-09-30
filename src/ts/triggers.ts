/**
 * removes the token from localstorage and refreshes the page.
 *
 * since the page is refreshed each page that requires the token will
 * again check if its present and will take proper action if it is not.
 * @param event
 */
export const logout = (event) => {
    event.preventDefault();
    localStorage.removeItem("token");
    location.reload();
}
