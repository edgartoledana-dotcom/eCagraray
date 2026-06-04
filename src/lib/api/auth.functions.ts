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
    }),
  )
  .handler(async ({ data }) => {
    const { createUser } = await import("../auth.server");
    return createUser(data);
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
    }),
  )
  .handler(async ({ data }) => {
    const { createUser: createServerUser } = await import("../auth.server");
    return createServerUser(data);
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
      password: z.string().min(8).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { updateUser: updateServerUser } = await import("../auth.server");
    return updateServerUser(data);
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
