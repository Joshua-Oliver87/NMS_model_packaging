// src/utils/cookieUtils.js

/**
 * Set a cookie in the browser.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} days - Number of days before the cookie expires.
 */
export function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = `${name}=${value}; path=/; ${expires}`;
}

/**
 * Get a cookie value by name.
 * @param {string} name - The name of the cookie.
 * @returns {string|null} - The cookie value or null if not found.
 */
export function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}

/**
 * Delete a cookie by setting its expiration date to the past.
 * @param {string} name - The name of the cookie to delete.
 */
export function deleteCookie(name) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
}

/**
 * Check if a cookie exists.
 * @param {string} name - The name of the cookie to check.
 * @returns {boolean} - True if the cookie exists, otherwise false.
 */
export function hasCookie(name) {
    return getCookie(name) !== null;
}
