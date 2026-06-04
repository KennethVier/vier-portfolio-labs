import axios from "axios";
import { DOCUMENT_API } from "../config";

export const uploadPdf = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
        `${DOCUMENT_API}/upload`,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" }
        }
    );

    return response.data;
};
