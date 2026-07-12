import api from './api';
import { Department, Employee, PaginatedResponse, User } from '../types';

export const organizationService = {
  // --- Departments ---
  
  async listDepartments(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<PaginatedResponse<Department>> {
    const response = await api.get('/organization/departments', { params });
    return response.data;
  },

  async getDepartment(id: string): Promise<Department> {
    const response = await api.get(`/organization/departments/${id}`);
    return response.data;
  },

  async createDepartment(data: {
    name: string;
    code: string;
    description?: string;
    manager_id?: string;
    parent_department_id?: string;
  }): Promise<Department> {
    const response = await api.post('/organization/departments', data);
    return response.data;
  },

  async updateDepartment(
    id: string,
    data: Partial<{
      name: string;
      code: string;
      description?: string;
      manager_id?: string;
      parent_department_id?: string;
    }>
  ): Promise<Department> {
    const response = await api.put(`/organization/departments/${id}`, data);
    return response.data;
  },

  async deleteDepartment(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/organization/departments/${id}`);
    return response.data;
  },

  // --- Employees ---

  async listEmployees(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    department_id?: string;
    role?: string;
  }): Promise<PaginatedResponse<Employee>> {
    const response = await api.get('/organization/employees', { params });
    return response.data;
  },

  async getEmployee(id: string): Promise<Employee> {
    const response = await api.get(`/organization/employees/${id}`);
    return response.data;
  },

  async createEmployee(data: {
    employee_id: string;
    full_name: string;
    email: string;
    department_id: string;
    role: string;
    status: 'active' | 'inactive';
    joined_date: string;
  }): Promise<Employee> {
    const response = await api.post('/organization/employees', data);
    return response.data;
  },

  async updateEmployee(
    id: string,
    data: Partial<{
      employee_id: string;
      full_name: string;
      email: string;
      department_id: string;
      role: string;
      status: 'active' | 'inactive';
      joined_date: string;
    }>
  ): Promise<Employee> {
    const response = await api.put(`/organization/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/organization/employees/${id}`);
    return response.data;
  },

  // --- User Account Roles & Permissions Control (Admin only) ---
  
  async listUsers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    role?: string;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get('/organization/users', { params });
    return response.data;
  },

  async updateUserRole(id: string, role: string): Promise<User> {
    const response = await api.patch(`/organization/users/${id}/role`, null, {
      params: { role },
    });
    return response.data;
  },

  async toggleUserActive(id: string): Promise<User> {
    const response = await api.post(`/organization/users/${id}/toggle-status`);
    return response.data;
  }
};
