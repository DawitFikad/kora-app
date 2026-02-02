import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface ContactData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export const supportService = {
    async sendContactMessage(data: ContactData) {
        try {
            const response = await axios.post(`${API_URL}/support/contact`, data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { error: 'Failed to send message' };
        }
    }
};
