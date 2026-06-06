import { createBrowserRouter } from "react-router-dom";

import Layout from "./Layout";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import Dashboard from "../pages/Dashboard";
import MapPage from "../pages/MapPage/MapPage";
import RenderHomePage from "../pages/RenderHomePage";
import RenderPage from "../pages/RenderPage";
import HomePage from "../pages/HomePage";
import NotFoundPage from "../pages/NotFoundPage";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: '',
                element: <HomePage />
            },
            {
                path: '/login',
                element: <LoginPage />
            },
            {
                path: '/signup',
                element: <SignupPage />
            },
            {
                path: '/dashboard',
                element: <Dashboard />
            },
            {
                path: '/editor',
                element: <MapPage />
            },
            {
                path: '/render',
                element: <RenderHomePage />
            },
            {
                path: '/render/*',
                element: <RenderPage />
            },
            {
                path: "*",
                element: <NotFoundPage />
            }
        ]
    }
])
