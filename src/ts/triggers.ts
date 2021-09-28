export const logout = (event) => {
    event.preventDefault();
    localStorage.removeItem("token");
    location.reload();
}
