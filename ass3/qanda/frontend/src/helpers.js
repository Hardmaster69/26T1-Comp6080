/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 * 
 * Example Usage:
 *   const file = document.querySelector('input[type="file"]').files[0];
 *   console.log(fileToDataUrl(file));
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
    const validFileTypes = [ 'image/jpeg', 'image/png', 'image/jpg' ]
    const valid = validFileTypes.find(type => type === file.type);
    // Bad data, let's walk away.
    if (!valid) {
        throw Error('provided file is not a png, jpg or jpeg image.');
    }
    
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve,reject) => {
        reader.onerror = reject;
        reader.onload = () => resolve(reader.result);
    });
    reader.readAsDataURL(file);
    return dataUrlPromise;
}


/**
 * creat DOM, avoid string-to-DOM
 * @param {string} tag 
 * @param {object} attributes 
 * @param {Array|string} children 
 * @returns {HTMLElement} 
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    // set all attribute
    for (const [key, value] of Object.entries(attributes)) {
        // if function
        if (key.startsWith('on') && typeof value === 'function') {
            // fix the btn problem
            element[key] = value; 
        } 
        // if class
        else if (key === 'className' || key === 'class') {
            element.className = value;
        } 
        // others
        else {
            element.setAttribute(key, value);
        }
    }

    // if text, use innertext
    if (typeof children === 'string') {
        element.innerText = children; 
    } 
    // if array
    else if (Array.isArray(children)) {
        children.forEach(child => {
            if (child instanceof HTMLElement) {
                element.appendChild(child);
            } else if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            }
        });
    }

    return element;
}


// deal with all the api request
import { BACKEND_PORT } from './config.js';

/**
 * @param {string} path
 * @param {string} method
 * @param {object} body
 * @returns {Promise}
 */
export function apiCall(path, method = 'GET', body = null) {
    const options = {
        method: method,
        headers: {
            'Content-type': 'application/json',
        },
    };

    // init token
    const token = localStorage.getItem('token');
    if (token) {
        // add Breaer
        options.headers['Authorization'] = `Bearer ${token}`; 
    }

    // if method == get/post, change to JSON
    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        options.body = JSON.stringify(body);
    }

    // send request
    return fetch(`http://localhost:${BACKEND_PORT}${path}`, options)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        });
}


// cal time
/**
 * @param {string|number} timestamp 
 * @returns {string}
 */
export const formatTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now - past;
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);

    if (diffInSecs < 60) return "Just now";
    if (diffInMins < 60) return `${diffInMins} minute(s) ago`;
    if (diffInHours < 24) return `${diffInHours} hour(s) ago`;
    if (diffInDays < 7) return `${diffInDays} day(s) ago`;
    return `${diffInWeeks} week(s) ago`;
};