import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const loginUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().min(1), password: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { authenticateUser } = await import("../auth.server");
    return authenticateUser(data.username, data.password);
  });

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      password: z.string().min(8),
      fullName: z.string().min(1),
      email: z.string().email(),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
      role: z.string().optional(),
      occupation: z.string().optional(),
      isPwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { createUser } = await import("../auth.server");
    return createUser(data as any);
  });

export const fetchUserById = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { getUserById } = await import("../auth.server");
    return getUserById(data.id);
  });

export const getUsers = createServerFn({ method: "POST" })
  .handler(async () => {
    const { getAllUsers } = await import("../auth.server");
    return getAllUsers();
  });

export const createUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      password: z.string().min(8),
      fullName: z.string().min(1),
      email: z.string().email(),
      role: z.string().optional(),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
      occupation: z.string().optional(),
      isPwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { createUser: createServerUser } = await import("../auth.server");
    return createServerUser(data as any);
  });

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      username: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      role: z.string().min(1),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
      password: z.string().min(8).or(z.literal("")).optional(),
      approved: z.boolean().optional(),
      occupation: z.string().optional(),
      isPwd: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { updateUser: updateServerUser } = await import("../auth.server");
    return updateServerUser(data as any);
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const { deleteUser: removeUser } = await import("../auth.server");
    return removeUser(data.id);
  });

export const getBarangayInfo = createServerFn({ method: "POST" })
  .handler(async () => {
    const { getBarangayInfo: getInfo } = await import("../auth.server");
    return getInfo();
  });

export const saveBarangayInfo = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().optional(),
    municipality: z.string().optional(),
    province: z.string().optional(),
    address: z.string().optional(),
    contact: z.string().optional(),
    email: z.string().optional(),
    captain: z.string().optional(),
  }))
  .handler(async ({ data }) => {
    const { saveBarangayInfo: saveInfo } = await import("../auth.server");
    return saveInfo(data);
  });

export const getDashboardStats = createServerFn({ method: "POST" })
  .handler(async () => {
    const { getDashboardStats: getStats } = await import("../auth.server");
    return getStats();
  });

export const submitContactInquiry = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const { readTableData, writeTableData } = await import("../auth.server");
    const existing = (await readTableData("inquiries")) || [];
    const newInquiry = {
      id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4),
      name: data.name,
      email: data.email,
      message: data.message,
      createdAt: new Date().toISOString(),
    };
    await writeTableData("inquiries", [newInquiry, ...existing]);
    return { success: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().min(1),
      fullName: z.string().min(1),
      email: z.string().email(),
      contact: z.string().optional(),
      address: z.string().optional(),
      birthdate: z.string().optional(),
      gender: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { updateUserProfile } = await import("../auth.server");
    return updateUserProfile(data);
  });

export const getTableData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ table: z.string() }))
  .handler(async ({ data }) => {
    const { readTableData } = await import("../auth.server");
    return readTableData(data.table);
  });

export const saveTableData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ table: z.string(), data: z.array(z.any()) }))
  .handler(async ({ data }) => {
    const { writeTableData } = await import("../auth.server");
    return writeTableData(data.table, data.data);
  });
