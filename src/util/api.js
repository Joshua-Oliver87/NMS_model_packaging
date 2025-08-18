import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL;
//const baseURL = "http://localhost";

const API = axios.create({
    baseURL: baseURL
});

API.interceptors.request.use((config) => {
    config.headers["favorite-unit"] = localStorage.getItem("favoriteUnit") || "Metric";
    return config;
});

export default API;