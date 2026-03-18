import { createBrowserRouter } from "react-router-dom";

import Layout from "./Layout";
import LoginFormPage from "../components/LoginFormPage/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import DashboardPage from "../components/DashboardPage";
import EditorPage from "../components/EditorPage/EditorPage";
import RenderHomePage from "../components/RenderHomePage";
import RenderPage from "../components/RenderPage";

export const router = createBrowserRouter([
    {
        element: <Layout />,
        children: [
            {
                path: '',
                element: (
                    <div />
                )
            },
            {
                path: '/login',
                element: <LoginFormPage />
            },
            {
                path: '/signup',
                element: <SignupFormPage />
            },
            {
                path: '/dashboard',
                element: <DashboardPage />
            },
            {
                path: '/editor',
                element: <EditorPage />
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
                element: <div>404 Page Not Found</div>
            }
        ]
    }
])