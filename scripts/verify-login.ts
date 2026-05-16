import { loginEmployee } from '@/actions/auth';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyLogin() {
    console.log('Testing loginEmployee with ADMIN01...');

    // Mock FormData
    const formData = new FormData();
    formData.append('name', 'Admin User');
    formData.append('employeeId', 'ADMIN01');

    try {
        const result = await loginEmployee(formData);
        console.log('Login result:', result);

        if (result.success) {
            console.log('Login successful!');
        } else {
            console.log('Login failed.');
        }
    } catch (error) {
        console.error('Login threw error:', error);
    }
}

verifyLogin();
