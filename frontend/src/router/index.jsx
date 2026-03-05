import { createBrowserRouter } from "react-router-dom";

import Layout from "./Layout";
import LoginFormPage from "../components/LoginFormPage/LoginFormPage";
import SignupFormPage from "../components/SignupFormPage";
import HomePage from "../components/HomePage";
import EditorPage from "../components/EditorPage/EditorPage";

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
                path: '/home',
                element: <HomePage />
            },
            {
                path: '/map/:id',
                element: <EditorPage />
            },
            {
                path: "*",
                element: <div>404 Page Not Found</div>
            }
        ]
    }
])