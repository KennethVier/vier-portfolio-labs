import axios from "axios";
import { QUIZ_API } from "../config";

export const generateQuiz = async (payload) => {
    const response = await axios.post(
        `${QUIZ_API}/generate`,
        payload
    );

    return response.data;
};
